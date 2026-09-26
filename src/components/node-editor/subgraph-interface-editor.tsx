'use client'

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  FileInputIcon,
  FileOutputIcon,
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { generateLetterId } from '@/lib/id-generator'
import { emptyInterface } from '@/lib/subgraph'
import { cn } from '@/lib/utils'
import { useNodeEditorStore } from '@/stores/nodeviewStore'
import type { InterfaceInput, InterfaceOutput } from '@/types/workflow'

type InterfaceKind = 'inputs' | 'outputs'
type InterfacePort = InterfaceInput | InterfaceOutput
type EditablePortField = 'name' | 'description'

function SortablePortEditor({
  kind,
  port,
  onUpdate,
  onRemove,
}: {
  kind: InterfaceKind
  port: InterfacePort
  onUpdate: (field: EditablePortField, value: string) => void
  onRemove: () => void
}) {
  const t = useTranslations('editor.subgraph')
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: port.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  const nameId = `${kind}-${port.id}-name`
  const descriptionId = `${kind}-${port.id}-description`

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'space-y-3 rounded-lg border border-l-4 bg-card p-3 shadow-xs',
        kind === 'inputs' ? 'border-l-blue-500' : 'border-l-green-500',
      )}
    >
      <div className='flex items-center justify-between gap-2'>
        <button
          type='button'
          {...attributes}
          {...listeners}
          className='touch-none cursor-grab rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing'
          aria-label={t('drag_to_reorder')}
        >
          <GripVerticalIcon className='size-4' />
        </button>
        <span className='min-w-0 flex-1 truncate text-sm font-medium'>
          {port.name || t('unnamed_port')}
        </span>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-8 text-muted-foreground hover:text-destructive'
          aria-label={t('remove')}
          onClick={onRemove}
        >
          <Trash2Icon className='size-4' />
        </Button>
      </div>

      <div className='space-y-2'>
        <Label htmlFor={nameId}>{t('port_name')}</Label>
        <Input
          id={nameId}
          value={port.name}
          placeholder={t('port_name_placeholder')}
          onChange={(event) => onUpdate('name', event.target.value)}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor={descriptionId}>{t('port_description')}</Label>
        <Textarea
          id={descriptionId}
          className='min-h-20 resize-y'
          value={port.description}
          placeholder={t('port_description_placeholder')}
          onChange={(event) => onUpdate('description', event.target.value)}
        />
      </div>
    </div>
  )
}

export function SubgraphInterfaceEditor() {
  const t = useTranslations('editor.subgraph')
  const store = useNodeEditorStore()
  const [pendingDelete, setPendingDelete] = useState<{
    kind: InterfaceKind
    id: string
  } | null>(null)
  const iface = store.graphInterface ?? emptyInterface()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const update = (
    kind: InterfaceKind,
    id: string,
    field: EditablePortField,
    value: string,
  ) =>
    store.setInterface({
      ...iface,
      [kind]: iface[kind].map((port) =>
        port.id === id ? { ...port, [field]: value } : port,
      ),
    })

  const reorder = (kind: InterfaceKind, event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = iface[kind].findIndex((port) => port.id === active.id)
    const newIndex = iface[kind].findIndex((port) => port.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    store.setInterface(
      kind === 'inputs'
        ? { ...iface, inputs: arrayMove(iface.inputs, oldIndex, newIndex) }
        : { ...iface, outputs: arrayMove(iface.outputs, oldIndex, newIndex) },
    )
  }

  const remove = (kind: InterfaceKind, id: string) => {
    const parent = store.parents.at(-1)
    if (parent) {
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

  const addPort = (kind: InterfaceKind) => {
    const port = {
      id: generateLetterId(),
      name: `${t(kind)} ${iface[kind].length + 1}`,
      description: '',
      ...(kind === 'inputs'
        ? { targets: [] }
        : { source: { node_id: '', handle: '' } }),
    }
    store.setInterface({ ...iface, [kind]: [...iface[kind], port] })
  }

  return (
    <>
      <aside
        className='w-[30rem] shrink-0 space-y-6 overflow-y-auto border-l bg-background p-4 xl:w-[32rem]'
        aria-label={t('interface')}
      >
        <div className='space-y-1'>
          <h2 className='font-semibold'>{t('interface')}</h2>
          <p className='text-sm text-muted-foreground'>{t('interface_help')}</p>
        </div>
        {(['inputs', 'outputs'] as const).map((kind) => {
          const portIds = iface[kind].map((port) => port.id)
          const inputs = kind === 'inputs'
          const KindIcon = inputs ? FileInputIcon : FileOutputIcon
          return (
            <section
              key={kind}
              className={cn(
                'space-y-3',
                !inputs && 'mt-2 border-t-2 border-border pt-6',
              )}
            >
              <div className='flex items-center justify-between'>
                <h3
                  className={cn(
                    'flex items-center gap-2 text-lg font-semibold',
                    inputs ? 'text-blue-700' : 'text-green-700',
                  )}
                >
                  <KindIcon className='size-5' />
                  {t(kind)}
                </h3>
                <span
                  className={cn(
                    'text-sm font-medium',
                    inputs ? 'text-blue-700' : 'text-green-700',
                  )}
                >
                  {iface[kind].length}
                </span>
              </div>
              {iface[kind].length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => reorder(kind, event)}
                >
                  <SortableContext
                    items={portIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className='space-y-3'>
                      {iface[kind].map((port) => (
                        <SortablePortEditor
                          key={port.id}
                          kind={kind}
                          port={port}
                          onUpdate={(field, value) =>
                            update(kind, port.id, field, value)
                          }
                          onRemove={() =>
                            setPendingDelete({ kind, id: port.id })
                          }
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className='rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground'>
                  {t('no_ports')}
                </div>
              )}
              <Button
                type='button'
                variant='outline'
                className={cn(
                  'w-full bg-background',
                  inputs
                    ? 'border-blue-200 text-blue-700 hover:bg-blue-100/70 hover:text-blue-800'
                    : 'border-green-200 text-green-700 hover:bg-green-100/70 hover:text-green-800',
                )}
                onClick={() => addPort(kind)}
              >
                <PlusIcon className='size-4' />
                {t(kind === 'inputs' ? 'add_input' : 'add_output')}
              </Button>
            </section>
          )
        })}
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
