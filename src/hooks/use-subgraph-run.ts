'use client'
import { useMemo, useState } from 'react'
import type { WorkflowDefinition } from '@/types/workflow'
import type { WorkflowRunV2 } from '@/types/workflow-v2'

const ROOT_PATH: string[] = []
function descend(
  graph: WorkflowDefinition,
  path: string[],
): { graph: WorkflowDefinition; labels: string[] } {
  if (!path.length) return { graph, labels: [] }
  const node = graph.nodes.find(
    (node) => node.id === path[0] && node.type === 'subgraph',
  )
  if (!node) return { graph, labels: [] }
  const child = descend(node.data.workflow as WorkflowDefinition, path.slice(1))
  return {
    graph: child.graph,
    labels: [String(node.data.name || node.id), ...child.labels],
  }
}

/** Keep navigation local while every streamed update refreshes the same run snapshot. */
export function useSubgraphRun(run: WorkflowRunV2 | null | undefined) {
  const [navigation, setNavigation] = useState<{
    runUid?: string
    path: string[]
  }>({ path: ROOT_PATH })
  const path = navigation.runUid === run?.uid ? navigation.path : ROOT_PATH
  const resolved = useMemo(() => (run ? descend(run, path) : null), [run, path])
  const visibleRun = useMemo(
    () =>
      run && resolved
        ? {
            ...run,
            uid: `${run.uid}/${path.join('/')}`,
            nodes: resolved.graph.nodes,
            edges: resolved.graph.edges,
            interface: resolved.graph.interface,
          }
        : null,
    [run, resolved, path],
  )
  const navigate = (depth: number) =>
    setNavigation({ runUid: run?.uid, path: path.slice(0, depth) })
  const enter = (id: string) =>
    setNavigation({ runUid: run?.uid, path: [...path, id] })
  return { visibleRun, labels: resolved?.labels ?? ROOT_PATH, enter, navigate }
}
