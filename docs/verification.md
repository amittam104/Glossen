# Verification record

Local verification on 2026-09-28. No automated test suite was added; everything below was checked with type checks, lint, builds, real installations and browser sessions against the live OpenRouter backend.

## Versions

| Package                              | Version                                            |
| ------------------------------------ | -------------------------------------------------- |
| next                                 | 16.3.5                                             |
| fumadocs-core / @fumadocs/base-ui    | 16.15.15                                           |
| fumadocs-mdx                         | 15.4.5                                             |
| ai                                   | 7.0.118                                            |
| @ai-sdk/react                        | 4.0.121                                            |
| @openrouter/ai-sdk-provider          | 3.1.0                                              |
| zod                                  | 4.6.5                                              |
| react-markdown / remark-gfm          | 10.1.0 / 4.0.1                                     |
| shiki                                | 4.4.3                                              |
| @hugeicons/react / core-free-icons   | 1.1.10 / 4.3.5                                     |
| shadcn CLI                           | 4.21.0                                             |
| typescript (site)                    | 6.0.3 (typescript-eslint does not support 7.x yet) |
| @tanstack/react-start / react-router | 1.168.56 / 1.170.38                                |

Demo model: `openrouter/free` (200k context router). The account's free-model allowance reported by OpenRouter: 1,000 requests per day.

## Checks

| Area                                                                                             | Result                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`, `pnpm types:check`, `pnpm build` (site)                                             | Pass                                                                                                                                                                                      |
| Registry build (`public/r/*.json`)                                                               | Pass                                                                                                                                                                                      |
| Clean Next.js Fumadocs consumer (outside the repo): install UI + backend from the local registry | Pass. Only new files, dependencies and `.env.local` entries; `app/global.css` untouched. `@/lib/utils` imports rewritten to the consumer's `@/lib/cn`. `tsc` (TS 7) and `next build` pass |
| TanStack Start example: install from the local registry                                          | Pass. Files land in `src/`, route at `src/routes/api/chat.ts`. `tsc` and `vite build` pass                                                                                                |
| Streamed answers, verified sources with real anchors                                             | Pass (Next site, Next consumer, TanStack)                                                                                                                                                 |
| Content inside custom MDX components (`Callout`, `Card`) reaches the model                       | Pass                                                                                                                                                                                      |
| Current-page context and passages reach the model                                                | Pass                                                                                                                                                                                      |
| Stop keeps the partial answer; regenerate; copy                                                  | Pass                                                                                                                                                                                      |
| Unsafe Markdown (`javascript:`, `data:` links, raw HTML, images)                                 | Rendered as plain text / dropped                                                                                                                                                          |
| Invalid message payload → 400; demo request > 512 KB → 413 with message                          | Pass                                                                                                                                                                                      |
| Context overflow (65k-context model, 270k-token request)                                         | Safe "too large" message                                                                                                                                                                  |
| Network timeout to provider                                                                      | Safe timeout message; Try again recovered a failed regeneration                                                                                                                           |
| Two concurrent conversations generating                                                          | Pass; answers stay in their own conversations                                                                                                                                             |
| Reload during generation                                                                         | Saved partial shown as Interrupted with Try again                                                                                                                                         |
| Two tabs: observer sees progress, send/edit disabled, synced result                              | Pass                                                                                                                                                                                      |
| Observer tab reload during live generation                                                       | Stays "Answering in another tab"                                                                                                                                                          |
| Delete from another tab during generation                                                        | Owner stops; no resurrection                                                                                                                                                              |
| Delete during local generation                                                                   | Request stopped; tombstone written; no resurrection                                                                                                                                       |
| History limit trim (22 → 20) and unreadable/future-version records                               | Trimmed oldest idle; unreadable records preserved with notice                                                                                                                             |
| Storage failure (`setItem` throws)                                                               | Continues in memory with notice; saved history preserved                                                                                                                                  |
| `historyLimit={0}`                                                                               | Nothing written to storage; history in memory only                                                                                                                                        |
| Per-conversation drafts, new-chat draft, reload                                                  | Pass                                                                                                                                                                                      |
| Last active conversation restored after reload, panel closed                                     | Pass                                                                                                                                                                                      |
| Selection: accumulates across pages, keeps title/URL/heading anchor, excludes chat               | Pass                                                                                                                                                                                      |
| Editing the first, middle and latest question; cancel                                            | Pass; later messages replaced                                                                                                                                                             |
| Keyboard: ⌘/ open, Esc close, focus to composer and back to trigger                              | Pass                                                                                                                                                                                      |
| Desktop overlay / mobile inset dialog, light and dark                                            | Pass                                                                                                                                                                                      |
| Touch (Chromium iPhone 13 emulation): Ask AI button below the selection                          | Pass                                                                                                                                                                                      |

## Recordings

Local only (`recordings/`, not committed):

- `01-nextjs-playground-install.mp4` — Next.js consumer installed from the registry: custom-component content, selection, editing, timeout recovery
- `02-tanstack-start-example.mp4` — TanStack Start example: selection, regenerate, history after reload
- `03-glossen-site-demo.webm` — Glossen site: suggestion + sources, multi-page passages, middle-question edit, background chat, drafts, reload, dark mode
- `04-mobile-selection.webm` — Mobile selection and inset dialog

## Known limitations

- `openrouter/free` picks a random free model per request. Occasionally it picks a model that answers poorly (a safety classifier once replied "User Safety: safe"; some models leak reasoning text). Regenerating usually fixes it. Pin `OPENROUTER_MODEL` to a specific free model for steadier demo answers.
- Touch selection was checked with Chromium device emulation, not on a physical iOS/Android device.
- Streaming progress is saved about once per second; tokens after the last save are lost on reload.
- The registry URLs in the docs use `https://glossen.vercel.app` until the deployment domain is confirmed.
- Phase 10 items (Vercel deployment, BotID, firewall rule, deployed registry installs) are not done.
