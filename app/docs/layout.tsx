import { DocsLayout } from "fumadocs-ui/layouts/docs"
import { AskAIPanel, AskAITrigger } from "@/components/glossen"
import { baseOptions } from "@/lib/layout.shared"
import { source } from "@/lib/source"

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout tree={source.getPageTree()} {...baseOptions()}>
      {children}
      <AskAIPanel />
      <AskAITrigger />
    </DocsLayout>
  )
}
