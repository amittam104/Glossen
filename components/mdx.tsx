import type { ComponentProps } from "react"
import defaultMdxComponents from "fumadocs-ui/mdx"
import { CodeBlockTabsTrigger as FumadocsCodeBlockTabsTrigger } from "fumadocs-ui/components/codeblock"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { TypeTable } from "fumadocs-ui/components/type-table"
import type { MDXComponents } from "mdx/types"
import {
  Bun,
  Npm,
  Pnpm,
  PnpmDark,
} from "@/components/site/package-manager-icons"

function CodeBlockTabsTrigger({
  children,
  value,
  ...props
}: ComponentProps<typeof FumadocsCodeBlockTabsTrigger>) {
  const iconProps = { "aria-hidden": true, className: "size-3.5 shrink-0" }

  return (
    <FumadocsCodeBlockTabsTrigger value={value} {...props}>
      {value === "bun" && <Bun {...iconProps} />}
      {value === "npm" && <Npm {...iconProps} />}
      {value === "pnpm" && (
        <>
          <Pnpm {...iconProps} className="size-3.5 shrink-0 dark:hidden" />
          <PnpmDark
            {...iconProps}
            className="hidden size-3.5 shrink-0 dark:block"
          />
        </>
      )}
      {children}
    </FumadocsCodeBlockTabsTrigger>
  )
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    CodeBlockTabsTrigger,
    Step,
    Steps,
    Tab,
    Tabs,
    TypeTable,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
