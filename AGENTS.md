# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Dev server (Turbopack)
pnpm build            # Production build (Turbopack, standalone output)
pnpm start            # Run standalone server (requires .env.production)
pnpm lint             # Lint with Biome
pnpm format           # Format with Biome (auto-write)
```

## Architecture

BioFlow AI Web — a bioinformatics workflow platform built with Next.js 16 (App Router), React 19, and TypeScript.

### Stack

- **UI**: Tailwind CSS v4 + shadcn/ui (Radix) + ai-element + motion
- **State**: Zustand (UI state) + TanStack Query v5 (server state)
- **i18n**: next-intl v4 (server-side mode, locales: `zh`/`en`, default: `zh`)
- **Node Editor**: @xyflow/react for workflow visualization
- **AI**: Vercel AI SDK (@ai-sdk/react with custom backend)
- **Markdown**: streamdown with code/math/mermaid/cjk plugins
- **Linter/Formatter**: Biome (no semicolons, single quotes, 2-space indent)
- **Package Manager**: pnpm

### Data Flow

1. Components use custom hooks (`src/hooks/use-*.ts`)
2. Hooks wrap TanStack Query around server actions (`src/app/actions/*.ts`)
3. Server actions call `clientFetch()` from `src/lib/api-client.ts`
4. Client requests go to `/api/v1/*`, proxied by `src/app/api/v1/[...path]/route.ts` to `BACKEND_API_URL`

### Routing

- `/(main)/*` — protected routes wrapped in `AuthGuard`
- `/login` — public, wrapped in `GuestGuard`
- `/api/v1/[...path]` — runtime API proxy (backend URL never exposed to browser)

### Auth

Tokens stored in both localStorage and cookies (7-day expiry). `clientFetch()` attaches Bearer token and auto-clears on 401.

### Key Conventions

- Path alias: `@/*` → `./src/*`
- Types live in `src/types/` per domain
- Zustand stores in `src/stores/`
- Translation files in `messages/{zh,en}.json`
- shadcn/ui components in `src/components/ui/`; feature components organized by domain
- ai-element components in `src/components/ai-elements/`; feature components organized by domain
- Node types (workflow editor): BaseNode, ToolNode, DataNode, CodeNode, InputNode, NoteNode

### Environment Variables

- `BACKEND_API_URL` — backend API URL (server-side only, runtime)
- `NEXT_PUBLIC_API_URL` — client API prefix (default: `/api/v1`)
