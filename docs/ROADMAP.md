# Chathub Roadmap → ChatGPT Feature Parity

A phased plan to bring chathub from "Grok-style chat demo" to feature parity with ChatGPT (2026). Each phase builds on the previous one; items are ordered by dependency, not by wow-factor.

## Current State (baseline)

| Capability | Status |
|---|---|
| Streaming chat (AI SDK v7 + assistant-ui) | ✅ Done |
| Markdown, KaTeX math, shiki code blocks, mermaid diagrams | ✅ Done |
| Reasoning display + message timing stats | ✅ Done |
| Thread list + localStorage persistence | ⚠️ Client-only, resets across devices |
| Attachments UI | ⚠️ Images render in composer; never sent to the model |
| Model selection | ❌ One hardcoded model (`lib/model.ts`) |
| Auth / server-side persistence / memory / tools / voice / artifacts | ❌ Missing |
| ChromaDB | 📦 Installed, unused |

---

## Phase 0 — Foundation (prerequisite for everything else)

*Goal: replace demo scaffolding with production infrastructure.*

1. **Auth & accounts** — OAuth (Google/GitHub) or email magic links. NextAuth/Auth.js fits the existing Next.js setup.
2. **Database-backed threads** — Postgres (e.g. Neon/Supabase) + Drizzle/Prisma. Replace `localStorageThreadAdapter` with a server thread adapter so history syncs across devices. Keep localStorage as offline cache.
3. **Multi-provider model layer** — extend `lib/provider.ts` to register multiple providers (OpenAI, Anthropic, Google, local/Ollama via the existing openai-compatible client). Move model registry to DB/config; add per-request model routing.
4. **Rate limiting, usage quotas, API-key management** — protect the `/api/chat` route.
5. **CI + tests** — lint/typecheck on PRs; integration test for the chat route; Playwright smoke test for the thread flow.

## Phase 1 — Core Chat Parity

*Goal: match the day-to-day ChatGPT conversation experience.*

1. **Model picker in composer** — dropdown fed by the Phase 0 registry ("fast" vs "thinking"-style tiers). Wire up the unused `docsModelOptions.ts` pattern.
2. **Custom instructions** — global user-level system prompt (ChatGPT's "personalization") injected in `app/api/chat/route.ts`.
3. **Conversation features** — rename/delete/pin/archive threads; full-text search across history (Postgres FTS is enough); branch on message edit (assistant-ui supports branching).
4. **Sharing & export** — read-only share links for threads (public token or auth-gated); export thread as Markdown/JSON.
5. **Prompt library** — saved prompts + slash-command insertion in the composer.
6. **Mobile/PWA polish** — responsive shell, installable PWA.

## Phase 2 — Multimodality

*Goal: see, hear, and generate beyond text.*

1. **Real image understanding** — finish the attachment pipeline: send image parts through `convertToModelMessages` to a vision-capable model. The UI already renders attachments.
2. **File upload & analysis** — PDF/CSV/DOCX ingestion; extract text server-side; large files go to RAG (Phase 3), small ones inline into context. This is the biggest daily-driver gap after search.
3. **Image generation** — plug an image-gen API (e.g. gpt-image/DALL·E-class endpoint) behind an assistant-ui tool part; render generated images inline with download/regenerate actions.
4. **Voice input** — Web Speech API or Whisper endpoint wired to the (currently decorative) mic button.
5. **Advanced voice mode (stretch)** — realtime speech-to-speech via WebRTC/WebSocket once text+TTS flows are proven.

## Phase 3 — Tools, Search & RAG

*Goal: the assistant can look things up and compute.*

1. **Web search with citations** — AI SDK tool-calling (`streamText` + `tools`); use a search API (Tavily/Serper/Exa); render cited sources under answers with inline citation chips. Highest-impact single feature.
2. **Activate ChromaDB** — embed uploaded files + optional scraped pages; retrieval-augmented generation with source previews ("show which chunk answered").
3. **Code interpreter** — sandboxed execution (E2B, Docker/Firecracker, or Pyodide-in-browser for simple cases) exposed as a tool; render tables/charts from results.
4. **Tool framework** — generic registered-tools pattern (weather, calculator, HTTP fetch) with per-tool permission prompts, using the existing `tool-fallback.tsx` as the base for rich tool UIs.
5. **MCP client support** — let users connect external MCP servers; tools auto-register into the same framework.

## Phase 4 — Memory, Projects & Organization

*Goal: context that persists and is organized.*

1. **Persistent memory** — extract facts post-conversation (cheap background LLM call), store per-user, inject into system prompt with retrieval. Settings page to view/edit/delete individual memories (parity with ChatGPT's memory manager).
2. **Projects** — group threads into workspaces with: custom project instructions, attached files (shared RAG collection), and project-scoped memory that doesn't bleed across projects.
3. **Thread organization at scale** — folders/tags within projects, date grouping in the sidebar, archive view.

## Phase 5 — Canvas / Artifacts

*Goal: editable long-form output instead of chat bubbles.*

1. **Document canvas** — side-by-side editor (TipTap/Lexical — Lexical is already a dependency via assistant-ui) for long-form writing; select-text → "revise this section" round-trips to the model.
2. **Code canvas** — full-file editor with version snapshots, diff view between iterations, and one-click copy/download.
3. **Live preview artifacts** — HTML/React artifact rendering in a sandboxed iframe (Claude-artifacts style); mermaid already proves the "render special content" pattern.
4. **Canvas-aware model prompting** — targeted edit instructions (whole-file rewrite vs surgical patch) to keep edits cheap and reviewable.

## Phase 6 — Agents & Advanced

*Goal: the assistant does multi-step work.*

1. **Deep research mode** — orchestrated loop: plan → parallel searches → read pages (Phase 3 infra) → synthesize a cited report; stream progress steps into the reasoning panel you already have.
2. **Agent mode** — browser automation (Playwright server-side) with human-approval checkpoints for form-filling/browsing tasks; heavy security work: prompt-injection defenses, domain allowlists, audit log.
3. **Scheduled tasks** — cron-backed jobs (reminders, recurring reports); deliver results as new threads or notifications. Requires Phase 0 persistence.
4. **Custom assistants ("GPTs")** — user-defined name/instructions/knowledge-files/tool-set, shareable; essentially a packaged Project (Phase 4) + selected tools (Phase 3).
5. **Connector apps** — OAuth integrations (Drive, Notion, GitHub…) feeding the same RAG/tool layer.

---

## Suggested sequencing

| Quarter | Focus |
|---|---|
| Q1 | Phase 0 + Phase 1 (foundation, model picker, real persistence, sharing) |
| Q2 | Phase 2 + web search from Phase 3 (multimodal + citations) |
| Q3 | Rest of Phase 3 + Phase 4 (RAG, interpreter, memory, projects) |
| Q4 | Phase 5 + start Phase 6 (canvas, deep research) |

## Quick wins if you want visible progress this week

1. Web search tool with citations (single highest-value gap).
2. Real image attachments → vision model (UI already 90% done).
3. Model picker in the composer.
