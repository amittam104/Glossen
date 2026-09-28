import { Chat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import {
  createUserParts,
  getMessagePage,
  getMessagePassages,
  getMessageText,
  glossenDataSchemas,
  glossenMetadataSchema,
  type GlossenUIMessage,
  type PageContext,
  type Passage,
} from "./message"
import {
  acquireGenerationLock,
  ConversationStorage,
  heartbeatInterval,
  isGenerationLive,
  recordVersion,
  waitForGenerationEnd,
  type ConversationRecord,
  type ConversationStatus,
  type Draft,
} from "./storage"

export interface StoreOptions {
  endpoint: string
  historyLimit: number
  namespace: string
}

export type ConversationState =
  "idle" | "generating" | "remote" | "interrupted" | "failed"

export interface ConversationSummary {
  id: string
  title: string
  activeAt: number
  state: ConversationState
}

export interface EditState {
  conversationId: string
  messageId: string
  text: string
  passages: Passage[]
  page: PageContext | null
  originalPage: PageContext | null
}

export interface StoreSnapshot {
  activeId: string
  conversations: ConversationSummary[]
  drafts: Record<string, Draft>
  records: Record<string, ConversationRecord>
  generating: Record<string, boolean>
  editing: EditState | null
  unreadable: number
  persistent: boolean
  storageFailed: boolean
}

const saveInterval = 1000

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
}

function emptyDraft(id: string): Draft {
  return {
    version: recordVersion,
    id,
    text: "",
    passages: [],
    includePage: true,
    updatedAt: 0,
  }
}

function getTitle(messages: GlossenUIMessage[]) {
  const first = messages.find((message) => message.role === "user")
  if (!first) return "New chat"
  const text =
    getMessageText(first).trim() || getMessagePassages(first)[0]?.text || ""
  const title = text.replace(/\s+/g, " ").trim()
  return title.length > 100 ? `${title.slice(0, 99)}…` : title || "New chat"
}

function isBusy(chat: Chat<GlossenUIMessage> | undefined) {
  return chat?.status === "submitted" || chat?.status === "streaming"
}

export class GlossenStore {
  readonly tabId = createId()
  private readonly storage: ConversationStorage
  private readonly options: StoreOptions
  private listeners = new Set<() => void>()
  private snapshot: StoreSnapshot
  private chats = new Map<string, Chat<GlossenUIMessage>>()
  private releases = new Map<string, () => void>()
  private deleted = new Set<string>()
  private watching = new Set<string>()
  private saveTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private lastSaved = new Map<string, number>()
  private draftTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private heartbeat: ReturnType<typeof setInterval> | undefined
  private started = false

  constructor(options: StoreOptions) {
    this.options = options
    this.storage = new ConversationStorage(options.namespace)
    const id = createId()
    this.snapshot = {
      activeId: id,
      conversations: [],
      drafts: {},
      records: {},
      generating: {},
      editing: null,
      unreadable: 0,
      persistent: options.historyLimit > 0,
      storageFailed: false,
    }
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot

  private set(patch: Partial<StoreSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch }
    if ("records" in patch || "generating" in patch)
      this.snapshot.conversations = this.summarize()
    for (const listener of this.listeners) listener()
  }

  private summarize(): ConversationSummary[] {
    const { records, generating } = this.snapshot
    return Object.values(records)
      .map((record) => ({
        id: record.id,
        title: record.title,
        activeAt: record.activeAt,
        state: this.stateOf(record, generating[record.id] ?? false),
      }))
      .sort((a, b) => b.activeAt - a.activeAt)
  }

  private stateOf(
    record: ConversationRecord,
    localGenerating: boolean
  ): ConversationState {
    if (localGenerating) return "generating"
    if (record.status === "generating")
      return record.owner === this.tabId ? "interrupted" : "remote"
    return record.status as Exclude<ConversationStatus, "generating">
  }

  get persistent() {
    return this.snapshot.persistent
  }

  private lockName(id: string) {
    return `${this.options.namespace}:generation:${id}`
  }

  start() {
    if (this.started) return () => {}
    this.started = true

    if (this.persistent && !this.storage.available()) this.failStorage()

    if (this.persistent) this.load()

    const onStorage = (event: StorageEvent) => this.onStorage(event)
    const onPageHide = () => this.flushAll()
    window.addEventListener("storage", onStorage)
    window.addEventListener("pagehide", onPageHide)
    this.heartbeat = setInterval(() => this.beat(), heartbeatInterval)

    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("pagehide", onPageHide)
      clearInterval(this.heartbeat)
      this.flushAll()
      this.started = false
    }
  }

  private load() {
    const { records, unreadable } = this.storage.listChats()
    const map: Record<string, ConversationRecord> = {}
    for (const record of records) map[record.id] = record

    const storedActive = this.storage.readActive()
    const activeId =
      storedActive &&
      (map[storedActive] || this.storage.readDraft(storedActive))
        ? storedActive
        : this.snapshot.activeId

    const drafts: Record<string, Draft> = {}
    for (const id of [activeId, ...Object.keys(map)]) {
      const draft = this.storage.readDraft(id)
      if (draft) drafts[id] = draft
    }

    this.storage.cleanup(activeId, new Set(Object.keys(map)))
    this.set({ records: map, drafts, activeId, unreadable: unreadable.length })
    void this.reconcile()
  }

  private async reconcile() {
    for (const record of Object.values(this.snapshot.records)) {
      if (record.status !== "generating") continue
      await this.checkLiveness(record.id)
    }
    this.trim()
  }

  private async checkLiveness(id: string) {
    const record = this.snapshot.records[id]
    if (!record || record.status !== "generating") return
    if (this.snapshot.generating[id]) return
    const live = await isGenerationLive(this.lockName(id), record)
    if (live) this.watch(id)
    else this.markInterrupted(id)
  }

  private watch(id: string) {
    if (this.watching.has(id)) return
    this.watching.add(id)
    void waitForGenerationEnd(this.lockName(id)).then(() => {
      this.watching.delete(id)
      const stored = this.storage.readChat(id)
      if (!stored || stored === "unreadable") return
      this.applyRemote(stored)
      if (stored.status === "generating" && !this.snapshot.generating[id]) {
        void this.checkLiveness(id)
      }
    })
  }

  private markInterrupted(id: string) {
    const stored = this.storage.readChat(id)
    if (!stored || stored === "unreadable" || stored.status !== "generating")
      return
    const record: ConversationRecord = {
      ...stored,
      status: "interrupted",
      owner: undefined,
      rev: stored.rev + 1,
    }
    this.writeRecord(record)
    this.applyRemote(record)
  }

  private beat() {
    for (const id of Object.keys(this.snapshot.generating)) {
      if (this.snapshot.generating[id]) this.save(id)
    }
  }

  private failStorage() {
    this.set({ persistent: false, storageFailed: true })
  }

  private writeRecord(record: ConversationRecord) {
    if (!this.persistent) return
    try {
      this.storage.writeChat(record)
    } catch {
      this.failStorage()
    }
  }

  private onStorage(event: StorageEvent) {
    if (!this.persistent) return
    if (event.key === null) {
      this.load()
      return
    }
    const parsed = this.storage.parseKey(event.key)
    if (!parsed) return

    if (parsed.kind === "deleted") {
      if (event.newValue !== null) this.removeLocal(parsed.id)
      return
    }
    if (parsed.kind === "chat") {
      if (event.newValue === null) {
        if (this.storage.isDeleted(parsed.id)) this.removeLocal(parsed.id)
        return
      }
      const record = this.storage.parseChat(event.newValue)
      if (record && record !== "unreadable") {
        this.applyRemote(record)
        if (record.status === "generating") void this.checkLiveness(record.id)
      }
      return
    }
    if (parsed.kind === "draft") {
      const draft = this.storage.parseDraft(event.newValue)
      const current = this.snapshot.drafts[parsed.id]
      if (draft && draft.updatedAt > (current?.updatedAt ?? 0)) {
        this.set({ drafts: { ...this.snapshot.drafts, [parsed.id]: draft } })
      }
    }
  }

  private applyRemote(record: ConversationRecord) {
    if (this.deleted.has(record.id)) return
    if (this.snapshot.generating[record.id]) return
    const current = this.snapshot.records[record.id]
    if (current && current.rev >= record.rev) return

    const chat = this.chats.get(record.id)
    if (chat && !isBusy(chat)) chat.messages = record.messages
    this.set({ records: { ...this.snapshot.records, [record.id]: record } })
  }

  private removeLocal(id: string) {
    this.deleted.add(id)
    const chat = this.chats.get(id)
    if (chat) void chat.stop()
    this.chats.delete(id)
    this.releases.get(id)?.()
    this.releases.delete(id)
    clearTimeout(this.saveTimers.get(id))
    this.saveTimers.delete(id)

    const records = { ...this.snapshot.records }
    const drafts = { ...this.snapshot.drafts }
    const generating = { ...this.snapshot.generating }
    delete records[id]
    delete drafts[id]
    delete generating[id]
    const patch: Partial<StoreSnapshot> = { records, drafts, generating }
    if (this.snapshot.editing?.conversationId === id) patch.editing = null
    if (this.snapshot.activeId === id) patch.activeId = createId()
    this.set(patch)
  }

  getChat(id: string) {
    let chat = this.chats.get(id)
    if (!chat) {
      chat = new Chat<GlossenUIMessage>({
        id,
        messages: this.snapshot.records[id]?.messages ?? [],
        transport: new DefaultChatTransport({ api: this.options.endpoint }),
        dataPartSchemas: glossenDataSchemas,
        messageMetadataSchema: glossenMetadataSchema,
      })
      chat["~registerMessagesCallback"](() => this.scheduleSave(id))
      this.chats.set(id, chat)
    }
    return chat
  }

  private scheduleSave(id: string) {
    if (!this.snapshot.generating[id]) return
    if (this.saveTimers.has(id)) return
    const wait = Math.max(
      0,
      saveInterval - (Date.now() - (this.lastSaved.get(id) ?? 0))
    )
    this.saveTimers.set(
      id,
      setTimeout(() => {
        this.saveTimers.delete(id)
        this.save(id)
      }, wait)
    )
  }

  private save(id: string, patch: Partial<ConversationRecord> = {}) {
    clearTimeout(this.saveTimers.get(id))
    this.saveTimers.delete(id)
    if (this.deleted.has(id) || this.storage.isDeleted(id)) return

    const chat = this.chats.get(id)
    const current = this.snapshot.records[id]
    const messages = chat?.messages ?? current?.messages ?? []
    if (!current && messages.length === 0) return

    const now = Date.now()
    const stored = this.persistent ? this.storage.readChat(id) : null
    const baseRev = Math.max(
      current?.rev ?? 0,
      stored && stored !== "unreadable" ? stored.rev : 0
    )
    const record: ConversationRecord = {
      version: recordVersion,
      id,
      title: getTitle(messages),
      createdAt: current?.createdAt ?? now,
      activeAt: current?.activeAt ?? now,
      status: current?.status ?? "idle",
      owner: current?.owner,
      error: current?.error,
      ...patch,
      heartbeat: now,
      rev: baseRev + 1,
      messages,
    }
    if (record.status !== "generating") {
      delete record.owner
      delete record.heartbeat
    }
    if (record.status !== "failed") delete record.error

    this.lastSaved.set(id, now)
    this.writeRecord(record)
    this.set({ records: { ...this.snapshot.records, [id]: record } })
  }

  private flushAll() {
    for (const id of this.saveTimers.keys()) this.save(id)
    for (const [id, timer] of this.draftTimers) {
      clearTimeout(timer)
      this.writeDraft(id)
    }
    this.draftTimers.clear()
  }

  private trim() {
    const limit = this.options.historyLimit
    if (!this.persistent) return
    const idle = Object.values(this.snapshot.records)
      .filter(
        (record) =>
          record.status !== "generating" &&
          !this.snapshot.generating[record.id] &&
          record.id !== this.snapshot.activeId
      )
      .sort((a, b) => a.activeAt - b.activeAt)
    let excess = Object.keys(this.snapshot.records).length - limit
    for (const record of idle) {
      if (excess <= 0) break
      this.deleteConversation(record.id)
      excess--
    }
  }

  // Drafts

  getDraft(id: string) {
    return this.snapshot.drafts[id] ?? emptyDraft(id)
  }

  updateDraft(id: string, update: Partial<Omit<Draft, "id" | "version">>) {
    const draft: Draft = {
      ...this.getDraft(id),
      ...update,
      updatedAt: Date.now(),
    }
    this.set({ drafts: { ...this.snapshot.drafts, [id]: draft } })
    if (!this.persistent) return
    clearTimeout(this.draftTimers.get(id))
    this.draftTimers.set(
      id,
      setTimeout(() => {
        this.draftTimers.delete(id)
        this.writeDraft(id)
      }, 250)
    )
  }

  private writeDraft(id: string) {
    if (!this.persistent || this.deleted.has(id)) return
    const draft = this.snapshot.drafts[id]
    if (!draft) return
    try {
      if (!draft.text && draft.passages.length === 0 && draft.includePage)
        this.storage.removeDraft(id)
      else this.storage.writeDraft(draft)
    } catch {
      this.failStorage()
    }
  }

  addPassage(passage: Passage) {
    const editing = this.snapshot.editing
    if (editing && editing.conversationId === this.snapshot.activeId) {
      this.set({
        editing: { ...editing, passages: [...editing.passages, passage] },
      })
      return
    }
    const id = this.snapshot.activeId
    this.updateDraft(id, {
      passages: [...this.getDraft(id).passages, passage],
    })
  }

  // Navigation between conversations

  select(id: string) {
    const patch: Partial<StoreSnapshot> = { activeId: id }
    if (this.snapshot.editing?.conversationId !== id) patch.editing = null
    if (!this.snapshot.drafts[id] && this.persistent) {
      const draft = this.storage.readDraft(id)
      if (draft) patch.drafts = { ...this.snapshot.drafts, [id]: draft }
    }
    this.set(patch)
    this.writeActive(id)
  }

  newChat() {
    const current = this.snapshot.activeId
    if (!this.snapshot.records[current] && !isBusy(this.chats.get(current))) {
      this.set({ editing: null })
      return
    }
    this.select(createId())
  }

  private writeActive(id: string) {
    if (!this.persistent) return
    try {
      this.storage.writeActive(id)
    } catch {
      this.failStorage()
    }
  }

  deleteConversation(id: string) {
    this.removeLocal(id)
    if (this.persistent) {
      try {
        this.storage.deleteChat(id)
      } catch {
        this.failStorage()
      }
    }
    if (this.snapshot.activeId !== id) this.writeActive(this.snapshot.activeId)
  }

  clearHistory() {
    for (const id of Object.keys(this.snapshot.records))
      this.deleteConversation(id)
  }

  // Generation

  canSend(id: string) {
    const record = this.snapshot.records[id]
    if (isBusy(this.chats.get(id))) return false
    if (record?.status === "generating" && !this.snapshot.generating[id])
      return false
    return true
  }

  private async run(
    id: string,
    action: (chat: Chat<GlossenUIMessage>) => Promise<void>,
    prepare?: () => boolean
  ) {
    if (!this.canSend(id)) return false
    const release = await acquireGenerationLock(this.lockName(id))
    if (!release) {
      void this.checkLiveness(id)
      return false
    }
    if (!this.canSend(id) || (prepare && !prepare())) {
      release()
      return false
    }

    const stored = this.persistent ? this.storage.readChat(id) : null
    if (stored && stored !== "unreadable") this.applyRemote(stored)

    this.deleted.delete(id)
    this.releases.set(id, release)
    const chat = this.getChat(id)
    chat.clearError()
    this.set({ generating: { ...this.snapshot.generating, [id]: true } })

    const existed = Boolean(this.snapshot.records[id])
    const started = action(chat)
    this.save(id, {
      status: "generating",
      owner: this.tabId,
      activeAt: Date.now(),
    })
    if (!existed) this.trim()

    try {
      await started
    } finally {
      const generating = { ...this.snapshot.generating }
      delete generating[id]
      this.set({ generating })
      if (!this.deleted.has(id)) {
        const failed = chat.status === "error"
        this.save(id, {
          status: failed ? "failed" : "idle",
          owner: undefined,
          error: failed ? chat.error?.message : undefined,
          activeAt: Date.now(),
        })
      }
      this.releases.delete(id)
      release()
      this.trim()
    }
    return true
  }

  send(id: string, page: PageContext | null) {
    const draft = this.getDraft(id)
    const text = draft.text.trim()
    if (!text && draft.passages.length === 0) return Promise.resolve(false)

    return this.run(
      id,
      (chat) =>
        chat.sendMessage({
          parts: createUserParts({
            text,
            passages: draft.passages,
            page: draft.includePage ? page : null,
          }),
        }),
      () => {
        this.updateDraft(id, { text: "", passages: [] })
        return true
      }
    )
  }

  regenerate(id: string) {
    return this.run(id, (chat) => chat.regenerate())
  }

  stop(id: string) {
    void this.chats.get(id)?.stop()
  }

  // Editing earlier questions

  startEdit(conversationId: string, messageId: string) {
    const message = this.getChat(conversationId).messages.find(
      (item) => item.id === messageId
    )
    if (!message) return
    const page = getMessagePage(message) ?? null
    this.set({
      editing: {
        conversationId,
        messageId,
        text: getMessageText(message),
        passages: getMessagePassages(message),
        page,
        originalPage: page,
      },
    })
  }

  updateEdit(update: Partial<Omit<EditState, "conversationId" | "messageId">>) {
    const editing = this.snapshot.editing
    if (editing) this.set({ editing: { ...editing, ...update } })
  }

  cancelEdit() {
    this.set({ editing: null })
  }

  saveEdit() {
    const editing = this.snapshot.editing
    if (!editing) return Promise.resolve(false)
    const text = editing.text.trim()
    if (!text && editing.passages.length === 0) return Promise.resolve(false)

    return this.run(
      editing.conversationId,
      (chat) =>
        chat.sendMessage({
          messageId: editing.messageId,
          parts: createUserParts({
            text,
            passages: editing.passages,
            page: editing.page,
          }),
        }),
      () => {
        this.set({ editing: null })
        return true
      }
    )
  }
}
