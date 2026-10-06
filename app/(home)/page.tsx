import Image from "next/image"
import Link from "next/link"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import Link01Icon from "@hugeicons/core-free-icons/Link01Icon"
import MessageMultiple01Icon from "@hugeicons/core-free-icons/MessageMultiple01Icon"
import PaintBrush01Icon from "@hugeicons/core-free-icons/PaintBrush01Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { CopyCommand } from "@/components/site/copy-command"
import {
  AnswerActions,
  LandingComposer,
  ScrollHint,
  SuggestedQuestion,
} from "@/components/site/landing-chat"
import { buttonVariants } from "@/components/ui/button"
import { gitConfig } from "@/lib/shared"
import { cn } from "@/lib/utils"

const installCommand =
  "pnpm dlx shadcn@latest add https://glossen.vercel.app/r/glossen.json"

const suggestions = [
  "How does Glossen work?",
  "What can my readers do with it?",
  "How do I add it to my docs?",
]

const passageAnswer =
  "Glossen sends the selected text with your question, along with its heading and page. The answer starts from that text, and the chat can still use your whole documentation if it needs to."

const featureSources = [
  { title: "Conversations and history", href: "/docs/conversations" },
  { title: "Editing questions", href: "/docs/editing" },
]

const setupSources = [
  { title: "Install on Next.js", href: "/docs/installation" },
  { title: "Install on TanStack Start", href: "/docs/tanstack-start" },
]

const sources = [
  { title: "Selection context", href: "/docs/selection" },
  { title: "Configuration", href: "/docs/configuration" },
]

const features = [
  {
    icon: Link01Icon,
    title: "Links to the right pages",
    description:
      "Every answer links to the docs pages it used. Each link is checked, so readers never land on a missing page.",
  },
  {
    icon: MessageMultiple01Icon,
    title: "Saves conversations",
    description:
      "Readers can go back to past chats, edit a question, and keep an unsent message while they browse other pages.",
  },
  {
    icon: PaintBrush01Icon,
    title: "Matches your site",
    description:
      "The chat uses your design system and works in both light and dark mode.",
  },
]

function UserBubble({ children }: { children: string }) {
  return (
    <p className="max-w-[80%] self-end rounded-2xl rounded-br-sm border bg-secondary px-3.5 py-2.5 text-sm">
      {children}
    </p>
  )
}

function Byline() {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      <Image
        src="/logo_minimal.svg"
        alt=""
        width={40}
        height={40}
        className="size-5 rounded-md"
      />
      Glossen
    </div>
  )
}

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="text-[22px] leading-normal font-medium tracking-tight text-balance">
      {children}
    </h2>
  )
}

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-24 px-6 pb-16 sm:px-12">
        <section className="flex min-h-[calc(100svh-12.5rem)] flex-col justify-between gap-14 pt-14 sm:pt-20">
          <div className="flex flex-col gap-4">
            <Image
              src="/logo.svg"
              alt=""
              width={40}
              height={40}
              className="size-12 rounded-xl"
            />
            <h1 className="mt-2 text-[34px] leading-[1.15] font-semibold tracking-tight text-balance sm:text-[40px]">
              Improved AI chat for your
              <br />
              Fumadocs Documentation
            </h1>
            <p className="text-md max-w-[60ch] leading-normal text-pretty text-muted-foreground">
              Use in your Fumadocs to get AI-powered chat assistance. Select any
              text in documentation and use Ask AI to get answers.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/docs/installation"
                className={cn(buttonVariants({ size: "lg" }), "h-9 px-3.5")}
              >
                Add to your docs
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  data-icon="inline-end"
                  aria-hidden
                />
              </Link>
              <a
                href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-9 px-3.5"
                )}
              >
                <Image
                  src="/GitHub_Invertocat_Black.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="size-4 dark:invert"
                />
                GitHub
              </a>
            </div>
            <div className="pt-3">
              {suggestions.map((question) => (
                <SuggestedQuestion key={question}>{question}</SuggestedQuestion>
              ))}
            </div>
          </div>
          <ScrollHint target="how-it-works" />
        </section>

        <section
          id="how-it-works"
          aria-label="Asking about a passage"
          className="flex scroll-mt-20 flex-col gap-5"
        >
          <UserBubble>Can I ask about one specific part of a page?</UserBubble>
          <div className="flex flex-col gap-3.5">
            <Byline />
            <SectionHeading>Yes. Highlight it and ask.</SectionHeading>
            <figure className="flex flex-col gap-1.5">
              <div
                data-glossen-content=""
                className="rounded-xl border border-border/70 bg-card/60 px-4 py-3.5 text-sm leading-relaxed text-muted-foreground selection:bg-mark selection:text-mark-foreground"
              >
                Sometimes only one sentence on a page is confusing. Select that
                sentence and click Ask AI. Glossen adds it to your question, so
                you don’t have to copy and paste anything.
              </div>
              <figcaption className="px-4 text-end text-[10px] text-muted-foreground/60">
                Try it: select any text in this box, then click Ask AI.
              </figcaption>
            </figure>
            <p className="text-[15px] leading-normal text-pretty">
              {passageAnswer}
            </p>
            <AnswerActions text={passageAnswer} sources={sources} />
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <UserBubble>What else can it do?</UserBubble>
          <div className="flex flex-col gap-2">
            <Byline />
            <SectionHeading>Here is what else it does.</SectionHeading>
            <ul>
              {features.map((feature) => (
                <li key={feature.title} className="flex gap-3.5 py-3.5">
                  <HugeiconsIcon
                    icon={feature.icon}
                    aria-hidden
                    className="mt-0.5 size-[18px] shrink-0 text-muted-foreground"
                  />
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[15px] font-medium">{feature.title}</h3>
                    <p className="text-sm leading-normal text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <AnswerActions
              text={features
                .map((feature) => `${feature.title} ${feature.description}`)
                .join("\n")}
              sources={featureSources}
            />
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <UserBubble>How do I add it to my docs?</UserBubble>
          <div className="flex flex-col gap-3.5">
            <Byline />
            <SectionHeading>One command. Then it’s your code.</SectionHeading>
            <p className="text-sm leading-normal text-pretty text-muted-foreground">
              Install the UI and a chat route from the shadcn registry. Add the
              provider, bring your API key, and make it yours.
            </p>
            <CopyCommand command={installCommand} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                href="/docs/installation"
                className="inline-flex items-center gap-1 rounded-sm text-[13px] font-medium text-link underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                Read the setup guide
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  aria-hidden
                  className="size-3.5"
                />
              </Link>
              <span className="text-xs text-muted-foreground">
                Open source · MIT licensed
              </span>
            </div>
            <AnswerActions text={installCommand} sources={setupSources} />
          </div>
        </section>
      </div>

      <LandingComposer placeholder="Ask a question about Glossen…" />
    </main>
  )
}
