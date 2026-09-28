# Agent guidelines

## Git and GitHub

- Keep `main` as the integration branch; create short-lived branches from an updated `main` and merge them back through pull requests.
- When switching to `main` and pulling from `origin`, delete merged local feature branches and prune their stale `origin/*` tracking refs.
- Name branches with a type and short kebab-case description, for example `feat/history-panel` or `fix/selection-anchor`.
- Use Conventional Commit messages for commits, such as `feat: add conversation history` or `fix: keep drafts after reload`.
- Use the rebase-and-merge method.
- Don't use phase wording inside PRs, branch names or commits. Phases and steps are part of the internal Glossen development plan.
- PR title should be a concise, human-readable summary of the change in one line, without any reference to issue numbers or commit hashes.
- PR description should be simple bullet points on what is done in it. Apart from these bullet points, the only other thing that can be added is which issue it closes, if there is one. Don't add any bloated information.
- Create a GitHub issue which will be closed by the PR that you are creating, and follow the same guidelines as PRs.
- Add as much metadata as you can to the PR and issue, like type, labels, Development etc.
- Resolve the comments in a PR only if they are legit; not all of them will be. In any case, reply to each comment in one line or so stating what you have done, then resolve that conversation.
- Once you have replied to all the comments in the PR and resolved them, tag @greptile-apps to review the PR again if the initial PR review score was less than 4. We need the score to be 4 or higher before merging.
- Don't write unnecessary comments in code.

## Project

- Read `CONTEXT.md` for product terms, `docs/design.md` for approved behavior and `IMPLEMENTATION_PLAN.md` for scope.
- The distributed source lives in `components/glossen/*` (UI) and `lib/glossen/*` (backend). `registry.json` packages them; our own site runs the same files.
- Keep demo-only protections in `app/api/chat/route.ts`. The distributed starters live in `registry/starters/*` and must not import them.
- Run `pnpm lint`, `pnpm types:check` and `pnpm build` before opening a PR. Validate UI changes in a browser.
- Don't add automated tests unless asked.
- Never commit `.env` or API keys.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
