import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { RootProvider } from "fumadocs-ui/provider/next"
import { GlossenProvider } from "@/components/glossen"
import { cn } from "@/lib/utils"
import "./global.css"

const sans = Geist({ subsets: ["latin"], variable: "--font-sans" })
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3002"
  ),
  title: {
    default: "Glossen: AI chat for Fumadocs",
    template: "%s | Glossen",
  },
  description:
    "An AI chat for Fumadocs sites. Readers ask questions and get answers that link to the right pages.",
}

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("font-sans", sans.variable, mono.variable)}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <RootProvider>
          <GlossenProvider
            contentSelector="#nd-page, [data-glossen-content]"
            welcome={{
              title: "Ask anything about Glossen",
              description:
                "Answers use the full documentation and link to the pages they come from.",
            }}
            placeholder="Ask a question about Glossen…"
            suggestions={[
              "How do I install Glossen in a Next.js app?",
              "Can I keep my existing chat API route?",
              "How does selection context work?",
            ]}
          >
            {children}
          </GlossenProvider>
        </RootProvider>
      </body>
    </html>
  )
}
