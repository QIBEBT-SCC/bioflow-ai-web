'use client'

import { useReactFlow } from '@xyflow/react'
import { DownloadIcon, FileJsonIcon, UploadIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type ChangeEvent, useRef, useState } from 'react'
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
import {
  type ParsedWorkflowJson,
  parseWorkflowJson,
  serializeWorkflowJson,
  WorkflowImportError,
} from '@/lib/workflow-json'
import {
  layoutWorkflowNodes,
  prepareWorkflowNodes,
} from '@/lib/workflow-layout'
import { useNodeEditorStore } from '@/stores/nodeviewStore'

const MAX_IMPORT_SIZE = 10 * 1024 * 1024

interface WorkflowJsonActionsProps {
  workflowName?: string
}

function getExportFilename(name?: string): string {
  const safeName = name
    ?.trim()
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  return `${safeName || 'workflow'}.json`
}

export function WorkflowJsonActions({
  workflowName,
}: WorkflowJsonActionsProps) {
  const t = useTranslations('editor')
  const td = useTranslations('editor.workflow_json')
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<ParsedWorkflowJson | null>(
    null,
  )
  const { nodes, edges, setNodes, setEdges } = useNodeEditorStore()
  const { fitView } = useReactFlow()

  const handleExport = () => {
    const content = serializeWorkflowJson({ nodes, edges }, workflowName)
    const url = URL.createObjectURL(
      new Blob([content], { type: 'application/json;charset=utf-8' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = getExportFilename(workflowName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast.success(td('export_success'))
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''

    if (!file) return
    if (file.size > MAX_IMPORT_SIZE) {
      toast.error(td('file_too_large'))
      return
    }

    try {
      setPendingImport(parseWorkflowJson(await file.text()))
    } catch (error) {
      const code =
        error instanceof WorkflowImportError ? error.code : 'invalid_json'
      toast.error(td(`errors.${code}`))
    }
  }

  const handleImport = () => {
    if (!pendingImport) return

    const prepared = prepareWorkflowNodes(pendingImport.workflow.nodes)
    const importedNodes = prepared.needsLayout
      ? layoutWorkflowNodes(prepared.nodes, pendingImport.workflow.edges, {
          initialLayout: true,
        })
      : prepared.nodes

    setNodes(importedNodes)
    setEdges(pendingImport.workflow.edges)
    setPendingImport(null)
    toast.success(td('import_success'))

    requestAnimationFrame(() => {
      void fitView({ padding: 0.15, duration: 500 })
    })
  }

  return (
    <>
      <Button
        variant='ghost'
        size='sm'
        onClick={handleExport}
        disabled={nodes.length === 0}
      >
        <DownloadIcon className='size-4 mr-2' />
        {t('export')}
      </Button>

      <Button
        variant='ghost'
        size='sm'
        onClick={() => inputRef.current?.click()}
      >
        <UploadIcon className='size-4 mr-2' />
        {t('import')}
      </Button>
      <input
        ref={inputRef}
        type='file'
        accept='application/json,.json'
        className='hidden'
        onChange={handleFileChange}
      />

      <AlertDialog
        open={pendingImport !== null}
        onOpenChange={(open) => !open && setPendingImport(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className='flex items-center gap-2'>
              <div className='rounded-full bg-primary/10 p-2'>
                <FileJsonIcon className='size-5 text-primary' />
              </div>
              <AlertDialogTitle>{td('confirm_title')}</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {td('confirm_description', {
                name: pendingImport?.name || td('unnamed'),
                nodes: pendingImport?.workflow.nodes.length ?? 0,
                edges: pendingImport?.workflow.edges.length ?? 0,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{td('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleImport}>
              {td('confirm_action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
