'use client'

import { useState } from 'react'
import { SaveAsDialog } from '@/components/node-editor/save-as-dialog'
import { graphNodes, groupSelection } from '@/lib/subgraph'
import { useNodeEditorStore } from '@/stores/nodeviewStore'
import type { WorkflowDefinition } from '@/types/workflow'

export function SaveSelectionSubgraph({ onClose }: { onClose: () => void }) {
  const [draft] = useState(() =>
    groupSelection(useNodeEditorStore.getState().getGraph()),
  )
  const group = draft.nodes.at(-1)
  if (!group || group.type !== 'subgraph') return null
  return (
    <SaveAsDialog
      selection={{
        workflow: group.data.workflow as WorkflowDefinition,
        onClose,
        onSaved: (uid, name, description) => {
          const store = useNodeEditorStore.getState()
          store.setNodes(
            graphNodes({
              ...draft,
              nodes: draft.nodes.map((node) =>
                node.id === group.id
                  ? {
                      ...node,
                      selected: true,
                      data: {
                        ...node.data,
                        name,
                        description,
                        source_uid: uid,
                      },
                    }
                  : node,
              ),
            }),
          )
          store.setEdges(draft.edges)
          if (draft.interface) store.setInterface(draft.interface)
        },
      }}
    />
  )
}
