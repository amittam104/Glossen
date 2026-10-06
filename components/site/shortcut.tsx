"use client"

import { useSyncExternalStore } from "react"
import { usesMacKeys } from "@/components/glossen/ui"

const subscribe = () => () => {}

export function Shortcut({ mac, other }: { mac: string; other: string }) {
  const isMac = useSyncExternalStore(subscribe, usesMacKeys, () => true)
  const keys = (isMac ? mac : other).split(" ")

  return (
    <span className="inline-flex gap-1">
      {keys.map((key) => (
        <kbd key={key}>{key}</kbd>
      ))}
    </span>
  )
}
