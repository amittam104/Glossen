"use client"

import { useEffect, useEffectEvent, useRef, useState } from "react"
import { createPortal } from "react-dom"
import AiArtIcon from "@hugeicons/core-free-icons/AiArtIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import type { Passage } from "./message"
import { useGlossen } from "./provider"

const excluded =
  "[data-glossen-chat], [data-glossen-ignore], nav, header, footer, button, input, textarea, select, [contenteditable]:not([contenteditable='false']), #nd-toc, #nd-sidebar"

interface Target {
  passage: Passage
  rect: { top: number; bottom: number; left: number; right: number }
}

function elementOf(node: Node | null) {
  return node instanceof Element ? node : (node?.parentElement ?? null)
}

function headingText(heading: HTMLElement) {
  const clone = heading.cloneNode(true) as HTMLElement
  for (const node of clone.querySelectorAll("button, [aria-hidden='true']"))
    node.remove()
  return clone.textContent?.trim()
}

function readSelection(contentSelector: string): Target | null {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0)
    return null
  const text = selection.toString().trim()
  if (!text) return null

  const range = selection.getRangeAt(0)
  const scope = document.querySelector(contentSelector)
  const start = elementOf(range.startContainer)
  const end = elementOf(range.endContainer)
  if (!scope || !start || !end) return null
  if (!scope.contains(start) || !scope.contains(end)) return null
  if (start.closest(excluded) || end.closest(excluded)) return null

  let heading: HTMLElement | undefined
  for (const candidate of scope.querySelectorAll<HTMLElement>(
    "h2, h3, h4, h5, h6"
  )) {
    const position = candidate.compareDocumentPosition(start)
    if (
      candidate.contains(start) ||
      position & Node.DOCUMENT_POSITION_FOLLOWING
    )
      heading = candidate
    else break
  }

  const title =
    scope.querySelector("h1")?.textContent?.trim() ||
    document.title.trim() ||
    location.pathname
  const label = heading ? headingText(heading) : undefined
  const url =
    heading?.id && label
      ? `${location.pathname}#${encodeURIComponent(heading.id)}`
      : location.pathname

  const bounds = range.getBoundingClientRect()
  return {
    passage: {
      title,
      url,
      text,
      ...(label ? { heading: label } : {}),
    },
    rect: {
      top: bounds.top,
      bottom: bounds.bottom,
      left: bounds.left,
      right: bounds.right,
    },
  }
}

function isShortcut(event: KeyboardEvent) {
  return (
    event.altKey && !event.metaKey && !event.ctrlKey && event.code === "KeyA"
  )
}

export function SelectionAskAI() {
  const { store, setOpen, options } = useGlossen()
  const [target, setTarget] = useState<Target | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const update = useEffectEvent(() => {
    setTarget(readSelection(options.contentSelector))
  })

  const attach = (current: Target | null) => {
    if (!current) return
    store.addPassage(current.passage)
    window.getSelection()?.removeAllRanges()
    setTarget(null)
    setOpen(true)
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>(
          "[data-glossen-edit-input], [data-glossen-input]"
        )
        ?.focus()
    )
  }

  const onShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (!isShortcut(event)) return
    const current = readSelection(options.contentSelector)
    if (!current) return
    event.preventDefault()
    attach(current)
  })

  useEffect(() => {
    const schedule = () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(update, 120)
    }
    const hide = () => setTarget(null)
    const onKeyDown = (event: KeyboardEvent) => onShortcut(event)

    document.addEventListener("selectionchange", schedule)
    window.addEventListener("scroll", hide, { passive: true, capture: true })
    window.addEventListener("resize", hide)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      clearTimeout(timer.current)
      document.removeEventListener("selectionchange", schedule)
      window.removeEventListener("scroll", hide, { capture: true })
      window.removeEventListener("resize", hide)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [options.contentSelector])

  if (!target) return null

  const width = 104
  const left = Math.min(
    Math.max(8, (target.rect.left + target.rect.right) / 2 - width / 2),
    window.innerWidth - width - 8
  )
  const coarse = window.matchMedia("(pointer: coarse)").matches
  const below = coarse || target.rect.top < 56
  const top = below ? target.rect.bottom + 10 : target.rect.top - 44

  return createPortal(
    <button
      type="button"
      data-glossen-ignore=""
      aria-keyshortcuts="Alt+A"
      title="Ask AI about this selection (Alt+A)"
      style={{ top, left, width }}
      className="fixed z-50 flex h-9 items-center justify-center gap-1.5 rounded-full border bg-fd-popover text-[13px] font-medium text-fd-foreground shadow-lg transition-colors hover:bg-fd-accent focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none motion-safe:animate-[glossen-fade-up_200ms_ease-out_both]"
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => attach(readSelection(options.contentSelector) ?? target)}
    >
      <HugeiconsIcon icon={AiArtIcon} aria-hidden className="size-4" />
      Ask AI
    </button>,
    document.body
  )
}
