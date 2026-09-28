"use client"

import { useEffect, useState, type ComponentProps, type ReactNode } from "react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import File02Icon from "@hugeicons/core-free-icons/File02Icon"
import QuoteDownIcon from "@hugeicons/core-free-icons/QuoteDownIcon"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import Link from "fumadocs-core/link"
import { cn } from "@/lib/utils"
import type { PageContext, Passage } from "./message"

export const fadeUp =
  "motion-safe:animate-[glossen-fade-up_400ms_cubic-bezier(0.23,1,0.32,1)_both]"

export function GlossenStyles() {
  return (
    <style>{`
@keyframes glossen-fade-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes glossen-shimmer { from { background-position: 150%; } to { background-position: -50%; } }
@keyframes glossen-pixel { 0%, 62%, 100% { opacity: 0.15; } 18%, 42% { opacity: 1; } }
@keyframes glossen-open { from { translate: 100% 0; } to { translate: 0 0; } }
@keyframes glossen-close { from { translate: 0 0; } to { translate: 100% 0; } }
.glossen-shimmer {
  background-image: linear-gradient(90deg, var(--color-fd-muted-foreground) 35%, var(--color-fd-foreground) 50%, var(--color-fd-muted-foreground) 65%);
  background-size: 200% 100%;
  background-clip: text;
  color: transparent;
  animation: glossen-shimmer 1.4s linear infinite;
}
.glossen-pixel { opacity: 0.15; animation: glossen-pixel 650ms ease-in-out infinite; }
.glossen-prose.prose { font-size: 0.84375rem; line-height: 1.65; }
.glossen-prose.prose > :first-child { margin-top: 0; }
.glossen-prose.prose > :last-child { margin-bottom: 0; }
.glossen-prose.prose :where(p, ul, ol, pre, figure, blockquote, table) { margin-block: 0.75em; }
.glossen-prose.prose :where(li) { margin-block: 0.25em; }
.glossen-prose.prose :where(h1, h2, h3, h4) { font-size: 0.875rem; font-weight: 600; margin-top: 1.25em; margin-bottom: 0.5em; }
@media (prefers-reduced-motion: reduce) {
  .glossen-shimmer { animation: none; background: none; color: var(--color-fd-muted-foreground); }
  .glossen-pixel { animation: none; opacity: 0.5; }
}
`}</style>
  )
}

export function IconButton({
  label,
  icon,
  tooltip = "bottom",
  className,
  ...props
}: ComponentProps<"button"> & {
  label: string
  icon: IconSvgElement
  tooltip?: "bottom" | "bottom-end" | "top"
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "group/icon relative flex size-7 shrink-0 items-center justify-center rounded-lg text-fd-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-fd-accent hover:text-fd-foreground focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 motion-safe:active:scale-[0.94]",
        className
      )}
      {...props}
    >
      <HugeiconsIcon icon={icon} aria-hidden className="size-4" />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute z-10 rounded-md bg-fd-foreground px-2 py-1 text-xs font-medium whitespace-nowrap text-fd-background opacity-0 transition-opacity delay-0 duration-150 group-hover/icon:opacity-100 group-hover/icon:delay-500 group-focus-visible/icon:opacity-100",
          tooltip === "top" && "bottom-full left-1/2 mb-1.5 -translate-x-1/2",
          tooltip === "bottom" && "top-full left-1/2 mt-1.5 -translate-x-1/2",
          tooltip === "bottom-end" && "end-0 top-full mt-1.5"
        )}
      >
        {label}
      </span>
    </button>
  )
}

export function Shimmer({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <span className={cn("glossen-shimmer", className)}>{children}</span>
}

const pixelDelays = [90, 180, 270, 0, 90, 180, 90, 180, 270]

export function Loader({ label }: { label: string }) {
  const [start] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - start), 100)
    return () => clearInterval(id)
  }, [start])

  return (
    <div role="status" className="flex w-fit items-center gap-2.5 py-1">
      <span
        aria-hidden
        className="grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px]"
      >
        {pixelDelays.map((delay, i) => (
          <span
            key={i}
            className="glossen-pixel size-1 rounded-[1px] bg-fd-foreground"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      <Shimmer className="text-[13px] font-medium">{label}</Shimmer>
      <span className="font-mono text-xs text-fd-muted-foreground tabular-nums">
        {(elapsed / 1000).toFixed(1)}s
      </span>
    </div>
  )
}

export function Collapsible({
  open,
  children,
}: {
  open: boolean
  children: ReactNode
}) {
  return (
    <div
      inert={!open}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}

export function Chevron({ open }: { open: boolean }) {
  return (
    <HugeiconsIcon
      icon={ArrowDown01Icon}
      aria-hidden
      strokeWidth={2.2}
      className={cn(
        "size-3.5 text-fd-muted-foreground transition-transform duration-300",
        open && "rotate-180"
      )}
    />
  )
}

export function pluralize(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`
}

export function PassageChip({
  passage,
  onRemove,
  onNavigate,
}: {
  passage: Passage
  onRemove?: () => void
  onNavigate?: () => void
}) {
  const label = passage.heading
    ? `${passage.title} › ${passage.heading}`
    : passage.title

  return (
    <div className="group/passage relative flex min-w-0 items-start gap-2 rounded-xl border bg-fd-card p-2 pe-8 text-start">
      <HugeiconsIcon
        icon={QuoteDownIcon}
        aria-hidden
        className="mt-0.5 size-3.5 shrink-0 text-fd-muted-foreground"
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <Link
          href={passage.url}
          onClick={onNavigate}
          className="truncate text-xs font-medium text-fd-foreground hover:underline"
        >
          {label}
        </Link>
        <p className="line-clamp-2 text-xs leading-snug break-words text-fd-muted-foreground">
          {passage.text}
        </p>
      </div>
      {onRemove && (
        <IconButton
          label="Remove passage"
          icon={Cancel01Icon}
          tooltip="bottom-end"
          className="absolute end-1 top-1 size-6 rounded-md"
          onClick={onRemove}
        />
      )}
    </div>
  )
}

export function PageChip({
  page,
  prefix = "Page",
  onRemove,
  onNavigate,
}: {
  page: PageContext
  prefix?: string
  onRemove?: () => void
  onNavigate?: () => void
}) {
  return (
    <span className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-md border bg-fd-secondary py-0.5 ps-1.5 pe-0.5 text-[11px] text-fd-muted-foreground">
      <HugeiconsIcon
        icon={File02Icon}
        aria-hidden
        className="size-3 shrink-0"
      />
      <span className="shrink-0">{prefix}:</span>
      <Link
        href={page.url}
        onClick={onNavigate}
        className="truncate font-medium text-fd-foreground hover:underline"
      >
        {page.title}
      </Link>
      {onRemove ? (
        <button
          type="button"
          aria-label="Remove page context"
          className="flex size-4 shrink-0 items-center justify-center rounded hover:bg-fd-accent hover:text-fd-foreground focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none"
          onClick={onRemove}
        >
          <HugeiconsIcon icon={Cancel01Icon} aria-hidden className="size-3" />
        </button>
      ) : (
        <span className="w-1" />
      )}
    </span>
  )
}
