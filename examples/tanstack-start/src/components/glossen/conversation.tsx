"use client"

import {
  memo,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type SyntheticEvent,
} from "react"
import { useChat } from "@ai-sdk/react"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import AiArtIcon from "@hugeicons/core-free-icons/AiArtIcon"
import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import ArrowUp02Icon from "@hugeicons/core-free-icons/ArrowUp02Icon"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import CornerDownRightIcon from "@hugeicons/core-free-icons/CornerDownRightIcon"
import File02Icon from "@hugeicons/core-free-icons/File02Icon"
import PencilEdit01Icon from "@hugeicons/core-free-icons/PencilEdit01Icon"
import Refresh01Icon from "@hugeicons/core-free-icons/Refresh01Icon"
import StopIcon from "@hugeicons/core-free-icons/StopIcon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "fumadocs-core/link"
import { cn } from "@/lib/cn"
import { Markdown } from "./markdown"
import {
  getMessagePage,
  getMessagePassages,
  getMessageSources,
  getMessageText,
  type GlossenUIMessage,
  type Source,
} from "./message"
import { useGlossen, useGlossenState } from "./provider"
import { readableError } from "./store"
import {
  Chevron,
  Collapsible,
  fadeUp,
  IconButton,
  Loader,
  PageChip,
  PassageChip,
  pluralize,
} from "./ui"

function useCloseOnMobile() {
  const { setOpen } = useGlossen()
  return () => {
    if (!window.matchMedia("(min-width: 64rem)").matches) setOpen(false)
  }
}

function AutoGrowTextarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <div className="grid max-h-40 min-w-0 flex-1 overflow-y-auto">
      <textarea
        rows={1}
        {...props}
        className={cn(
          "col-start-1 row-start-1 resize-none overflow-hidden bg-transparent [overflow-wrap:anywhere] placeholder:text-fd-muted-foreground focus-visible:outline-none",
          className
        )}
      />
      <div
        aria-hidden
        className={cn(
          "invisible col-start-1 row-start-1 [overflow-wrap:anywhere] whitespace-pre-wrap",
          className
        )}
      >
        {`${props.value?.toString() ?? ""}\n`}
      </div>
    </div>
  )
}

function isSubmitKey(event: React.KeyboardEvent) {
  // keyCode 229: Safari fires `compositionend` before this keydown
  if (event.nativeEvent.isComposing || event.keyCode === 229) return false
  return event.key === "Enter" && !event.shiftKey
}

function List({
  scrollKey,
  className,
  children,
}: {
  scrollKey: string
  className?: string
  children: React.ReactNode
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)

  useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return
    const observer = new ResizeObserver(() => {
      if (stickToBottom.current)
        container.scrollTo({ top: container.scrollHeight, behavior: "instant" })
    })
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    stickToBottom.current = true
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "instant",
    })
  }, [scrollKey])

  return (
    <div
      ref={containerRef}
      className={cn(
        "min-w-0 overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,transparent,white_0.75rem,white_calc(100%-1rem),transparent_100%)]",
        className
      )}
      onScroll={(event) => {
        const el = event.currentTarget
        stickToBottom.current =
          el.scrollHeight - el.scrollTop - el.clientHeight < 48
      }}
    >
      <div ref={contentRef} className="flex min-h-full flex-col">
        {children}
      </div>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(id)
  }, [copied])

  return (
    <IconButton
      label={copied ? "Copied" : "Copy answer"}
      icon={copied ? Tick02Icon : Copy01Icon}
      className="size-6 rounded-md"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => setCopied(true))
      }}
    />
  )
}

function SourceList({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false)
  const closeOnMobile = useCloseOnMobile()

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        className="ms-1 flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors duration-150 hover:bg-fd-accent focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none"
        onClick={() => setOpen(!open)}
      >
        <HugeiconsIcon
          icon={File02Icon}
          aria-hidden
          className="size-3.5 text-fd-muted-foreground"
        />
        <span className="text-xs text-fd-muted-foreground tabular-nums">
          {pluralize(sources.length, "source")}
        </span>
        <Chevron open={open} />
      </button>

      <div className="basis-full">
        <Collapsible open={open}>
          <ul className="mt-1.5 flex flex-col rounded-xl border bg-fd-card p-1">
            {sources.map((source) => (
              <li key={source.url}>
                <Link
                  href={source.url}
                  onClick={closeOnMobile}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-fd-muted-foreground transition-colors duration-150 hover:bg-fd-accent hover:text-fd-foreground"
                >
                  <HugeiconsIcon
                    icon={File02Icon}
                    aria-hidden
                    className="size-3.5 shrink-0"
                  />
                  <span className="min-w-0 flex-1 truncate font-medium text-fd-foreground">
                    {source.title}
                  </span>
                  <span className="max-w-[45%] shrink-0 truncate ps-2 font-mono text-[10.5px]">
                    {source.url}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Collapsible>
      </div>
    </>
  )
}

const AssistantMessage = memo(function AssistantMessage({
  message,
  busy,
  canRegenerate,
  onRegenerate,
}: {
  message: GlossenUIMessage
  busy: boolean
  canRegenerate: boolean
  onRegenerate?: () => void
}) {
  const closeOnMobile = useCloseOnMobile()
  const text = getMessageText(message)
  const sources = getMessageSources(message)
  const truncated = message.metadata?.finishReason === "length"

  return (
    <div className={cn("flex flex-col gap-2", fadeUp)}>
      {text.length > 0 ? (
        <div className="glossen-prose prose min-w-0">
          <Markdown text={text} onNavigate={closeOnMobile} />
        </div>
      ) : (
        busy && <Loader label="Thinking" />
      )}

      {truncated && !busy && (
        <p className="text-xs text-fd-muted-foreground">
          This answer stopped at the output limit.
        </p>
      )}

      {!busy && text.length > 0 && (
        <div className="-ms-1 flex flex-wrap items-center gap-0.5 motion-safe:animate-[glossen-fade-up_300ms_ease-out_both]">
          <CopyButton text={text} />
          {onRegenerate && (
            <IconButton
              label="Regenerate"
              icon={Refresh01Icon}
              disabled={!canRegenerate}
              className="size-6 rounded-md"
              onClick={onRegenerate}
            />
          )}
          {sources.length > 0 && <SourceList sources={sources} />}
        </div>
      )}
    </div>
  )
})

function EditForm({ canSave }: { canSave: boolean }) {
  const { store, page: currentPage } = useGlossen()
  const { editing } = useGlossenState()
  const closeOnMobile = useCloseOnMobile()
  if (!editing) return null

  const empty = !editing.text.trim() && editing.passages.length === 0
  const save = (event?: SyntheticEvent) => {
    event?.preventDefault()
    if (!canSave || empty) return
    void store.saveEdit()
  }
  const pageChanged =
    editing.page?.url !== editing.originalPage?.url ||
    editing.page?.title !== editing.originalPage?.title

  return (
    <form
      onSubmit={save}
      className={cn(
        "flex flex-col gap-2.5 rounded-2xl border bg-fd-card p-2.5",
        fadeUp
      )}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation()
          store.cancelEdit()
        }
      }}
    >
      <label className="sr-only" htmlFor="glossen-edit-input">
        Edit question
      </label>
      <div className="rounded-xl border bg-fd-background px-2.5 py-2">
        <AutoGrowTextarea
          id="glossen-edit-input"
          data-glossen-edit-input=""
          autoFocus
          value={editing.text}
          className="text-[13.5px] leading-5"
          onChange={(event) => store.updateEdit({ text: event.target.value })}
          onKeyDown={(event) => {
            if (isSubmitKey(event)) save(event)
          }}
        />
      </div>

      {editing.passages.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {editing.passages.map((passage, index) => (
            <PassageChip
              key={`${passage.url}-${index}`}
              passage={passage}
              onNavigate={closeOnMobile}
              onRemove={() =>
                store.updateEdit({
                  passages: editing.passages.filter((_, i) => i !== index),
                })
              }
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {editing.page ? (
          <PageChip
            page={editing.page}
            onNavigate={closeOnMobile}
            onRemove={() => store.updateEdit({ page: null })}
          />
        ) : (
          <span className="text-[11px] text-fd-muted-foreground">
            No page context
          </span>
        )}
        {currentPage && editing.page?.url !== currentPage.url && (
          <button
            type="button"
            className="text-[11px] text-fd-muted-foreground underline-offset-2 hover:text-fd-foreground hover:underline"
            onClick={() => store.updateEdit({ page: currentPage })}
          >
            Use current page
          </button>
        )}
        {pageChanged && editing.originalPage && (
          <button
            type="button"
            className="text-[11px] text-fd-muted-foreground underline-offset-2 hover:text-fd-foreground hover:underline"
            onClick={() => store.updateEdit({ page: editing.originalPage })}
          >
            Restore original page
          </button>
        )}
      </div>

      <p className="text-[11px] leading-snug text-fd-muted-foreground">
        Select text in the docs to attach more passages. Saving replaces this
        answer and every message after it.
      </p>

      <div className="flex justify-end gap-1.5">
        <button
          type="button"
          className="rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-fd-accent focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none"
          onClick={() => store.cancelEdit()}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSave || empty}
          className="rounded-lg bg-fd-primary px-2.5 py-1 text-xs font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/85 focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none disabled:opacity-50"
        >
          Save & regenerate
        </button>
      </div>
    </form>
  )
}

const UserMessage = memo(function UserMessage({
  message,
  editing,
  canEdit,
  onEdit,
}: {
  message: GlossenUIMessage
  editing: boolean
  canEdit: boolean
  onEdit: () => void
}) {
  const closeOnMobile = useCloseOnMobile()
  if (editing) return <EditForm canSave={canEdit} />

  const text = getMessageText(message)
  const passages = getMessagePassages(message)
  const page = getMessagePage(message)

  return (
    <div
      className={cn("group/user flex flex-col items-end gap-1.5 ps-10", fadeUp)}
    >
      {passages.length > 0 && (
        <div className="flex w-full flex-col gap-1.5">
          {passages.map((passage, index) => (
            <PassageChip
              key={`${passage.url}-${index}`}
              passage={passage}
              onNavigate={closeOnMobile}
            />
          ))}
        </div>
      )}
      {text && (
        <p className="rounded-2xl rounded-ee-md border bg-fd-secondary px-3.5 py-2 text-[13.5px] leading-[1.45] break-words whitespace-pre-wrap text-fd-foreground">
          {text}
        </p>
      )}
      <div className="flex max-w-full items-center gap-1">
        {page && (
          <PageChip page={page} prefix="Asked on" onNavigate={closeOnMobile} />
        )}
        <IconButton
          label="Edit question"
          icon={PencilEdit01Icon}
          disabled={!canEdit}
          className="size-6 rounded-md opacity-100 transition-opacity lg:opacity-0 lg:group-focus-within/user:opacity-100 lg:group-hover/user:opacity-100"
          onClick={onEdit}
        />
      </div>
    </div>
  )
})

function Notice({
  title,
  description,
  onRetry,
  tone = "error",
}: {
  title: string
  description: string
  onRetry?: () => void
  tone?: "error" | "muted"
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border p-3",
        tone === "error" ? "border-fd-error/25 bg-fd-error/5" : "bg-fd-card",
        fadeUp
      )}
    >
      <HugeiconsIcon
        icon={AlertCircleIcon}
        aria-hidden
        className={cn(
          "mt-px size-4 shrink-0",
          tone === "error" ? "text-fd-error" : "text-fd-muted-foreground"
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-[13px] font-medium">{title}</p>
        <p className="text-xs break-words text-fd-muted-foreground">
          {description}
        </p>
        {onRetry && (
          <button
            type="button"
            className="mt-1.5 flex w-fit items-center gap-1.5 rounded-lg border bg-fd-popover px-2 py-1 text-xs font-medium shadow-sm transition-colors duration-150 hover:bg-fd-accent focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none"
            onClick={onRetry}
          >
            <HugeiconsIcon
              icon={Refresh01Icon}
              aria-hidden
              className="size-3.5"
            />
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

function EmptyState({ id }: { id: string }) {
  const { store, options, page } = useGlossen()

  return (
    <div className={cn("mt-auto flex flex-col gap-6 pt-6", fadeUp)}>
      <div className="flex flex-col gap-1.5">
        <span className="mb-2 flex size-9 items-center justify-center rounded-xl border bg-fd-popover shadow-sm">
          <HugeiconsIcon icon={AiArtIcon} aria-hidden className="size-[18px]" />
        </span>
        <p className="text-[15px] font-medium">{options.welcome.title}</p>
        <p className="text-[13px] leading-relaxed text-pretty text-fd-muted-foreground">
          {options.welcome.description}
        </p>
      </div>

      {options.suggestions.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-fd-muted-foreground">
            Try asking
          </p>
          <ul className="flex flex-col">
            {options.suggestions.map((suggestion) => (
              <li key={suggestion} className="border-b last:border-0">
                <button
                  type="button"
                  className="-mx-1.5 flex w-[calc(100%+--spacing(3))] items-center gap-2 rounded-lg px-1.5 py-2 text-start text-[13px] transition-colors duration-100 hover:bg-fd-accent focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none"
                  onClick={() => {
                    store.updateDraft(id, { text: suggestion })
                    void store.send(id, page)
                  }}
                >
                  <HugeiconsIcon
                    icon={CornerDownRightIcon}
                    aria-hidden
                    className="size-3.5 shrink-0 text-fd-muted-foreground"
                  />
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function ConversationView({ id }: { id: string }) {
  const { store } = useGlossen()
  const state = useGlossenState()
  const chat = store.getChat(id)
  const { messages, status, error } = useChat({ chat })
  const record = state.records[id]
  const busy = status === "submitted" || status === "streaming"
  const remote = record?.status === "generating" && !state.generating[id]
  const canSend = !busy && !remote
  const visible = messages.filter((message) => message.role !== "system")
  const last = visible.at(-1)
  const userCount = visible.filter((message) => message.role === "user").length
  const failure =
    readableError(error) ??
    (record?.status === "failed" && !busy ? record.error : undefined)
  const regenerate = () => void store.regenerate(id)

  return (
    <List scrollKey={`${id}:${userCount}`} className="flex-1">
      <div className="flex flex-1 flex-col gap-5 px-4 py-5">
        {visible.length === 0 && !remote ? (
          <EmptyState id={id} />
        ) : (
          <>
            {visible.map((message) =>
              message.role === "user" ? (
                <UserMessage
                  key={message.id}
                  message={message}
                  editing={
                    state.editing?.conversationId === id &&
                    state.editing.messageId === message.id
                  }
                  canEdit={canSend}
                  onEdit={() => store.startEdit(id, message.id)}
                />
              ) : (
                <AssistantMessage
                  key={message.id}
                  message={message}
                  busy={(busy || remote) && message === last}
                  canRegenerate={canSend}
                  onRegenerate={message === last ? regenerate : undefined}
                />
              )
            )}
            {busy && last?.role === "user" && <Loader label="Thinking" />}
            {remote && <Loader label="Answering in another tab" />}
            {failure && !remote && (
              <Notice
                title="Couldn’t get an answer"
                description={failure}
                onRetry={canSend ? regenerate : undefined}
              />
            )}
            {record?.status === "interrupted" && !busy && !failure && (
              <Notice
                tone="muted"
                title="This answer was interrupted"
                description="The page was closed or reloaded before the answer finished. The saved part is shown above."
                onRetry={canSend ? regenerate : undefined}
              />
            )}
          </>
        )}
      </div>
    </List>
  )
}

export function Composer({ id }: { id: string }) {
  const { store, options, page } = useGlossen()
  const state = useGlossenState()
  const chat = store.getChat(id)
  const { status } = useChat({ chat })
  const closeOnMobile = useCloseOnMobile()
  const draft = state.drafts[id] ?? store.getDraft(id)
  const record = state.records[id]
  const busy = status === "submitted" || status === "streaming"
  const remote = record?.status === "generating" && !state.generating[id]
  const hasContent = draft.text.trim().length > 0 || draft.passages.length > 0
  const canSend = hasContent && !busy && !remote

  const submit = (event?: SyntheticEvent) => {
    event?.preventDefault()
    if (!canSend) return
    void store.send(id, page)
  }

  return (
    <div className="flex flex-col gap-2">
      {draft.passages.length > 0 && (
        <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
          {draft.passages.map((passage, index) => (
            <PassageChip
              key={`${passage.url}-${index}`}
              passage={passage}
              onNavigate={closeOnMobile}
              onRemove={() =>
                store.updateDraft(id, {
                  passages: draft.passages.filter((_, i) => i !== index),
                })
              }
            />
          ))}
        </div>
      )}
      <form
        className="flex cursor-text flex-col gap-1 rounded-2xl border bg-fd-popover p-1.5 shadow-sm transition-[border-color,box-shadow] duration-150 focus-within:border-fd-foreground/20 focus-within:shadow-md"
        onSubmit={submit}
        onClick={(event) => {
          if (event.target === event.currentTarget)
            event.currentTarget.querySelector("textarea")?.focus()
        }}
      >
        <div className="flex items-end gap-1">
          <AutoGrowTextarea
            data-glossen-input=""
            value={draft.text}
            aria-label="Ask a question"
            placeholder={options.placeholder}
            className="px-2 py-1.5 text-sm leading-5"
            onChange={(event) =>
              store.updateDraft(id, { text: event.target.value })
            }
            onKeyDown={(event) => {
              if (isSubmitKey(event)) submit(event)
            }}
          />
          {busy ? (
            <button
              key="stop"
              type="button"
              aria-label="Stop answer"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fd-primary text-fd-primary-foreground transition-[background-color,scale] duration-150 hover:bg-fd-primary/85 focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none motion-safe:active:scale-[0.94]"
              onClick={() => store.stop(id)}
            >
              <HugeiconsIcon
                icon={StopIcon}
                aria-hidden
                className="size-3.5 fill-current"
              />
            </button>
          ) : (
            <button
              key="send"
              type="submit"
              aria-label="Send question"
              disabled={!canSend}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full transition-[background-color,color,scale] duration-200 focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none motion-safe:enabled:active:scale-[0.94]",
                canSend
                  ? "bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/85"
                  : "bg-fd-secondary text-fd-muted-foreground"
              )}
            >
              <HugeiconsIcon
                icon={ArrowUp02Icon}
                aria-hidden
                className="size-4"
                strokeWidth={2.2}
              />
            </button>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-1 px-1">
          {page && draft.includePage ? (
            <PageChip
              page={page}
              onNavigate={closeOnMobile}
              onRemove={() => store.updateDraft(id, { includePage: false })}
            />
          ) : (
            page && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
                onClick={() => store.updateDraft(id, { includePage: true })}
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  aria-hidden
                  className="size-3"
                />
                Add current page
              </button>
            )
          )}
          {remote && (
            <span className="ms-auto truncate text-[11px] text-fd-muted-foreground">
              Answering in another tab
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
