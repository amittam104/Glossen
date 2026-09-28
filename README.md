# Glossen

An editable Ask AI experience for [Fumadocs](https://fumadocs.dev), installed as source through a shadcn registry.

- Answers from your entire documentation, with verified source links
- Current-page context and selected-passage attachments
- Saved conversations with per-conversation drafts, background answers and multi-tab sync
- Edit earlier questions and regenerate
- Next.js and TanStack Start backend starters built on the AI SDK and OpenRouter

Read the documentation at [glossen.vercel.app/docs](https://glossen.vercel.app/docs).

## Install

```bash
pnpm dlx shadcn@latest add https://glossen.vercel.app/r/glossen.json https://glossen.vercel.app/r/glossen-next.json
```

See [Install on Next.js](content/docs/installation.mdx) and [Install on TanStack Start](content/docs/tanstack-start.mdx) for the full setup.

## Development

```bash
pnpm install
cp .env.example .env   # add OPENROUTER_API_KEY
pnpm dev               # http://localhost:3002
```

| Command               | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| `pnpm dev`            | Build the registry and start the site on port 3002 |
| `pnpm build`          | Build the registry and the production site         |
| `pnpm lint`           | ESLint                                             |
| `pnpm types:check`    | Generate route types and run TypeScript            |
| `pnpm registry:build` | Write registry items to `public/r`                 |

## Layout

| Path                       | Contents                                                              |
| -------------------------- | --------------------------------------------------------------------- |
| `components/glossen/`      | Distributed UI (installed to `components/glossen/*`)                  |
| `lib/glossen/chat.ts`      | Distributed answer generation shared by both backend starters         |
| `registry/starters/`       | Thin Next.js and TanStack Start routes installed by the backend items |
| `app/api/chat/route.ts`    | This site's demo route: the same handler plus demo-only limits        |
| `registry.json`            | Registry item definitions; output goes to `public/r`                  |
| `examples/tanstack-start/` | TanStack Start app installed from the local registry                  |
| `content/docs/`            | Documentation, also the demo assistant's context                      |

## License

[MIT](LICENSE). Parts of the chat UI are adapted from Fumadocs' AI search (MIT, Copyright (c) 2023 Fuma).
