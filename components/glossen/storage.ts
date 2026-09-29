import { z } from "zod"
import {
  pageSchema,
  passageSchema,
  sourceSchema,
  type GlossenUIMessage,
  type Passage,
} from "./message"

export const recordVersion = 1

export type ConversationStatus =
  "idle" | "generating" | "interrupted" | "failed"

export interface ConversationRecord {
  version: typeof recordVersion
  id: string
  title: string
  createdAt: number
  activeAt: number
  rev: number
  status: ConversationStatus
  owner?: string
  heartbeat?: number
  error?: string
  messages: GlossenUIMessage[]
}

export interface Draft {
  version: typeof recordVersion
  id: string
  text: string
  passages: Passage[]
  includePage: boolean
  updatedAt: number
}

const knownParts = [
  z.looseObject({ type: z.literal("text"), text: z.string() }),
  z.looseObject({ type: z.literal("data-page"), data: pageSchema }),
  z.looseObject({ type: z.literal("data-passage"), data: passageSchema }),
  z.looseObject({
    type: z.literal("data-sources"),
    data: z.array(sourceSchema),
  }),
]
const knownTypes: string[] = knownParts.map((part) => part.shape.type.value)

const messageSchema = z.looseObject({
  id: z.string(),
  role: z.enum(["system", "user", "assistant"]),
  parts: z.array(
    z.union([
      ...knownParts,
      z.looseObject({
        type: z.string().refine((type) => !knownTypes.includes(type)),
      }),
    ])
  ),
})

const recordSchema = z.object({
  version: z.literal(recordVersion),
  id: z.string(),
  title: z.string(),
  createdAt: z.number(),
  activeAt: z.number(),
  rev: z.number(),
  status: z.enum(["idle", "generating", "interrupted", "failed"]),
  owner: z.string().optional(),
  heartbeat: z.number().optional(),
  error: z.string().optional(),
  messages: z.array(messageSchema),
})

const draftSchema = z.object({
  version: z.literal(recordVersion),
  id: z.string(),
  text: z.string(),
  passages: z.array(passageSchema),
  includePage: z.boolean(),
  updatedAt: z.number(),
})

export type StorageKey =
  { kind: "chat" | "draft" | "deleted"; id: string } | { kind: "active" }

const tombstoneAge = 7 * 24 * 60 * 60 * 1000
const orphanDraftAge = 24 * 60 * 60 * 1000

export class ConversationStorage {
  readonly prefix: string

  constructor(namespace: string) {
    this.prefix = `${namespace}:`
  }

  private get storage(): Storage | null {
    try {
      return typeof window === "undefined" ? null : window.localStorage
    } catch {
      return null
    }
  }

  available() {
    return this.storage !== null
  }

  private key(kind: string, id?: string) {
    return id ? `${this.prefix}${kind}:${id}` : `${this.prefix}${kind}`
  }

  parseKey(key: string | null): StorageKey | null {
    if (!key?.startsWith(this.prefix)) return null
    const rest = key.slice(this.prefix.length)
    if (rest === "active") return { kind: "active" }
    const separator = rest.indexOf(":")
    if (separator === -1) return null
    const kind = rest.slice(0, separator)
    const id = rest.slice(separator + 1)
    if (kind === "chat" || kind === "draft" || kind === "deleted")
      return { kind, id }
    return null
  }

  private read(key: string) {
    try {
      return this.storage?.getItem(key) ?? null
    } catch {
      return null
    }
  }

  private write(key: string, value: string) {
    const storage = this.storage
    if (!storage) throw new Error("Storage is unavailable")
    storage.setItem(key, value)
  }

  private remove(key: string) {
    try {
      this.storage?.removeItem(key)
    } catch {}
  }

  parseChat(raw: string | null): ConversationRecord | "unreadable" | null {
    if (raw === null) return null
    try {
      const result = recordSchema.safeParse(JSON.parse(raw))
      return result.success
        ? (result.data as unknown as ConversationRecord)
        : "unreadable"
    } catch {
      return "unreadable"
    }
  }

  readChat(id: string) {
    return this.parseChat(this.read(this.key("chat", id)))
  }

  listChats() {
    const records: ConversationRecord[] = []
    const unreadable: string[] = []
    const storage = this.storage
    if (!storage) return { records, unreadable }

    for (let i = 0; i < storage.length; i++) {
      const parsed = this.parseKey(storage.key(i))
      if (parsed?.kind !== "chat") continue
      const record = this.readChat(parsed.id)
      if (record === "unreadable") unreadable.push(parsed.id)
      else if (record) records.push(record)
    }

    return { records, unreadable }
  }

  writeChat(record: ConversationRecord) {
    this.write(this.key("chat", record.id), JSON.stringify(record))
  }

  deleteChat(id: string) {
    this.write(this.key("deleted", id), String(Date.now()))
    this.remove(this.key("chat", id))
    this.remove(this.key("draft", id))
  }

  isDeleted(id: string) {
    return this.read(this.key("deleted", id)) !== null
  }

  parseDraft(raw: string | null): Draft | null {
    if (raw === null) return null
    try {
      const result = draftSchema.safeParse(JSON.parse(raw))
      return result.success ? result.data : null
    } catch {
      return null
    }
  }

  readDraft(id: string) {
    return this.parseDraft(this.read(this.key("draft", id)))
  }

  writeDraft(draft: Draft) {
    this.write(this.key("draft", draft.id), JSON.stringify(draft))
  }

  removeDraft(id: string) {
    this.remove(this.key("draft", id))
  }

  readActive() {
    return this.read(this.key("active"))
  }

  writeActive(id: string) {
    this.write(this.key("active"), id)
  }

  cleanup(activeId: string | null, chatIds: Set<string>) {
    const storage = this.storage
    if (!storage) return
    const now = Date.now()
    const keys: string[] = []
    for (let i = 0; i < storage.length; i++) keys.push(storage.key(i)!)

    for (const key of keys) {
      const parsed = this.parseKey(key)
      if (!parsed || parsed.kind === "active" || parsed.kind === "chat")
        continue
      if (parsed.kind === "deleted") {
        if (now - Number(this.read(key)) > tombstoneAge) this.remove(key)
        continue
      }
      if (parsed.id === activeId || chatIds.has(parsed.id)) continue
      const draft = this.readDraft(parsed.id)
      if (!draft || now - draft.updatedAt > orphanDraftAge) this.remove(key)
    }
  }
}

type LockManagerLike = {
  request: (
    name: string,
    options: { ifAvailable?: boolean },
    callback: (lock: unknown) => Promise<void> | void
  ) => Promise<unknown>
  query: () => Promise<{ held?: { name?: string }[] }>
}

function getLocks(): LockManagerLike | null {
  if (typeof navigator === "undefined" || !("locks" in navigator)) return null
  return navigator.locks as unknown as LockManagerLike
}

export const heartbeatInterval = 3000
const heartbeatTimeout = 12000

/**
 * Holds a Web Lock for as long as this tab generates an answer. The browser
 * releases it when the tab closes or reloads, which lets other tabs tell a
 * live generation from an interrupted one.
 */
export function acquireGenerationLock(
  name: string
): Promise<(() => void) | null> {
  const locks = getLocks()
  if (!locks) return Promise.resolve(() => {})

  return new Promise((resolve) => {
    void locks
      .request(name, { ifAvailable: true }, (lock) => {
        if (!lock) {
          resolve(null)
          return
        }
        return new Promise<void>((release) => resolve(() => release()))
      })
      .catch(() => resolve(() => {}))
  })
}

export async function isGenerationLive(
  name: string,
  record: ConversationRecord
): Promise<boolean> {
  const locks = getLocks()
  if (!locks) {
    return (
      record.heartbeat !== undefined &&
      Date.now() - record.heartbeat < heartbeatTimeout
    )
  }
  try {
    const { held = [] } = await locks.query()
    return held.some((lock) => lock.name === name)
  } catch {
    return true
  }
}

/** Resolves once no tab holds the generation lock anymore. */
export function waitForGenerationEnd(name: string): Promise<void> {
  const locks = getLocks()
  if (!locks) {
    return new Promise((resolve) => setTimeout(resolve, heartbeatTimeout))
  }
  return locks
    .request(name, {}, () => {})
    .then(
      () => {},
      () => {}
    )
}
