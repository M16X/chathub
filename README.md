# ChatHub

A minimal, fast, Grok-inspired chat surface for trying free OpenAI-compatible models in one place. Built with Next.js, assistant-ui, and the Vercel AI SDK.

## Goals

1. **One clean chat hub for many models** — a single composer + thread view that can talk to any OpenAI-compatible endpoint, starting with free models on the Kilo gateway.
2. **Grok-level UX with minimal chrome** — centered empty-state composer, collapsible thread sidebar, fast streaming, and concise message controls. No clutter.
3. **Provider-agnostic by design** — model and endpoint config lives in two small files (`lib/model.ts`, `lib/provider.ts`), so swapping gateways or adding models is a one-line change.
4. **Runnable starter, not a black box** — small, readable components (`components/examples/grok.tsx`, `components/runtime/`, `app/api/chat/`) that serve as a base for building your own assistant product.
5. **Local-first demo** — `pnpm dev` just works; thread state runs in memory via assistant-ui with no database or auth required.

## Features

- Grok-style UI: centered composer on empty thread, floating thread viewport once chatting
- Streaming responses via `assistant-ui` + Vercel AI SDK (`AssistantChatTransport` → `/api/chat` → `streamText`)
- Model picker dropdown backed by a zustand store (`useModelStore`) and forwarded through `aui.modelContext`
- Thread sidebar: collapsible desktop rail, mobile sheet, search, new thread (`components/examples/clone-thread-shell.tsx`)
- Rich messages: Streamdown Markdown (GFM, math, Mermaid), Shiki code highlighting, collapsible reasoning blocks
- Attachments: image thumbnails + generic file fallback, add/remove in composer
- Message actions: edit / copy for user messages; reload / copy for assistant messages
- Stream timing badge: first-token latency, total time, tokens/sec, chunk count on hover
- Light/dark theming via CSS variables, Geist font, Tailwind CSS v4

## Tech Stack

| Layer    | Choice                                              |
| -------- | --------------------------------------------------- |
| Framework| Next.js 16 (App Router), React 19, TypeScript       |
| Chat     | `@assistant-ui/react`, `@assistant-ui/ai-sdk`, `ai` |
| Provider | `@ai-sdk/openai-compatible` → Kilo AI gateway       |
| State    | `zustand` (selected model)                          |
| Styling  | Tailwind CSS v4, Base UI, lucide-react              |
| Markdown | `streamdown`, `@assistant-ui/react-streamdown`, `@streamdown/code`, `@streamdown/math`, `@streamdown/mermaid`, `react-shiki` |

## Project Structure

```
app/
  page.tsx            # mounts <DemoRuntimeProvider> + <Grok />
  layout.tsx          # root layout + metadata
  globals.css         # Tailwind theme, light/dark tokens
  api/chat/route.ts   # streams chat completions from the gateway
components/
  examples/grok.tsx              # main chat surface (composer, messages, model picker)
  examples/clone-thread-shell.tsx # collapsible thread sidebar + mobile sheet
  runtime/demo-runtime-provider.tsx # assistant-ui runtime wired to /api/chat
  assistant-ui/                   # markdown, reasoning, thread-list, tooltip primitives
  ui/                             # button, sheet, dropdown-menu, tooltip, input
  icons/grok.tsx                  # brand icon
lib/
  model.ts    # DEFAULT_MODEL_ID, FALLBACK_MODELS, useModelStore
  provider.ts # gateway baseURL / apiKey (openai-compatible)
  utils.ts    # cn() class helper
```

## Getting Started

Prerequisites: Node 18+ and `pnpm` (or `npm`).

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

Build / production:

```bash
pnpm build
pnpm start
```

## Configuration

All provider config is code, no env vars required today:

- `lib/provider.ts` — `baseURL` and `apiKey` for the OpenAI-compatible gateway (defaults to `https://api.kilo.ai/api/gateway` with a public key).
- `lib/model.ts` — `DEFAULT_MODEL_ID` and `FALLBACK_MODELS` list shown in the model picker.
- `app/api/chat/route.ts` — reads `config.modelName` (set by the picker) from the request body, falls back to `DEFAULT_MODEL_ID`, and streams via `streamText`.

To point at your own endpoint, edit `lib/provider.ts`:

```ts
export const openCodeProviderConfig = {
  name: "openai-compatible",
  baseURL: "https://your-gateway.example.com/v1",
  apiKey: "sk-...",
} as const;
```

To add models, edit `FALLBACK_MODELS` in `lib/model.ts`.

> Note: the previous README mentioned `OPENAI_API_KEY` and `NEXT_PUBLIC_ASSISTANT_BASE_URL`. Neither is read by the current code — threads are in-memory and reset on reload, and auth is the hardcoded gateway key above.

## How It Works

1. `<DemoRuntimeProvider>` creates a `useChatRuntime` with `AssistantChatTransport({ api: "/api/chat" })`.
2. `<Grok />` renders the composer and message list; the model picker writes to `useModelStore` and registers `config.modelName` in `aui.modelContext`.
3. On send, the client POSTs `{ messages, config: { modelName } }` to `/api/chat`.
4. The route converts to model messages with `convertToModelMessages`, calls `streamText` on the OpenAI-compatible model, and returns `toUIMessageStreamResponse()` for token-by-token rendering.

## Roadmap

- [ ] Fetch model list live from the gateway (`GET /models`) with fallback to `FALLBACK_MODELS`
- [ ] Persist threads (localStorage first, optional cloud backend)
- [ ] Auto thread titles
- [ ] Move gateway key to env (`KILO_API_KEY`) instead of a hardcoded public key
- [ ] Multi-provider support (OpenAI, Anthropic, local Ollama) behind one picker
- [ ] Attachments sent to the model (vision / file input)
- [ ] Auth + share links

## Contributing

Small, focused PRs welcome. Match the surrounding code style, keep components small and single-purpose, and run `pnpm build` before opening a PR.
