# Glossen design decisions

Consolidated first-release scope from the design interview, approved by the user. Execution is described in [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md). Implementation has not started.

## Agreed scope

- Build a better Ask AI experience for Fumadocs, distributed as editable source through a shadcn registry. No npm package, separate core library, or Fumadocs fork.
- Support Next.js and TanStack Start with one shared interface and optional backend starters. Document the complete setup; allow an existing compatible backend. Glossen does not operate a hosted AI service for installed components.
- Both the UI and optional API route starter are installed into the developer's own project as editable source; the developer runs and owns both.
- Include optional selection context in the first release.
- Use the current Emend documentation Ask AI UI as the main design reference.
- Save up to 20 conversations in the reader's browser by default. The installing developer can change that limit.
- Release the project free and open source under MIT.
- Use the distributed component on Glossen's own documentation as the live demonstration. Landing-page screenshots and short looping videos can support it.
- File uploads and speech-to-text are deferred; passage attachments remain in the first release.

## Developer setup

- Use the AI SDK with OpenRouter as the default backend starter for both supported frameworks. Developers can change the provider and model on the server or retain an existing compatible AI SDK endpoint.
- Expose straightforward options for endpoint, history limit, welcome text, placeholder, suggested questions, selection toggle, and styling.
- Configure model, provider, and system instructions in the editable backend route. Deeper layout customization uses the installed component source; avoid an elaborate configuration system.
- Build Glossen's own website with Next.js and Fumadocs using its official setup tooling. Fumapress is a separate site-generator approach and is not needed for this setup.
- Provide setup guides and backend starters for both frameworks, with a small TanStack Start example to validate its installation path.
- Target one verified, current compatible dependency combination for each framework and document the exact supported versions. Do not promise older-major-version compatibility in the first release. Determine exact versions during setup.
- Install UI under the consumer's `components/glossen/*` namespace, respecting aliases. Use Fumadocs theme tokens and framework helpers; do not replace the consumer's global styles or existing AI route implicitly.
- Maintain canonical starter logic and add demo-only protections around it. The distributed UI and starter do not require Vercel or BotID.

## Message contract

- Use typed AI SDK message parts: `data-passage` with `{title, url, text, heading?}` and `data-page` with `{title, url}`. A heading includes a verified anchor only when one exists.
- The backend validates these parts and converts them into model-readable reference context. A compatible custom backend must implement this handling, not merely accept plain text chat messages.
- Keep stable message identifiers for persistence and editing. Treat documentation/client data as reference material rather than privileged instructions.

## Public demo and deployment

- Visitors can use Ask AI on Glossen's documentation without signing in or providing an API key.
- Keep the public assistant broadly helpful, like the distributed starter. Control abuse through infrastructure rather than a documentation-only topic restriction.
- The demo uses OpenRouter free models through Glossen's own server-side API key. Prominently disclose this in the documentation. Developers installing Glossen supply their own provider key and choose their own model.
- The owner confirms an existing OpenRouter budget. Verify the effective free-model allowance and provider limits at setup; no assumption of unlimited free requests.
- Plan deployment on Vercel with a firewall rate-limit rule and BotID client/server integration for `POST /api/chat`. Keep registry downloads accessible to installation tools. These are deployment tasks, not already-configured protections.
- Add documented demo-only body-size and output-token limits. Reject oversized input clearly and label output-limit stops. These limits do not change the distributed component's unrestricted selection defaults.
- Disclose that requests reach OpenRouter and the selected provider, that provider data policies vary, and that visitors should not submit secrets. Verify the selected provider's policy and account settings before writing specific logging claims.
- Select and verify the exact free model and its suitability for the full documentation context during setup. Decide concrete firewall settings during deployment.

## Website presentation

- Give Glossen its own visual identity rather than copying Emend's homepage or documentation branding. Emend remains the reference for the chat interactions.
- Use standard Fumadocs layouts with light/dark themes, including HomeLayout for the homepage.
- Keep the homepage focused on the product, screenshots or looping video, a get-started/install action, and documentation/GitHub links.

## Message interactions

- Include copy answer, regenerate the latest answer, Stop, retry, expandable sources, and clickable documentation citations.
- Include editing earlier reader questions in the first release. Keep one linear conversation: Save & regenerate replaces that question's answer and all subsequent messages. Explain this consequence before submission; cancel leaves the conversation unchanged. No alternative-branch navigation initially.
- Editing restores the question and its original passage attachments. Readers can remove passages and add new selections before resubmitting. Preserve each passage's original title and URL, and retain the question's original page context unless the reader explicitly changes it.
- Readers can draft while an answer is generating in the same conversation, but cannot submit until it finishes or they stop generation. No message queue initially.
- Separate conversations can continue generating independently.
- Render model Markdown without raw HTML or unsafe URL schemes. Populate the documentation sources list only with URLs present in the actual docs catalog; ordinary safe external answer links are not documentation citations.

## Conversation history

- Save a conversation after its first submitted question; empty chats do not count toward the limit.
- Each conversation has its own unsent text, pending passages, and page context. Drafts survive closure, navigation, switching, and reload. Persist an unsent new-chat draft separately from counted history; with persistence disabled, all drafts remain in memory only.
- Order saved conversations by latest activity. When a new conversation exceeds the configured limit, remove the least recently active idle conversation. Never automatically remove a generating conversation; temporarily exceed the limit if all are generating and trim after generation finishes.
- Only sending questions and receiving answers count as activity. Opening a conversation or editing its draft does not. Apply a lowered history limit on load, still protecting active generators.
- A limit of `0` disables persistent history.
- Restore the last active conversation, but keep the panel closed on page load.
- Provide a history button beside New chat, with the list inside the same panel. Use the first question as the conversation title.
- Readers can resume or delete a conversation, or clear all history. Clearing all requires confirmation. No manual renaming initially.
- After deleting the active conversation, show a new empty chat. Mark generating, interrupted, and failed conversations in history.
- Answers continue generating when the reader switches conversations, starts another, or closes the panel. A generating conversation remains accessible through history.
- Background generation is owned by the browser tab that started it. After that tab refreshes or closes, restore its saved partial answer as interrupted and offer retry. Reloading another tab must not interrupt or relabel a generation that still has a live owner. No durable server-side background jobs in the first release.
- Explicit deletion of a generating conversation stops its request and removes the conversation.
- If browser storage fails, continue in memory and show a notice that changes are not being saved. Preserve existing saved history rather than automatically clearing it to make room.
- Keep history synchronized across same-origin tabs using separate conversation storage keys and storage-change notifications. Only the originating tab streams; other tabs observe stored progress/state and the saved result without duplicating requests.
- Coordinate writes to the same conversation, protect newer drafts, and propagate deletions without allowing late saves to restore removed chats. Sending/editing a remotely generating conversation is disabled until that generation ends.
- Version stored records and preserve unreadable/unsupported records rather than silently resetting them. Throttle streamed saves to about once per second and flush on completion, Stop, or failure; recovery includes only successfully saved content.

## Selection context

- Selection works while chat is closed. Selecting documentation text and clicking Ask AI opens chat, attaches the passage, and focuses the question input.
- Do not send an AI request until the reader submits a question.
- Each passage retains its original page title and URL, even if the reader navigates before sending.
- Additional selections add passage attachments rather than replacing existing ones. Show removable previews above the input.
- After submission, keep the passages visibly attached to their message.
- Add selections to the active conversation. Start another only when the reader chooses New chat.
- Impose no default Glossen limit on selected passage count or total selection length. Provider context windows and transport constraints still exist; show errors when these are exceeded.
- Clear composer attachments after submission; retain them with the sent message as conversation context for follow-up questions.
- Preserve each conversation's unsent text and attachments when the reader closes chat, navigates, switches conversations, or reloads.
- Show the selection action only inside documentation content, excluding chat answers, navigation, and inputs. Make it keyboard reachable. Save the nearest heading with the passage when available.
- Include selection on touch devices in the first release. Preserve native selection and expose an Ask AI action; exact placement needs browser validation.

## Documentation context

- Supply the site's entire documentation as the default assistant context, following Emend's current approach.
- Include the current documentation page when sending a question, with a small current-page label in the interface. This identifies the reader's location within the full documentation context.
- Passages selected from other pages preserve their original sources.
- Reuse full-docs rendering for unchanged production content without mixing in user messages. Refresh when content changes and during development. Configure processed Markdown explicitly and document the source module the backend expects.

## Assistant scope

- Help readers broadly, including beyond the documentation. Do not reject a question merely because it is unrelated to the docs.
- The earlier proposal to restrict the assistant to documentation-grounded adaptations was rejected.

## Context overflow

- Show a clear error when a request exceeds the selected model's capacity. Preserve the question and passage attachments for recovery.
- Do not silently truncate passages, omit documentation, or switch to retrieval. Readers can remove passages or start another conversation; developers can configure a larger-context model or their own fallback.
- No automatic compaction in the first release.
- Handle both pre-stream and streaming errors, mapping known failures to helpful messages without exposing raw provider/server error details. Runtime duration settings remain subject to hosting limits.

## Future possibilities

- File attachments: images, PDFs, and text/code files were the accepted initial type proposal before the feature was deferred. Storage and persistence behavior remain undecided.
- Speech-to-text through a separate API route. Provider and implementation remain undecided; browser-only recognition was not selected.
- Automatic context compaction is a possible future enhancement, not a committed first-release feature.

## Implementation and deployment follow-through

- Verify and record exact compatible dependency versions and the demo's free model.
- Validate mobile selection placement and desktop/mobile chat behavior against the agreed Emend reference.
- Configure and verify Vercel firewall rules and bot protection before public launch.
- Follow the approved scope and phased implementation plan; keep future features outside the first release.

## Decision record

The user approved the first-release scope after the design interview. The subsequent review additionally confirmed reload-persistent per-conversation drafts, multi-tab history synchronization, an existing demo budget, broad public assistance, and both frameworks at launch. Technical recommendations were incorporated with explicit safeguards for same-conversation writes, content freshness, safe error reporting, and separation of demo protections from installed source.
