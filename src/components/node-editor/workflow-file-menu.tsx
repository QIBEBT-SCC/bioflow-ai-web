'use client'

import { useReactFlow } from '@xyflow/react'
import {
  ChevronDownIcon,
  CopyIcon,
  DownloadIcon,
  FileJsonIcon,
  FileTextIcon,
  FolderOpenIcon,
  InfoIcon,
  UploadIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type ChangeEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import { LoadWorkflowDialog } from '@/components/node-editor/load-workflow-dialog'
import { SaveAsDialog } from '@/components/node-editor/save-as-dialog'
import { WorkflowMetadataDialog } from '@/components/node-editor/workflow-metadata-dialog'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

type FileDialog = 'load' | 'save_as' | 'metadata' | null

interface WorkflowFileMenuProps {
  workflowName?: string
  /** Offer opening another workflow from the library (standalone editor only). */
  allowLoad?: boolean
}

function getExportFilename(name?: string): string {
  const safeName = name
    ?.trim()
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  return `${safeName || 'workflow'}.json`
}

/** Toolbar "File" menu: library, save-as, JSON import/export and metadata. */
export function WorkflowFileMenu({
  workflowName,
  allowLoad,
}: WorkflowFileMenuProps) {
  const t = useTranslations('editor')
  const td = useTranslations('editor.workflow_json')
  const inputRef = useRef<HTMLInputElement>(null)
  const [dialog, setDialog] = useState<FileDialog>(null)
  const [pendingImport, setPendingImport] = useState<ParsedWorkflowJson | null>(
    null,
  )
  const { nodes, currentWorkflowUid, loadGraph, getRootGraph } =
    useNodeEditorStore()
  const { fitView } = useReactFlow()

  const dialogProps = (name: Exclude<FileDialog, null>) => ({
    open: dialog === name,
    onOpenChange: (open: boolean) => setDialog(open ? name : null),
  })

  const handleExport = () => {
    const content = serializeWorkflowJson(getRootGraph(), workflowName)
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

    loadGraph({ ...pendingImport.workflow, nodes: importedNodes })
    setPendingImport(null)
    toast.success(td('import_success'))

    requestAnimationFrame(() => {
      void fitView({ padding: 0.15, duration: 500 })
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='sm'>
            <FileTextIcon className='size-4' />
            {t('file_menu')}
            <ChevronDownIcon className='size-3.5 text-muted-foreground' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start' className='w-52'>
          {allowLoad && (
            <DropdownMenuItem onSelect={() => setDialog('load')}>
              <FolderOpenIcon />
              {t('open_workflow')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            disabled={nodes.length === 0}
            onSelect={() => setDialog('save_as')}
          >
            <CopyIcon />
            {t('save_as')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => inputRef.current?.click()}>
            <UploadIcon />
            {t('import')}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={nodes.length === 0}
            onSelect={handleExport}
          >
            <DownloadIcon />
            {t('export')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!currentWorkflowUid}
            onSelect={() => setDialog('metadata')}
          >
            <InfoIcon />
            {t('subgraph.metadata')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={inputRef}
        type='file'
        aria-label={t('import')}
        accept='application/json,.json'
        className='hidden'
        onChange={handleFileChange}
      />

      {allowLoad && <LoadWorkflowDialog {...dialogProps('load')} />}
      <SaveAsDialog
        currentWorkflowName={workflowName}
        {...dialogProps('save_as')}
      />
      <WorkflowMetadataDialog {...dialogProps('metadata')} />

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
