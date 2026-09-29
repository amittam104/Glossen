"use client"

// Portions adapted from Fumadocs AI search (MIT License, Copyright (c) 2023 Fuma).

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"
import { flushSync } from "react-dom"
import AiArtIcon from "@hugeicons/core-free-icons/AiArtIcon"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import PencilEdit02Icon from "@hugeicons/core-free-icons/PencilEdit02Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import { Composer, ConversationView } from "./conversation"
import { useGlossen, useGlossenState } from "./provider"
import { SelectionAskAI } from "./selection"
import type { ConversationState } from "./store"
import { fadeUp, GlossenStyles, IconButton, pluralize } from "./ui"

const stateLabels: Partial<Record<ConversationState, string>> = {
  generating: "Answering",
  remote: "Answering in another tab",
  interrupted: "Interrupted",
  failed: "Failed",
}

const relativeTime = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
})

function formatTime(time: number) {
  const minutes = Math.round((time - Date.now()) / 60000)
  if (Math.abs(minutes) < 1) return "just now"
  if (Math.abs(minutes) < 60) return relativeTime.format(minutes, "minute")
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return relativeTime.format(hours, "hour")
  return relativeTime.format(Math.round(hours / 24), "day")
}

function HistoryView({ onSelect }: { onSelect: () => void }) {
  const { store } = useGlossen()
  const state = useGlossenState()
  const [confirming, setConfirming] = useState(false)
  const count = state.conversations.length

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
        {state.storageFailed ? (
          <p className="px-2 py-2 text-xs text-fd-muted-foreground">
            This browser isn’t saving chats right now. They stay available until
            you leave the page.
          </p>
        ) : (
          !state.persistent && (
            <p className="px-2 py-2 text-xs text-fd-muted-foreground">
              Chats are kept only until you leave the page.
            </p>
          )
        )}
        {state.unreadable > 0 && (
          <p className="px-2 py-2 text-xs text-fd-muted-foreground">
            {pluralize(state.unreadable, "saved chat")} couldn’t be read. They
            may come from a newer version of this site, so they were left
            untouched.
          </p>
        )}
        {count === 0 ? (
          <p className="px-2 py-8 text-center text-[13px] text-fd-muted-foreground">
            No saved chats yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {state.conversations.map((conversation) => {
              const label = stateLabels[conversation.state]
              return (
                <li
                  key={conversation.id}
                  className={cn(
                    "group/row relative flex items-center rounded-lg",
                    conversation.id === state.activeId && "bg-fd-accent/60"
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg px-2.5 py-2 pe-10 text-start transition-colors hover:bg-fd-accent focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none"
                    aria-current={
                      conversation.id === state.activeId ? "true" : undefined
                    }
                    onClick={() => {
                      store.select(conversation.id)
                      onSelect()
                    }}
                  >
                    <span className="truncate text-[13px] font-medium">
                      {conversation.title}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-fd-muted-foreground">
                      {formatTime(conversation.activeAt)}
                      {label && (
                        <span
                          className={cn(
                            "rounded px-1 py-px font-medium",
                            conversation.state === "failed"
                              ? "bg-fd-error/10 text-fd-error"
                              : "bg-fd-secondary text-fd-foreground"
                          )}
                        >
                          {label}
                        </span>
                      )}
                    </span>
                  </button>
                  <IconButton
                    label="Delete chat"
                    icon={Delete02Icon}
                    tooltip="bottom-end"
                    className="absolute end-1.5 opacity-100 lg:opacity-0 lg:group-focus-within/row:opacity-100 lg:group-hover/row:opacity-100"
                    onClick={() => store.deleteConversation(conversation.id)}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {count > 0 && (
        <div className="shrink-0 border-t p-3">
          {confirming ? (
            <div
              role="alertdialog"
              aria-label="Clear all chats"
              className={cn("flex flex-col gap-2", fadeUp)}
            >
              <p className="text-[13px]">
                Delete all {pluralize(count, "chat")}? This can’t be undone.
              </p>
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  autoFocus
                  className="rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-fd-accent focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none"
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-fd-error px-2.5 py-1 text-xs font-medium text-white focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none"
                  onClick={() => {
                    store.clearHistory()
                    setConfirming(false)
                  }}
                >
                  Delete all
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="w-full rounded-lg px-2 py-1.5 text-xs font-medium text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none"
              onClick={() => setConfirming(true)}
            >
              Clear all chats
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Header() {
  const { store, setOpen, view, setView } = useGlossen()

  return (
    <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b ps-4 pe-2">
      <div className="flex min-w-0 items-center gap-2">
        {view === "history" ? (
          <IconButton
            label="Back to chat"
            icon={ArrowLeft01Icon}
            className="-ms-2"
            onClick={() => setView("chat")}
          />
        ) : (
          <HugeiconsIcon
            icon={AiArtIcon}
            aria-hidden
            className="size-4 shrink-0 text-fd-muted-foreground"
          />
        )}
        <h2 className="truncate text-sm font-medium">
          {view === "history" ? "History" : "Ask AI"}
        </h2>
      </div>

      <div className="flex items-center gap-0.5">
        {view === "chat" && (
          <IconButton
            label="History"
            icon={Clock01Icon}
            onClick={() => setView("history")}
          />
        )}
        <IconButton
          label="New chat"
          icon={PencilEdit02Icon}
          onClick={() => {
            store.newChat()
            setView("chat")
            requestAnimationFrame(() =>
              document
                .querySelector<HTMLTextAreaElement>("[data-glossen-input]")
                ?.focus()
            )
          }}
        />
        <IconButton
          label="Close"
          icon={Cancel01Icon}
          tooltip="bottom-end"
          onClick={() => setOpen(false)}
        />
      </div>
    </div>
  )
}

function useHotKeys() {
  const { open, setOpen } = useGlossen()

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape" && open && !event.defaultPrevented) {
      setOpen(false)
      event.preventDefault()
    }
    if (event.key === "/" && (event.metaKey || event.ctrlKey)) {
      setOpen(!open)
      event.preventDefault()
    }
  })

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])
}

const modalQuery = "(width < 64rem)"

function subscribeModal(onChange: () => void) {
  const query = window.matchMedia(modalQuery)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function useModal() {
  return useSyncExternalStore(
    subscribeModal,
    () => window.matchMedia(modalQuery).matches,
    () => false
  )
}

const focusable =
  "a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])"

function trapFocus(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return
  const items = [
    ...event.currentTarget.querySelectorAll<HTMLElement>(focusable),
  ].filter((item) => !item.closest("[inert]"))
  const first = items[0]
  const last = items.at(-1)
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) {
    last.focus()
    event.preventDefault()
  } else if (!event.shiftKey && document.activeElement === last) {
    first.focus()
    event.preventDefault()
  }
}

export function AskAIPanel({ className }: { className?: string }) {
  const { open, setOpen, options, view, setView } = useGlossen()
  const state = useGlossenState()
  const [rendered, setRendered] = useState(open)
  const modal = useModal()
  const panelRef = useRef<HTMLDivElement>(null)
  useHotKeys()

  if (open && !rendered) setRendered(true)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => {
      const panel = panelRef.current
      if (panel && !panel.contains(document.activeElement))
        (
          panel.querySelector<HTMLElement>(
            "[data-glossen-edit-input], [data-glossen-input]"
          ) ?? panel.querySelector<HTMLElement>(focusable)
        )?.focus()
    })
    return () => {
      const trigger = document.querySelector<HTMLElement>(
        "[data-glossen-trigger]"
      )
      if (previous && document.contains(previous) && previous !== document.body)
        previous.focus()
      else trigger?.focus()
    }
  }, [open])

  const close = () => {
    if (!open) flushSync(() => setRendered(false))
  }

  return (
    <>
      <GlossenStyles />
      {options.selection && <SelectionAskAI />}
      {rendered && (
        <div
          aria-hidden
          className={cn(
            "fixed inset-0 z-40 bg-black/30 backdrop-blur-xs lg:hidden",
            open ? "animate-fd-fade-in" : "animate-fd-fade-out"
          )}
          onClick={() => setOpen(false)}
          onAnimationEnd={close}
        />
      )}
      {rendered && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Ask AI"
          aria-modal={modal || undefined}
          data-glossen-chat=""
          className={cn(
            "fixed z-40 flex flex-col overflow-hidden bg-fd-background text-fd-foreground [--glossen-width:400px] 2xl:[--glossen-width:440px]",
            "max-lg:inset-x-2 max-lg:inset-y-4 max-lg:rounded-2xl max-lg:border max-lg:shadow-xl",
            "lg:inset-y-0 lg:end-0 lg:w-(--glossen-width) lg:border-s lg:shadow-2xl",
            open
              ? "animate-fd-dialog-in lg:animate-[glossen-open_200ms_cubic-bezier(0.23,1,0.32,1)]"
              : "animate-fd-dialog-out lg:animate-[glossen-close_200ms_ease-in]",
            className
          )}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) close()
          }}
          onKeyDown={modal ? trapFocus : undefined}
        >
          <Header />
          {view === "history" ? (
            <HistoryView onSelect={() => setView("chat")} />
          ) : (
            <>
              <ConversationView key={state.activeId} id={state.activeId} />
              <div className="shrink-0 px-3 pb-3">
                {state.storageFailed && (
                  <p
                    role="status"
                    className="mb-2 rounded-lg border px-2.5 py-1.5 text-[11px] text-fd-muted-foreground"
                  >
                    Chats aren’t being saved in this browser. They stay
                    available until you leave the page.
                  </p>
                )}
                <Composer id={state.activeId} />
                <p className="mt-2 text-center text-[11px] text-fd-muted-foreground">
                  AI can make mistakes. Check important answers.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

export function AskAITrigger({
  className,
  children,
  ...props
}: ComponentProps<"button">) {
  const { open, setOpen } = useGlossen()

  return (
    <button
      type="button"
      data-glossen-trigger=""
      aria-expanded={open}
      aria-keyshortcuts="Meta+/ Control+/"
      inert={open}
      className={cn(
        "fixed end-4 bottom-4 z-30 flex h-10 items-center gap-2 rounded-full border bg-fd-popover px-4 text-sm font-medium text-fd-foreground shadow-lg transition-[background-color,translate,opacity,scale] duration-200 hover:bg-fd-accent focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none motion-safe:active:scale-[0.97]",
        open && "pointer-events-none translate-y-10 opacity-0",
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children ?? (
        <>
          <HugeiconsIcon icon={AiArtIcon} aria-hidden className="size-4" />
          Ask AI
        </>
      )}
    </button>
  )
}
