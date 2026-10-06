import Image from "next/image"
import Link from "next/link"
import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch"
import { AskAIPanel } from "@/components/glossen"
import { buttonVariants } from "@/components/ui/button"
import { appName, gitConfig } from "@/lib/shared"
import { cn } from "@/lib/utils"

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col bg-background sm:border-x">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b bg-background/85 px-5 backdrop-blur">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md text-sm font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Image
              src="/logo.svg"
              alt=""
              width={40}
              height={40}
              className="size-6 rounded-md"
            />
            {appName}
          </Link>
          <nav className="flex items-center gap-2">
            <ThemeSwitch className="[&_svg]:size-6 [&_svg]:p-1" />
            <a
              href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Glossen on GitHub"
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "text-muted-foreground"
              )}
            >
              <Image
                src="/GitHub_Invertocat_Black.svg"
                alt=""
                width={16}
                height={16}
                className="size-4 dark:invert"
              />
            </a>
          </nav>
        </header>
        {children}
      </div>
      <AskAIPanel />
    </div>
  )
}
