'use client'
import { Panel } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import type { WorkflowInterface } from '@/types/workflow'

export function SubgraphInterfaceSummary({
  value,
}: {
  value?: WorkflowInterface | null
}) {
  const t = useTranslations('editor.subgraph')
  if (!value) return null
  return (
    <>
      {value.inputs.length > 0 && (
        <Panel
          position='top-left'
          className='max-w-64 rounded-lg border bg-background/95 p-3 shadow-sm'
        >
          <h3 className='mb-2 text-sm font-semibold'>{t('inputs')}</h3>
          {value.inputs.map((port) => (
            <div className='mb-2 text-xs' key={port.id}>
              <strong>{port.name}</strong>
              {port.targets.map((target) => (
                <div
                  className='text-muted-foreground'
                  key={`${target.node_id}/${target.handle}`}
                >
                  → {target.node_id} · {target.handle}
                </div>
              ))}
            </div>
          ))}
        </Panel>
      )}
      {value.outputs.length > 0 && (
        <Panel
          position='top-right'
          className='max-w-64 rounded-lg border bg-background/95 p-3 shadow-sm'
        >
          <h3 className='mb-2 text-sm font-semibold'>{t('outputs')}</h3>
          {value.outputs.map((port) => (
            <div className='mb-2 text-xs' key={port.id}>
              <strong>{port.name}</strong>
              <div className='text-muted-foreground'>
                {port.source.node_id} · {port.source.handle} →
              </div>
            </div>
          ))}
        </Panel>
      )}
    </>
  )
}
