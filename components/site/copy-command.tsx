"use client"

import { useEffect, useState } from "react"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { HugeiconsIcon } from "@hugeicons/react"

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(id)
  }, [copied])

  return (
    <div className="flex w-full max-w-2xl items-center gap-3 rounded-xl border bg-card/80 py-1.5 ps-4 pe-1.5 font-mono text-[13px] shadow-sm backdrop-blur">
      <span aria-hidden className="text-muted-foreground select-none">
        $
      </span>
      <code className="min-w-0 flex-1 truncate text-start">{command}</code>
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy install command"}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        onClick={() =>
          void navigator.clipboard
            .writeText(command)
            .then(() => setCopied(true))
        }
      >
        <HugeiconsIcon
          icon={copied ? Tick02Icon : Copy01Icon}
          aria-hidden
          className="size-4"
        />
      </button>
    </div>
  )
}
