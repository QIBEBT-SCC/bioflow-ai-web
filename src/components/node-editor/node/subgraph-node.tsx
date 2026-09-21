'use client'
import {
  type NodeProps,
  useReactFlow,
  useUpdateNodeInternals,
} from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import { useReadOnly } from '@/components/node-editor/read-only-context'
import { useSubgraphNavigation } from '@/components/node-editor/subgraph-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { emptyInterface, parameterValue, setParameter } from '@/lib/subgraph'
import type { WorkflowDefinition } from '@/types/workflow'

function ParameterField({
  value,
  inputId,
  field,
  disabled,
  onChange,
}: {
  value: unknown
  inputId: string
  field: string
  disabled: boolean
  onChange: (value: unknown) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const [invalid, setInvalid] = useState(false)
  if (typeof value === 'boolean')
    return (
      <Switch
        id={inputId}
        checked={value}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    )
  if (typeof value === 'number')
    return (
      <Input
        id={inputId}
        type='number'
        value={value}
        disabled={disabled}
        onChange={(event) => {
          if (event.target.value !== '') onChange(Number(event.target.value))
        }}
      />
    )
  if (Array.isArray(value))
    return (
      <Textarea
        id={inputId}
        aria-invalid={invalid}
        value={draft ?? JSON.stringify(value)}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          if (draft === null) return
          try {
            const parsed: unknown = JSON.parse(draft)
            if (!Array.isArray(parsed)) throw new Error('Expected array')
            onChange(parsed)
            setDraft(null)
            setInvalid(false)
          } catch {
            setInvalid(true)
          }
        }}
      />
    )
  if (!['code', 'content', 'prompt', 'modifiable_params'].includes(field))
    return (
      <Input
        id={inputId}
        value={String(value ?? '')}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  return (
    <Textarea
      id={inputId}
      value={String(value ?? '')}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export function SubgraphNode({ id, data }: NodeProps) {
  const t = useTranslations('editor.subgraph')
  const graph = data.workflow as WorkflowDefinition
  const iface = graph.interface ?? emptyInterface()
  const readOnly = useReadOnly()
  const enter = useSubgraphNavigation()
  const { updateNodeData } = useReactFlow()
  const updateInternals = useUpdateNodeInternals()
  const portKey = JSON.stringify(iface)
  // biome-ignore lint/correctness/useExhaustiveDependencies: React Flow must remeasure when the port schema changes.
  useEffect(() => {
    updateInternals(id)
  }, [id, portKey, updateInternals])
  return (
    <BaseNode
      title={String(data.name || t('title'))}
      description={String(data.description || '')}
      color={colorSchemes.blue}
      handles={{
        inputs: iface.inputs.map((port) => ({
          name: port.id,
          label: port.name,
          description: '',
        })),
        outputs: iface.outputs.map((port) => ({
          name: port.id,
          label: port.name,
          description: '',
        })),
      }}
      nodeComponent={
        <div className='nodrag nowheel space-y-3 px-3'>
          {!readOnly && (
            <Input
              aria-label={t('name')}
              value={String(data.name || '')}
              onChange={(event) =>
                updateNodeData(id, { name: event.target.value })
              }
            />
          )}
          <Button
            variant='outline'
            className='w-full'
            onClick={() => enter(id)}
          >
            {t('enter')} · {graph.nodes.length}
          </Button>
          {iface.parameters.map((parameter) => (
            <label
              htmlFor={`${id}-${parameter.id}`}
              className='block space-y-1 text-xs'
              key={parameter.id}
            >
              <span>{parameter.name}</span>
              <ParameterField
                inputId={`${id}-${parameter.id}`}
                field={parameter.field}
                value={parameterValue(graph, parameter)}
                disabled={readOnly}
                onChange={(value) =>
                  updateNodeData(id, {
                    workflow: setParameter(graph, parameter, value),
                  })
                }
              />
            </label>
          ))}
        </div>
      }
    />
  )
}
