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
import { cn } from 'cn'
import {
  ChevronDownIcon,
  FileInputIcon,
  FileOutputIcon,
  GripVerticalIcon,
  InfoIcon,
  PanelRightCloseIcon,
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
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { generateLetterId } from '@/lib/id-generator'
import { emptyInterface } from '@/lib/subgraph'
import { useNodeEditorStore } from '@/stores/nodeviewStore'
import type { InterfaceInput, InterfaceOutput } from '@/types/workflow'

type InterfaceKind = 'inputs' | 'outputs'
type InterfacePort = InterfaceInput | InterfaceOutput
type EditablePortField = 'name' | 'description'

function isPortConnected(kind: InterfaceKind, port: InterfacePort): boolean {
  if (kind === 'inputs') {
    return (port as InterfaceInput).targets.length > 0
  }
  const output = port as InterfaceOutput
  return Boolean(output.source.node_id && output.source.handle)
}

function SortablePortRow({
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
  const [expanded, setExpanded] = useState(false)
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
  const connected = isPortConnected(kind, port)
  const hasDescription = port.description.trim().length > 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='rounded-lg border bg-card transition-colors hover:border-foreground/20'
    >
      <div className='flex items-center gap-1 px-1 py-1'>
        <button
          type='button'
          {...attributes}
          {...listeners}
          className='touch-none cursor-grab rounded p-1 text-muted-foreground/70 hover:bg-muted hover:text-foreground active:cursor-grabbing'
          aria-label={t('drag_to_reorder')}
        >
          <GripVerticalIcon className='size-3.5' />
        </button>

        <Tooltip>
          <TooltipTrigger asChild>
            <span
              role='img'
              className={cn(
                'size-1.5 shrink-0 rounded-full',
                connected ? 'bg-primary' : 'bg-muted-foreground/30',
              )}
              aria-label={t(connected ? 'connected' : 'unconnected')}
            />
          </TooltipTrigger>
          <TooltipContent side='left'>
            {t(connected ? 'connected' : 'unconnected')}
          </TooltipContent>
        </Tooltip>

        <Input
          value={port.name}
          placeholder={t('port_name_placeholder')}
          aria-label={t('port_name')}
          className='h-7 min-w-0 flex-1 border-transparent bg-transparent px-1.5 text-xs font-medium shadow-none focus-visible:border-input focus-visible:bg-background'
          onChange={(event) => onUpdate('name', event.target.value)}
        />

        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={cn(
            'size-6 shrink-0',
            hasDescription
              ? 'text-foreground'
              : 'text-muted-foreground/70 hover:text-foreground',
          )}
          aria-label={t('edit_description')}
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
        >
          <ChevronDownIcon
            className={cn(
              'size-3.5 transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </Button>

        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-6 shrink-0 text-muted-foreground/70 hover:text-destructive'
          aria-label={t('remove')}
          onClick={onRemove}
        >
          <Trash2Icon className='size-3.5' />
        </Button>
      </div>

      {!expanded && hasDescription && (
        <button
          type='button'
          className='block w-full truncate px-7 pb-1.5 text-left text-[11px] text-muted-foreground hover:text-foreground'
          onClick={() => setExpanded(true)}
        >
          {port.description}
        </button>
      )}

      {expanded && (
        <div className='border-t border-border/60 px-2 py-2'>
          <Textarea
            className='min-h-14 resize-y text-xs'
            value={port.description}
            placeholder={t('port_description_placeholder')}
            aria-label={t('port_description')}
            onChange={(event) => onUpdate('description', event.target.value)}
          />
        </div>
      )}
    </div>
  )
}

export function SubgraphInterfaceEditor({ onClose }: { onClose?: () => void }) {
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
    <TooltipProvider>
      <aside
        className='flex w-72 shrink-0 flex-col border-l bg-background xl:w-80'
        aria-label={t('interface')}
      >
        <div className='flex items-center justify-between gap-2 border-b px-3.5 py-2.5'>
          <div className='flex items-center gap-1.5'>
            <h2 className='text-sm font-semibold'>{t('interface')}</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type='button'
                  className='inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground'
                  aria-label={t('interface')}
                >
                  <InfoIcon className='size-3.5' />
                </button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='max-w-64'>
                {t('interface_help')}
              </TooltipContent>
            </Tooltip>
          </div>
          {onClose && (
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-7 text-muted-foreground hover:text-foreground'
              aria-label={t('hide_interface')}
              onClick={onClose}
            >
              <PanelRightCloseIcon className='size-4' />
            </Button>
          )}
        </div>

        <div className='flex-1 space-y-5 overflow-y-auto p-3'>
          {(['inputs', 'outputs'] as const).map((kind) => {
            const portIds = iface[kind].map((port) => port.id)
            const inputs = kind === 'inputs'
            const KindIcon = inputs ? FileInputIcon : FileOutputIcon
            return (
              <section
                key={kind}
                className={cn('space-y-2', !inputs && 'border-t pt-4')}
              >
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-1.5'>
                    <KindIcon className='size-3.5 text-muted-foreground' />
                    <h3 className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                      {t(kind)}
                    </h3>
                    <span className='rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums'>
                      {iface[kind].length}
                    </span>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground'
                    onClick={() => addPort(kind)}
                  >
                    <PlusIcon className='size-3.5' />
                    {t(inputs ? 'add_input' : 'add_output')}
                  </Button>
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
                      <div className='space-y-1.5'>
                        {iface[kind].map((port) => (
                          <SortablePortRow
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
                  <div className='rounded-lg border border-dashed px-3 py-3 text-center text-xs text-muted-foreground'>
                    {t('no_ports')}
                  </div>
                )}
              </section>
            )
          })}
        </div>
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
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={() => {
                if (pendingDelete) remove(pendingDelete.kind, pendingDelete.id)
              }}
            >
              {t('remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
