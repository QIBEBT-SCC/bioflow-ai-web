# BioFlow AI web

## Architecture

BioFlow AI Web — a bioinformatics workflow platform built with Next.js 16 (App Router), React 19, and TypeScript.

## Commands

```bash
pnpm build            # Production build (Turbopack, standalone output)
pnpm lint             # Lint with Biome
pnpm format           # Format with Biome (auto-write)
npx react-doctor@latest --diff --offline  # Check code compliance
```
The inspection needs to cover only these three parts:
1. The build compiles successfully.
2. All Biome-related checks pass.
3. The react-doctor code compliance check passes.

Among these, parts 2 and 3 only check the files affected by the current change.

### Branches and releases

Follow the shared branch, pull request, and release workflow in [CONTRIBUTING.md](./CONTRIBUTING.md).

### Stack

- **UI**: Tailwind CSS v4 + shadcn/ui (Radix)
- **State**: Zustand (UI state) + TanStack Query v5 (server state)
- **i18n**: next-intl v4 (server-side mode, locales: `zh`/`en`, default: `zh`)
- **Node Editor**: @xyflow/react for workflow visualization
- **AI**: Vercel AI SDK (@ai-sdk/react with custom backend)
- **AI UI**: shadcn/ui AI Elements patterns (Trace, Message, Bubble, Message Scroller, Attachment, Questionnaire) + Streamdown via `src/components/markdown.tsx`
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

The browser stores only an HttpOnly `session_id` plus a readable `csrf_token` cookie. `clientFetch()` sends the CSRF token on unsafe methods and clears local auth state on 401; the backend owns session validation and authorization.

### Key Conventions

- Path alias: `@/*` → `./src/*`
- Types live in `src/types/` per domain
- Zustand stores in `src/stores/`
- Translation files in `messages/{zh,en}/*.json`, one file per namespace (merged in `src/i18n/request.ts`)
- shadcn/ui components in `src/components/ui/`; feature components organized by domain

### Design System

Full reference (tokens, type scale, layout and component recipes): the `bioflow-design-system` skill in `.claude/skills/`. Load it for any UI work. Non-negotiables:

- **Workflow node layouts and colors are deliberate** — don't redesign `src/components/node-editor/node/*` unless asked; keep the `.react-flow__node` token pin in `globals.css`. The shared `ui/*` primitives inside nodes (Button, Badge, Input, …) follow shadcn upstream, so nodes pick up component upgrades — don't pin old primitive styles inside nodes.
- **Colors come from tokens** in `src/app/globals.css` (`primary`, `muted`, `success`/`warning`/`info`/`destructive`, …). Brand color is `primary`, which follows the user's accent choice (`data-accent` on `<html>`); never hardcode blue. Raw Tailwind palettes are for categorical data only.
- **Pages use the shared frame** from `src/components/layout/`: `PageShell` + `PageContainer` (`narrow`/`default`/`wide`) + `PageHeader`; full-bleed pages use `PageTopbar`. Don't hand-roll `SidebarInset` headers or breadcrumbs.
- **Run/task statuses** render via `src/components/workflow/run-status.tsx` (maps in `src/lib/status.ts`) — no local status→color maps.
- **Dark mode is deferred** — don't add dark variants or a toggle unless asked.

### Environment Variables

- `BACKEND_API_URL` — backend API URL (server-side only, runtime)
- `NEXT_PUBLIC_API_URL` — client API prefix (default: `/api/v1`)
