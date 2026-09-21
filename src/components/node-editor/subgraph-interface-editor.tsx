'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { nodeDefaultData } from '@/components/node-editor/node-registry'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { generateLetterId } from '@/lib/id-generator'
import { emptyInterface, graphNodes, setParameter } from '@/lib/subgraph'
import { useNodeEditorStore } from '@/stores/nodeviewStore'
import type { InterfaceParameter, WorkflowDefinition } from '@/types/workflow'

type Choice = { value: string; label: string }
function Picker({
  choices,
  value,
  onChange,
  multiple = false,
  label,
}: {
  choices: Choice[]
  value: string | string[]
  onChange: (values: string[]) => void
  multiple?: boolean
  label: string
}) {
  return (
    <select
      aria-label={label}
      multiple={multiple}
      className='w-full rounded border p-2 text-sm'
      value={value}
      onChange={(event) =>
        onChange(
          Array.from(event.target.selectedOptions, (option) => option.value),
        )
      }
    >
      {!multiple && <option value=''>{label}</option>}
      {choices.map((choice) => (
        <option key={choice.value} value={choice.value}>
          {choice.label}
        </option>
      ))}
    </select>
  )
}

const excludedFields = new Set([
  'run_data',
  'workflow',
  'source_uid',
  'tool_uid',
  'db_id',
  'db_name',
  'anchor_node_id',
  'name',
  'description',
])
function parameterChoices(
  graph: WorkflowDefinition,
  path: string[] = [],
): { parameter: InterfaceParameter; value: unknown; label: string }[] {
  return graph.nodes.flatMap((node) => {
    const nodePath = [...path, node.id]
    if (node.type === 'subgraph')
      return parameterChoices(
        node.data.workflow as WorkflowDefinition,
        nodePath,
      )
    if (node.type === 'note') return []
    const fields = { ...nodeDefaultData[node.type ?? ''], ...node.data }
    return Object.entries(fields).flatMap(([field, value]) => {
      if (
        excludedFields.has(field) ||
        (!['string', 'number', 'boolean'].includes(typeof value) &&
          !Array.isArray(value))
      )
        return []
      return [
        {
          parameter: { id: '', name: field, node_path: nodePath, field },
          value,
          label: `${nodePath.join(' / ')} · ${field}`,
        },
      ]
    })
  })
}

function InterfaceMappingPicker({ port }: { port: InterfaceParameter }) {
  const t = useTranslations('editor.subgraph')
  const store = useNodeEditorStore()
  const iface = store.graphInterface ?? emptyInterface()
  const parameters = parameterChoices(store.getGraph())
  return (
    <>
      {'node_path' in port && (
        <Picker
          label={t('parameters')}
          choices={parameters.map((choice) => ({
            value: choice.label,
            label: choice.label,
          }))}
          value={
            parameters.find(
              (choice) =>
                JSON.stringify(choice.parameter.node_path) ===
                  JSON.stringify(port.node_path) &&
                choice.parameter.field === port.field,
            )?.label ?? ''
          }
          onChange={(values) => {
            const choice = parameters.find(
              (choice) => choice.label === values[0],
            )
            if (choice) {
              store.setNodes(
                graphNodes(
                  setParameter(
                    store.getGraph(),
                    choice.parameter,
                    choice.value,
                  ),
                ),
              )
              store.setInterface({
                ...iface,
                parameters: iface.parameters.map((parameter) =>
                  parameter.id === port.id
                    ? {
                        ...choice.parameter,
                        id: port.id,
                        name: port.name,
                      }
                    : parameter,
                ),
              })
            }
          }}
        />
      )}
    </>
  )
}

export function SubgraphInterfaceEditor() {
  const t = useTranslations('editor.subgraph')
  const store = useNodeEditorStore()
  const [pendingDelete, setPendingDelete] = useState<{
    kind: 'inputs' | 'outputs' | 'parameters'
    id: string
  } | null>(null)
  const [parameterChoice, setParameterChoice] = useState('')
  const iface = store.graphInterface ?? emptyInterface()
  const parameters = parameterChoices(store.getGraph())
  const update = (
    kind: 'inputs' | 'outputs' | 'parameters',
    id: string,
    name: string,
  ) =>
    store.setInterface({
      ...iface,
      [kind]: iface[kind].map((port) =>
        port.id === id ? { ...port, name } : port,
      ),
    })
  const move = (
    kind: 'inputs' | 'outputs' | 'parameters',
    index: number,
    delta: number,
  ) => {
    const values = [...iface[kind]]
    const next = index + delta
    if (next < 0 || next >= values.length) return
    ;[values[index], values[next]] = [values[next], values[index]]
    store.setInterface({ ...iface, [kind]: values })
  }
  const remove = (kind: 'inputs' | 'outputs' | 'parameters', id: string) => {
    const parent = store.parents.at(-1)
    if (parent && kind !== 'parameters') {
      const parentInterface = parent.graph.interface
      const referenced =
        kind === 'inputs'
          ? parentInterface?.inputs.some((port) =>
              port.targets.some(
                (target) =>
                  target.node_id === parent.id && target.handle === id,
              ),
            )
          : parentInterface?.outputs.some(
              (port) =>
                port.source.node_id === parent.id && port.source.handle === id,
            )
      if (referenced) {
        toast.error(t('parent_reference'))
        return
      }
      const handle = `${parent.id}-${kind === 'inputs' ? 'in' : 'out'}-${id}`
      useNodeEditorStore.setState({
        parents: store.parents.map((frame) =>
          frame === parent
            ? {
                ...frame,
                graph: {
                  ...frame.graph,
                  edges: frame.graph.edges.filter(
                    (edge) =>
                      edge.sourceHandle !== handle &&
                      edge.targetHandle !== handle,
                  ),
                },
              }
            : frame,
        ),
      })
    }
    store.setInterface({
      ...iface,
      [kind]: iface[kind].filter((port) => port.id !== id),
    })
    setPendingDelete(null)
  }
  const addPort = (kind: 'inputs' | 'outputs') => {
    const port = {
      id: generateLetterId(),
      name: `${t(kind)} ${iface[kind].length + 1}`,
      ...(kind === 'inputs'
        ? { targets: [] }
        : { source: { node_id: '', handle: '' } }),
    }
    store.setInterface({ ...iface, [kind]: [...iface[kind], port] })
  }
  const addParameter = () => {
    const choice = parameters.find((choice) => choice.label === parameterChoice)
    if (!choice) return
    const parameter = { ...choice.parameter, id: generateLetterId() }
    const graph = setParameter(store.getGraph(), parameter, choice.value)
    store.setNodes(graphNodes(graph))
    store.setInterface({
      ...iface,
      parameters: [...iface.parameters, parameter],
    })
  }
  return (
    <>
      <aside
        className='w-80 shrink-0 space-y-4 overflow-y-auto border-l bg-background p-4'
        aria-label={t('interface')}
      >
        <h2 className='font-semibold'>{t('interface')}</h2>
        <p className='text-sm text-muted-foreground'>{t('interface_help')}</p>
        {(['inputs', 'outputs', 'parameters'] as const).map((kind) => (
          <section key={kind} className='space-y-3'>
            <h3 className='font-semibold'>{t(kind)}</h3>
            {iface[kind].map((port, index) => (
              <div className='space-y-2 rounded border p-3' key={port.id}>
                <div className='flex gap-2'>
                  <Input
                    aria-label={t('name')}
                    value={port.name}
                    onChange={(event) =>
                      update(kind, port.id, event.target.value)
                    }
                  />
                  <Button
                    variant='ghost'
                    aria-label={t('up')}
                    disabled={index === 0}
                    onClick={() => move(kind, index, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    variant='ghost'
                    aria-label={t('down')}
                    disabled={index === iface[kind].length - 1}
                    onClick={() => move(kind, index, 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    variant='ghost'
                    onClick={() => setPendingDelete({ kind, id: port.id })}
                  >
                    {t('remove')}
                  </Button>
                </div>
                {'node_path' in port && <InterfaceMappingPicker port={port} />}
              </div>
            ))}
            {kind !== 'parameters' ? (
              <Button variant='outline' onClick={() => addPort(kind)}>
                {t('add')}
              </Button>
            ) : (
              <div className='flex gap-2'>
                <Picker
                  label={t('parameters')}
                  choices={parameters.map((choice) => ({
                    value: choice.label,
                    label: choice.label,
                  }))}
                  value={parameterChoice}
                  onChange={(values) => setParameterChoice(values[0])}
                />
                <Button disabled={!parameterChoice} onClick={addParameter}>
                  {t('add')}
                </Button>
              </div>
            )}
          </section>
        ))}
      </aside>
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('remove')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('disconnect_warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) remove(pendingDelete.kind, pendingDelete.id)
              }}
            >
              {t('remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
