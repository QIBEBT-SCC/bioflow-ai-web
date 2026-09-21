'use client'

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
import { generateLetterId } from '@/lib/id-generator'
import { emptyInterface } from '@/lib/subgraph'
import { useNodeEditorStore } from '@/stores/nodeviewStore'

type InterfaceKind = 'inputs' | 'outputs'

export function SubgraphInterfaceEditor() {
  const t = useTranslations('editor.subgraph')
  const store = useNodeEditorStore()
  const [pendingDelete, setPendingDelete] = useState<{
    kind: InterfaceKind
    id: string
  } | null>(null)
  const iface = store.graphInterface ?? emptyInterface()

  const update = (kind: InterfaceKind, id: string, name: string) =>
    store.setInterface({
      ...iface,
      [kind]: iface[kind].map((port) =>
        port.id === id ? { ...port, name } : port,
      ),
    })

  const move = (kind: InterfaceKind, index: number, delta: number) => {
    const values = [...iface[kind]]
    const next = index + delta
    if (next < 0 || next >= values.length) return
    ;[values[index], values[next]] = [values[next], values[index]]
    store.setInterface({ ...iface, [kind]: values })
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
      ...(kind === 'inputs'
        ? { targets: [] }
        : { source: { node_id: '', handle: '' } }),
    }
    store.setInterface({ ...iface, [kind]: [...iface[kind], port] })
  }

  return (
    <>
      <aside
        className='w-80 shrink-0 space-y-4 overflow-y-auto border-l bg-background p-4'
        aria-label={t('interface')}
      >
        <h2 className='font-semibold'>{t('interface')}</h2>
        <p className='text-sm text-muted-foreground'>{t('interface_help')}</p>
        {(['inputs', 'outputs'] as const).map((kind) => (
          <section key={kind} className='space-y-3'>
            <h3 className='font-semibold'>{t(kind)}</h3>
            {iface[kind].map((port, index) => (
              <div className='rounded border p-3' key={port.id}>
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
              </div>
            ))}
            <Button variant='outline' onClick={() => addPort(kind)}>
              {t('add')}
            </Button>
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
