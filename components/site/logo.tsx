import type { ComponentProps } from "react"

export function Logo(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <rect width="24" height="24" rx="7" className="fill-fd-primary" />
      <path
        d="M16.5 8.6A5.2 5.2 0 1 0 17.2 13h-4.4"
        className="stroke-fd-primary-foreground"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 6.5c1.4-1.6 3.2-2.4 5.2-2.5"
        className="stroke-fd-primary-foreground/45"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
