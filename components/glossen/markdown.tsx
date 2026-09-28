"use client"

import { memo, type ComponentProps, type ReactElement } from "react"
import ReactMarkdown, { defaultUrlTransform } from "react-markdown"
import remarkGfm from "remark-gfm"
import Link from "fumadocs-core/link"
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock"

const safeProtocols = /^(https?:|mailto:)/i

export function safeUrl(url: string) {
  const transformed = defaultUrlTransform(url.trim())
  if (!transformed) return undefined
  if (
    /^[a-z][a-z0-9+.-]*:/i.test(transformed) &&
    !safeProtocols.test(transformed)
  )
    return undefined
  return transformed
}

function Anchor({
  href,
  children,
  onNavigate,
}: ComponentProps<"a"> & { onNavigate?: () => void }) {
  const url = href ? safeUrl(href) : undefined
  if (!url) return <span>{children}</span>

  if (url.startsWith("/") || url.startsWith("#")) {
    return (
      <Link href={url} onClick={onNavigate}>
        {children}
      </Link>
    )
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  )
}

function Pre({ children }: ComponentProps<"pre">) {
  const code = children as ReactElement<ComponentProps<"code">> | undefined
  const content = code?.props?.children
  if (typeof content !== "string") return <pre>{children}</pre>

  let lang =
    code?.props.className
      ?.split(" ")
      .find((name) => name.startsWith("language-"))
      ?.slice("language-".length) ?? "text"
  if (lang === "mdx") lang = "md"

  return <DynamicCodeBlock lang={lang} code={content.trimEnd()} />
}

export const Markdown = memo(function Markdown({
  text,
  onNavigate,
}: {
  text: string
  onNavigate?: () => void
}) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      urlTransform={(url) => safeUrl(url) ?? ""}
      disallowedElements={["img"]}
      unwrapDisallowed
      components={{
        a: (props) => <Anchor {...props} onNavigate={onNavigate} />,
        pre: Pre,
      }}
    >
      {text}
    </ReactMarkdown>
  )
})
