'use client'
import { useReactFlow } from '@xyflow/react'
import type { ReactNode } from 'react'
import { PageTopbar } from '@/components/layout/page-shell'
import { withSubgraphCrumbs } from '@/lib/subgraph-crumbs'
import { useNodeEditorStore } from '@/stores/nodeviewStore'

/** Editor page topbar whose breadcrumbs double as subgraph navigation. */
export function EditorTopbar({
  title,
  workflowName,
  actions,
}: {
  title: string
  workflowName?: string
  actions?: ReactNode
}) {
  const parents = useNodeEditorStore((state) => state.parents)
  const { fitView } = useReactFlow()
  const navigate = (depth: number) => {
    const store = useNodeEditorStore.getState()
    for (let index = store.parents.length; index > depth; index--)
      store.leaveSubgraph()
    requestAnimationFrame(() => void fitView({ padding: 0.15 }))
  }
  const base = [{ label: title }]
  if (workflowName) base.push({ label: workflowName })
  return (
    <PageTopbar
      breadcrumbs={withSubgraphCrumbs(
        base,
        parents.map((frame) => frame.name),
        navigate,
      )}
      actions={actions}
    />
  )
}
