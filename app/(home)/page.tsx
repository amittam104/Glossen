import Image from "next/image"
import Link from "next/link"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Github01Icon from "@hugeicons/core-free-icons/Github01Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { CopyCommand } from "@/components/site/copy-command"
import { buttonVariants } from "@/components/ui/button"
import { gitConfig } from "@/lib/shared"
import { cn } from "@/lib/utils"

const installCommand =
  "npx shadcn@latest add https://glossen.vercel.app/r/glossen.json"

const features = [
  "Answers from your whole documentation",
  "Selection context",
  "Saved conversations",
  "Edit & regenerate",
  "Next.js and TanStack Start",
]

export default function HomePage() {
  return (
    <main className="relative isolate flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(60rem_32rem_at_50%_-8rem,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_70%),radial-gradient(40rem_24rem_at_85%_30%,color-mix(in_oklch,oklch(0.8_0.12_60)_14%,transparent),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background-image:radial-gradient(color-mix(in_oklch,var(--foreground)_18%,transparent)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] [background-size:22px_22px] opacity-60 dark:opacity-40"
      />
      <div
        aria-hidden
        className="[background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')] pointer-events-none absolute inset-0 -z-10 opacity-[0.035] mix-blend-multiply dark:mix-blend-screen"
      />

      <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pt-20 pb-16 text-center md:pt-28">
        <Link
          href="/docs/demo"
          className="mb-7 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground"
        >
          <span className="size-1.5 rounded-full bg-primary" />
          Free and open source · MIT
        </Link>

        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl md:leading-[1.05]">
          Ask AI for your{" "}
          <span className="bg-gradient-to-br from-primary to-[oklch(0.62_0.16_330)] bg-clip-text text-transparent">
            Fumadocs
          </span>{" "}
          site
        </h1>
        <p className="mt-5 max-w-2xl text-base text-pretty text-muted-foreground md:text-lg">
          Glossen gives readers answers built from your entire documentation,
          with sources, selected passages, saved chats and editable questions.
          Install it as source you own through a shadcn registry.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs/installation"
            className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}
          >
            Get started
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              data-icon="inline-end"
              aria-hidden
            />
          </Link>
          <a
            href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-10 bg-background/70 px-4 backdrop-blur"
            )}
          >
            <HugeiconsIcon
              icon={Github01Icon}
              data-icon="inline-start"
              aria-hidden
            />
            GitHub
          </a>
        </div>

        <div className="mt-8 flex w-full justify-center">
          <CopyCommand command={installCommand} />
        </div>

        <ul className="mt-8 flex max-w-3xl flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-primary/70" />
              {feature}
            </li>
          ))}
        </ul>

        <figure className="relative mt-14 w-full">
          <div
            aria-hidden
            className="absolute inset-x-12 -top-6 bottom-6 -z-10 rounded-[2rem] bg-primary/20 blur-3xl"
          />
          <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl ring-1 ring-black/5">
            <Image
              src="/screenshots/chat-light.png"
              alt="The Glossen Ask AI panel answering a question next to a documentation page"
              width={1280}
              height={800}
              priority
              className="block h-auto w-full dark:hidden"
            />
            <Image
              src="/screenshots/chat-dark.png"
              alt="The Glossen Ask AI panel answering a question next to a documentation page"
              width={1280}
              height={800}
              className="hidden h-auto w-full dark:block"
            />
          </div>
          <figcaption className="mt-4 text-sm text-muted-foreground">
            Try it live: open the{" "}
            <Link
              href="/docs"
              className="font-medium text-foreground underline"
            >
              docs
            </Link>{" "}
            and click{" "}
            <span className="font-medium text-foreground">Ask AI</span>.
          </figcaption>
        </figure>
      </section>
    </main>
  )
}
