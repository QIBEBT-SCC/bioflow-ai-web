'use client'
import { useReactFlow } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { WorkflowMetadataDialog } from '@/components/node-editor/workflow-metadata-dialog'
import { Button } from '@/components/ui/button'
import { emptyInterface } from '@/lib/subgraph'
import { useNodeEditorStore } from '@/stores/nodeviewStore'

export function SubgraphToolbar() {
  const t = useTranslations('editor.subgraph')
  const store = useNodeEditorStore()
  const { fitView } = useReactFlow()
  const navigate = (depth: number) => {
    for (let index = store.parents.length; index > depth; index--)
      useNodeEditorStore.getState().leaveSubgraph()
    requestAnimationFrame(() => void fitView({ padding: 0.15 }))
  }
  return (
    <div className='flex flex-wrap items-center gap-2 border-t px-3 py-2'>
      <Button size='sm' variant='ghost' onClick={() => navigate(0)}>
        {t('root')}
      </Button>
      {store.parents.map((frame, index) => (
        <Button
          key={frame.id}
          size='sm'
          variant='ghost'
          onClick={() => navigate(index + 1)}
        >
          / {frame.name}
        </Button>
      ))}
      {!store.graphInterface && (
        <Button
          size='sm'
          variant='outline'
          onClick={() => store.setInterface(emptyInterface())}
        >
          {t('interface')}
        </Button>
      )}
      {!store.parents.length && <WorkflowMetadataDialog />}
    </div>
  )
}
