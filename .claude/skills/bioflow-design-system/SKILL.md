---
name: bioflow-design-system
description: BioFlow AI web design system — color tokens, accent themes, status colors, typography scale, page layout (PageShell/PageContainer/PageHeader/PageTopbar), card/table/empty-state patterns. Use when creating or restyling any page or component, choosing colors or spacing, adding a list/detail/form/settings page, rendering run/task statuses, or reviewing UI changes for consistency.
---

# BioFlow AI design system

The source of truth is the code; this skill explains how to use it. When they disagree, trust
`src/app/globals.css` and `src/components/layout/*` and update this file.

## Hard rules

1. **Never restyle workflow editor nodes** (`src/components/node-editor/node/*`). Their colors and
   styles are finalized. `.react-flow__node` in `globals.css` pins the original neutral tokens so
   theme/accent changes cannot reach them — do not remove that block. Editor *chrome* (toolbar,
   menus, dialogs) follows the normal system.
2. **No raw palette colors for meaning.** Use tokens (`primary`, `muted`, `success`, `warning`,
   `info`, `destructive`, …). Raw Tailwind palettes (`blue-500`, `emerald-600`) are only allowed
   for *categorical* data: code-language badges, tag colors (`src/types/color.ts`), syntax
   highlighting, VCF/Newick previews, the dark run terminal, and the editor canvas background.
3. **Every `(main)` page uses the shared frame** from `src/components/layout/page-shell.tsx`.
   Never hand-roll `SidebarInset` + header + breadcrumb again.
4. **Dark mode is deferred.** Keep `.dark` values in sync when adding tokens, but don't build dark
   variants into components or ship a toggle unless asked.

## Color

Defined as OKLCH CSS variables in `src/app/globals.css`, exposed to Tailwind via `@theme inline`.

| Token | Use |
| --- | --- |
| `primary` / `primary-foreground` | Main actions, active nav, links, focus ring, selection. Default = logo blue `oklch(0.47 0.117 250)` (#175b97). |
| `background`, `card`, `popover` | Page, raised surfaces, overlays. Neutrals carry a faint hue-250 tint. |
| `foreground`, `muted-foreground` | Body text, secondary text/labels/icons. |
| `muted`, `secondary` | Subtle fills (code chips, table header `bg-muted/40`, hover `bg-muted/50`). |
| `accent` / `accent-foreground` | Selected-item fill in lists/menus (e.g. filter panel selection). |
| `border`, `input`, `ring` | Hairlines, input borders, focus rings. |
| `success`, `warning`, `info`, `destructive` | Status meaning only. `destructive-foreground` is defined for solid destructive fills. |
| `chart-1…5` | Charts: logo blue, teal, green, then amber, red. |
| `sidebar-*` | App sidebar only. |

**Status tint recipe** (badges, soft callouts): `border-{tone}/30 bg-{tone}/10 text-{tone}`.
Solid dots/indicators: `bg-{tone}`.

### Accent themes

Users pick an accent in the user menu (blue · teal · green · violet · neutral). Implementation:
`src/lib/theme.ts` (list + cookie name), `src/hooks/use-accent.ts` (reads/writes `<html data-accent>`
and the `accent` cookie client-side), root layout sets the attribute server-side from the cookie. Each
`[data-accent='x']` block in `globals.css` overrides only `primary`, `ring`, `accent` and
`sidebar-*` tokens — so **always use `primary`/`accent` for brand color, never hardcode blue**, or it
won't follow the user's choice. To add an accent: extend `accentColors`, add light + `.dark` blocks,
add `UserMenu.accent.<name>` to `messages/{zh,en}/common.json`.

## Typography

Fonts: Geist Sans / Geist Mono (`font-mono` for commands, paths, IDs, image refs, versions).

| Role | Classes |
| --- | --- |
| Page title (h1, only via `PageHeader`) | `text-2xl font-semibold tracking-tight` |
| Page description | `text-sm text-muted-foreground` |
| Section heading (h2) | `text-lg font-semibold tracking-tight` |
| Card / section-card title | `text-base font-semibold` (card list items: `font-semibold`) |
| Sub-heading inside a card (h4) | `text-sm font-medium` |
| Body | `text-sm`; secondary `text-sm text-muted-foreground` |
| Meta / labels / table headers | `text-xs text-muted-foreground` |
| Panel eyebrow (filter panel title) | `text-xs font-medium uppercase tracking-wide text-muted-foreground` |
| Metric value | `text-2xl font-semibold tabular-nums` |

Use `tabular-nums` for counts, durations, times. Headings and metrics never go above `text-2xl`
or use `font-bold` (a one-off display value like the Codex device code is the exception).

## Spacing, radius, elevation

- Radius: cards/panels/tables `rounded-xl`; inputs/buttons/inner boxes `rounded-lg`/`rounded-md`;
  pills/tags `rounded-full`.
- Grids: `gap-4` for card grids, `gap-6` between page regions, `gap-3` for stat tiles.
- Cards rest at the default `shadow-sm`; hover lifts to `shadow-md` — no translate/scale effects.
- Buttons/menu items already have `gap-2`: **don't add `mr-2`/`ml-2` to icons inside them.**

## Page layout

```tsx
import { PageContainer, PageHeader, PageShell } from '@/components/layout/page-shell'

<PageShell breadcrumbs={[{ label: t('tools'), href: '/tool' }, { label: tool.name }]}>
  <PageContainer size='default'>            {/* narrow | default | wide */}
    <PageHeader
      title={tool.name}
      titleAddon={<Badge variant='secondary'>{version}</Badge>}  // optional
      description={tool.description}
      actions={<Button>…</Button>}                                // optional, right-aligned
    />
    …
  </PageContainer>
</PageShell>
```

| Container size | Width | Use for |
| --- | --- | --- |
| `narrow` | `max-w-5xl` | Add/edit forms, wizards, single-column settings (coding agent) |
| `default` | `max-w-7xl` | Lists, detail pages, table or list+detail settings (notifications) |
| `wide` | `max-w-[96rem]` | Dashboards (workflow monitor) |

- Last breadcrumb is the current page (no `href`); earlier crumbs link back. Don't add "← Back"
  links — the breadcrumb is the back navigation.
- **Full-bleed pages** (editor, code workspace, project detail, run canvas) keep their own
  `SidebarInset` body but must render `<PageTopbar breadcrumbs={…} actions={…} />` as the header.
- List pages with filters: `flex flex-col gap-6 md:flex-row` with `<FilterPanel>` on the left
  (`src/components/layout/filter-panel.tsx`) and `<section className='min-w-0 flex-1'>`.
- Detail pages with a sidebar: `grid gap-6 lg:grid-cols-3`, main `lg:col-span-2`, sidebar
  `lg:sticky lg:top-0 lg:self-start`.
- Long forms: sticky action bar at the bottom —
  `sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6`.

## Component patterns

**List card** (images, tools, code, subgraphs, related tools) — the whole card is the link:

```tsx
<Card className='group relative gap-3 p-5 transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-md'>
  <div className='flex items-start gap-3'>
    <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
      <WrenchIcon className='size-5' />
    </div>
    <div className='min-w-0 flex-1'>
      <Link href={href} className='block truncate font-semibold after:absolute after:inset-0 group-hover:text-primary'>
        {name}
      </Link>
      <code className='mt-1 block truncate font-mono text-xs text-muted-foreground'>{ref}</code>
    </div>
    {/* interactive children need `relative z-10` to sit above the stretched link */}
  </div>
  <p className='line-clamp-2 text-sm text-muted-foreground'>{description}</p>
</Card>
```

Grid: `grid gap-4 md:grid-cols-2 xl:grid-cols-3`. Card menus: ghost icon button with `aria-label`,
delete item uses `<DropdownMenuItem variant='destructive'>`.

**Section card** (detail/settings content blocks): `SectionCard` from
`src/components/layout/section-card.tsx` — `icon`, `title`, `description`, `action`,
`contentClassName`.

**Metric tile:** `StatTile` from `src/components/layout/stat-tile.tsx` (icon + label + value).
No colored/gradient metric cards.

**Tables:** wrap in `overflow-hidden rounded-xl border bg-card`. `ui/table.tsx` already provides the
tinted header (`bg-muted/40`, `text-xs text-muted-foreground`) and `px-3 py-2.5` cells — don't
restyle header rows per table.

**Run / task status:** always `RunStatusBadge` / `RunStatusIcon` from
`src/components/workflow/run-status.tsx`. The maps live in `src/lib/status.ts`:
`RUN_STATUS_APPEARANCE` (pending/ready → warning, running → info, succeeded → success,
failed → danger, queued/blocked → neutral) and `statusToneClasses[tone]` (`badge`, `text`, `dot`,
`soft`) for any other status-like visual (e.g. notification channel health in
`src/lib/notification.ts`). Never define a local status→color map.

**Settings forms:** save bars appear only when the form is dirty (`unsaved changes` + Discard +
Save). Options that need explanation are described radio cards (see Codex sandbox in
`codex-agent-settings.tsx`), with a `warning` tone on dangerous choices.

**Tool tags:** `ToolTagBadge`. **Code language:** `CodeTypeBadge` / `CodeTypeIcon`.

**Empty / loading / error:**
- Empty: `<Empty className='border border-dashed'>` with `<EmptyMedia variant='icon'>`; inline
  empties: `rounded-lg border border-dashed p-4 text-sm text-muted-foreground`.
- Loading: `Skeleton` blocks shaped like the content (`h-40 rounded-xl` for cards) — no spinners
  for page/section loads. Mark the container `aria-busy='true'` with an `sr-only` label.
- Notices: `<Alert variant='warning' | 'info' | 'destructive'>`.

**Search input:** `relative w-full sm:w-64` wrapper, icon
`pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground`,
input `pl-8`.

**Selection state** (picked item, dynamic mapping): `border-primary bg-primary/5` (+ `ring-1
ring-primary` for selectable cards). Required-field asterisk: `text-destructive`.

## Copy

All user-visible text goes through next-intl (`messages/{zh,en}/*.json`), including toasts,
aria-labels and page metadata. No hardcoded Chinese or English strings in components.

## Checklist before finishing UI work

- [ ] Page uses `PageShell`/`PageTopbar` + `PageContainer` + `PageHeader`; correct container size.
- [ ] No raw palette colors for status/brand; brand color via `primary`/`accent`.
- [ ] Headings follow the type scale; no `text-3xl`/`font-bold`.
- [ ] Cards/tables/empties/skeletons match the patterns above.
- [ ] Node components untouched.
- [ ] Strings translated in both `zh` and `en`.
- [ ] `pnpm build`, Biome on changed files, `npx react-doctor@latest --diff --offline`.
