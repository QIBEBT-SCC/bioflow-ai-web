'use client'

import { type NodeProps, useReactFlow } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import { useReadOnly } from '@/components/node-editor/read-only-context'
import { Input } from '@/components/ui/input'

export function CollectionNode({ id, data }: NodeProps) {
  const t = useTranslations('editor.fileCollection')
  const readOnly = useReadOnly()
  const { updateNodeData } = useReactFlow()
  const pattern = typeof data.pattern === 'string' ? data.pattern : ''
  const prefix =
    typeof data.subfolder_prefix === 'string' ? data.subfolder_prefix : 'item'
  return (
    <BaseNode
      title={t('title')}
      description={t('description')}
      color={colorSchemes.orange}
      handles={{
        inputs: [{ name: 'folder_path', description: t('input') }],
        outputs: [{ name: 'collection', description: t('output') }],
      }}
      nodeComponent={
        <div className='nodrag space-y-2 p-3'>
          <label htmlFor={`${id}-pattern`} className='text-xs'>
            {t('pattern')}
          </label>
          <Input
            id={`${id}-pattern`}
            value={pattern}
            placeholder={t('placeholder')}
            onChange={(event) =>
              updateNodeData(id, { pattern: event.target.value })
            }
            disabled={readOnly}
          />
          <label htmlFor={`${id}-prefix`} className='text-xs'>
            {t('prefix')}
          </label>
          <Input
            id={`${id}-prefix`}
            value={prefix}
            placeholder='bin'
            onChange={(event) =>
              updateNodeData(id, { subfolder_prefix: event.target.value })
            }
            disabled={readOnly}
          />
        </div>
      }
    />
  )
}
