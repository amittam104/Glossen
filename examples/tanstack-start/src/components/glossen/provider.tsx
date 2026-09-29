"use client"

import {
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import { usePathname } from "fumadocs-core/framework"
import type { PageContext } from "./message"
import { GlossenStore } from "./store"

export interface GlossenOptions {
  /** Chat API route. */
  endpoint?: string
  /** Saved conversations kept in the browser. `0` keeps everything in memory. */
  historyLimit?: number
  /** Prefix for localStorage keys. */
  storageKey?: string
  welcome?: { title?: string; description?: string }
  placeholder?: string
  suggestions?: string[]
  /** Show Ask AI for selected documentation text. */
  selection?: boolean
  /** Element that holds the documentation content. */
  contentSelector?: string
}

export type ResolvedOptions = Required<Omit<GlossenOptions, "welcome">> & {
  welcome: { title: string; description: string }
}

export type GlossenView = "chat" | "history"

interface GlossenContextValue {
  store: GlossenStore
  options: ResolvedOptions
  open: boolean
  setOpen: (open: boolean) => void
  view: GlossenView
  setView: (view: GlossenView) => void
  page: PageContext | null
}

const noSuggestions: string[] = []

const GlossenContext = createContext<GlossenContextValue | null>(null)

function readPage(pathname: string, contentSelector: string): PageContext {
  const heading = document.querySelector(`${contentSelector} h1`)
  const title =
    heading?.textContent?.trim() || document.title.trim() || pathname
  return { title, url: pathname }
}

export function GlossenProvider({
  children,
  endpoint = "/api/chat",
  historyLimit = 20,
  storageKey = "glossen",
  welcome,
  placeholder = "Ask a question…",
  suggestions = noSuggestions,
  selection = true,
  contentSelector = "#nd-page",
}: GlossenOptions & { children: ReactNode }) {
  const [store] = useState(
    () =>
      new GlossenStore({
        endpoint,
        historyLimit: Math.max(0, historyLimit),
        namespace: storageKey,
      })
  )
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<GlossenView>("chat")
  const [page, setPage] = useState<PageContext | null>(null)
  const pathname = usePathname()

  useEffect(() => store.start(), [store])

  useEffect(() => {
    const update = () => setPage(readPage(pathname, contentSelector))
    update()
    const frame = requestAnimationFrame(update)
    const timer = setTimeout(update, 300)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [pathname, contentSelector])

  const value = useMemo<GlossenContextValue>(
    () => ({
      store,
      open,
      setOpen,
      view,
      setView,
      page,
      options: {
        endpoint,
        historyLimit,
        storageKey,
        placeholder,
        suggestions,
        selection,
        contentSelector,
        welcome: {
          title: welcome?.title ?? "Ask AI",
          description:
            welcome?.description ??
            "Ask anything about these docs. Answers link to the pages they come from.",
        },
      },
    }),
    [
      store,
      open,
      view,
      page,
      endpoint,
      historyLimit,
      storageKey,
      placeholder,
      suggestions,
      selection,
      contentSelector,
      welcome?.title,
      welcome?.description,
    ]
  )

  return <GlossenContext value={value}>{children}</GlossenContext>
}

export function useGlossen() {
  const context = use(GlossenContext)
  if (!context)
    throw new Error("Glossen components must be used inside <GlossenProvider>")
  return context
}

export function useGlossenState() {
  const { store } = useGlossen()
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  )
}
