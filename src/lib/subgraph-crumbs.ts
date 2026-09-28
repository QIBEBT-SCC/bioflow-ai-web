import type { PageCrumb } from '@/components/layout/page-shell'

/**
 * Appends the open subgraph path to page breadcrumbs. The last base crumb
 * stands for the root graph and navigates back to it while a subgraph is open.
 */
export function withSubgraphCrumbs(
  base: PageCrumb[],
  labels: string[],
  onNavigate: (depth: number) => void,
): PageCrumb[] {
  if (!labels.length) return base
  const root = base.at(-1)
  return [
    ...base.slice(0, -1),
    ...(root ? [{ label: root.label, onClick: () => onNavigate(0) }] : []),
    ...labels.map((label, index) => ({
      label,
      onClick: () => onNavigate(index + 1),
    })),
  ]
}
