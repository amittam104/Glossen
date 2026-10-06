"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import ArrowUp02Icon from "@hugeicons/core-free-icons/ArrowUp02Icon"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import CornerDownRightIcon from "@hugeicons/core-free-icons/CornerDownRightIcon"
import File01Icon from "@hugeicons/core-free-icons/File01Icon"
import File02Icon from "@hugeicons/core-free-icons/File02Icon"
import Refresh01Icon from "@hugeicons/core-free-icons/Refresh01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useGlossen } from "@/components/glossen"
import { createId } from "@/components/glossen/store"
import { IconButton } from "@/components/glossen/ui"
import { cn } from "@/lib/utils"

function useAsk() {
  const { store, page, setOpen } = useGlossen()

  return async (text: string) => {
    const question = text.trim()
    if (!question) return false
    const id = createId()
    store.select(id)
    store.updateDraft(id, { text: question, passages: [] })
    setOpen(true)
    return store.send(id, page)
  }
}

export function SuggestedQuestion({ children }: { children: string }) {
  const ask = useAsk()

  return (
    <button
      type="button"
      onClick={() => void ask(children)}
      className="group flex w-full cursor-pointer items-center gap-2.5 border-b py-2.5 text-start text-sm text-muted-foreground transition-colors last:border-b-0 hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
    >
      <HugeiconsIcon
        icon={CornerDownRightIcon}
        aria-hidden
        className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
      />
      {children}
    </button>
  )
}

export function ScrollHint({ target }: { target: string }) {
  return (
    <a
      href={`#${target}`}
      aria-label="Scroll to how it works"
      onClick={(event) => {
        const element = document.getElementById(target)
        if (!element) return
        event.preventDefault()
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
        element.scrollIntoView({ behavior: reduce ? "auto" : "smooth" })
      }}
      className="flex size-9 cursor-pointer items-center justify-center self-center rounded-full border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-safe:animate-[landing-nudge_2.4s_ease-in-out_infinite]"
    >
      <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden className="size-4" />
    </a>
  )
}

export function LandingComposer({ placeholder }: { placeholder: string }) {
  const ask = useAsk()
  const [text, setText] = useState("")
  const ready = text.trim().length > 0

  async function submit() {
    if (!ready) return
    const question = text
    setText("")
    if (!(await ask(question))) setText(question)
  }

  return (
    <div className="sticky bottom-0 z-10 border-t bg-background px-5 py-4">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
        className="flex flex-col gap-1 rounded-2xl border bg-card p-1.5 transition-colors focus-within:border-ring"
      >
        <label htmlFor="landing-question" className="sr-only">
          Ask a question about Glossen
        </label>
        <textarea
          id="landing-question"
          rows={1}
          value={text}
          placeholder={placeholder}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || event.keyCode === 229) return
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              void submit()
            }
          }}
          className="field-sizing-content max-h-40 min-h-9 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between ps-1">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">
            <HugeiconsIcon icon={File01Icon} aria-hidden className="size-3" />
            Page: Home
          </span>
          <button
            type="submit"
            aria-label="Send question"
            disabled={!ready}
            className={cn(
              "flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-default",
              ready
                ? "bg-primary text-primary-foreground hover:bg-primary/85"
                : "bg-secondary text-muted-foreground"
            )}
          >
            <HugeiconsIcon
              icon={ArrowUp02Icon}
              aria-hidden
              className="size-4"
            />
          </button>
        </div>
      </form>
    </div>
  )
}

export function AnswerActions({
  text,
  sources = [],
}: {
  text: string
  sources?: { title: string; href: string }[]
}) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(id)
  }, [copied])

  return (
    <div className="-ms-1 flex flex-wrap items-center gap-0.5">
      <IconButton
        label={copied ? "Copied" : "Copy answer"}
        icon={copied ? Tick02Icon : Copy01Icon}
        className="size-6 cursor-pointer rounded-md"
        onClick={() =>
          void navigator.clipboard.writeText(text).then(() => setCopied(true))
        }
      />
      <IconButton
        label="Regenerate"
        icon={Refresh01Icon}
        className="size-6 cursor-pointer rounded-md"
      />
      {sources.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="ms-1 flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <HugeiconsIcon icon={File02Icon} aria-hidden className="size-3.5" />
            {sources.length} {sources.length === 1 ? "source" : "sources"}
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              aria-hidden
              className={cn(
                "size-3 transition-transform",
                open && "rotate-180"
              )}
            />
          </button>
          {open && (
            <ul className="mt-1.5 flex basis-full flex-col rounded-xl border bg-card p-1">
              {sources.map((source) => (
                <li key={source.href}>
                  <Link
                    href={source.href}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <HugeiconsIcon
                      icon={File02Icon}
                      aria-hidden
                      className="size-3.5 shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                      {source.title}
                    </span>
                    <span className="shrink-0 font-mono text-[10.5px]">
                      {source.href}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
