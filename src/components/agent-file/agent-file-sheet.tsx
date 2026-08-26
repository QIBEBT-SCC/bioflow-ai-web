'use client'

import {
  DownloadIcon,
  Edit3Icon,
  FileTextIcon,
  Loader2Icon,
  SaveIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getAgentFileDownload } from '@/app/actions/agent-file'
import { MessageResponse } from '@/components/ai-elements/message'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useAgentFileContent, useUpdateAgentFile } from '@/hooks/use-agent-file'
import { ClientApiError } from '@/lib/api-client'
import type { AgentFile } from '@/types/agent-file'

type ViewMode = 'preview' | 'source'

interface AgentFileSheetProps {
  file: AgentFile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgentFileSheet({
  file,
  open,
  onOpenChange,
}: AgentFileSheetProps) {
  const t = useTranslations('Project.agentFiles')
  const [currentFile, setCurrentFile] = useState(file)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const {
    data: content,
    isLoading,
    error,
    refetch,
  } = useAgentFileContent(currentFile, open)
  const updateMutation = useUpdateAgentFile()
  const dirty = editing && content !== undefined && draft !== content

  useEffect(() => {
    setCurrentFile(file)
  }, [file])

  useEffect(() => {
    if (content !== undefined && !dirty) setDraft(content)
  }, [content, dirty])

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const requestOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && dirty && !window.confirm(t('unsavedConfirm'))) return
    if (!nextOpen) setEditing(false)
    onOpenChange(nextOpen)
  }

  const download = async () => {
    try {
      const blob = await getAgentFileDownload(
        currentFile.project_id,
        currentFile.id,
      )
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = currentFile.name
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (downloadError) {
      toast.error(
        downloadError instanceof Error
          ? downloadError.message
          : t('downloadFailed'),
      )
    }
  }

  const save = async () => {
    try {
      const updated = await updateMutation.mutateAsync({
        file: currentFile,
        content: draft,
      })
      setCurrentFile(updated)
      setEditing(false)
      setViewMode('preview')
      toast.success(t('saveSuccess'))
    } catch (saveError) {
      if (saveError instanceof ClientApiError && saveError.status === 409) {
        toast.error(t('conflict'))
        return
      }
      toast.error(
        saveError instanceof Error ? saveError.message : t('saveFailed'),
      )
    }
  }

  const reason = currentFile.read_only_reason
    ? t(`readOnlyReasons.${currentFile.read_only_reason}`)
    : null

  return (
    <Sheet open={open} onOpenChange={requestOpenChange}>
      <SheetContent className='w-full gap-0 sm:max-w-3xl'>
        <SheetHeader className='border-b pr-12'>
          <div className='flex items-center gap-2'>
            <FileTextIcon className='size-5 text-muted-foreground' />
            <SheetTitle>{currentFile.name}</SheetTitle>
            <Badge variant='outline'>{t(`kinds.${currentFile.kind}`)}</Badge>
          </div>
          <SheetDescription>
            {t('updatedAt', {
              date: new Date(currentFile.updated_at).toLocaleString(),
            })}
          </SheetDescription>
        </SheetHeader>

        <div className='flex items-center justify-between gap-2 border-b px-4 py-2'>
          <div className='flex gap-1'>
            <Button
              type='button'
              size='sm'
              variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
              onClick={() => setViewMode('preview')}
            >
              {t('preview')}
            </Button>
            <Button
              type='button'
              size='sm'
              variant={viewMode === 'source' ? 'secondary' : 'ghost'}
              onClick={() => setViewMode('source')}
            >
              {t('source')}
            </Button>
          </div>
          <div className='flex gap-1'>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={download}
            >
              <DownloadIcon className='size-4' />
              {t('download')}
            </Button>
            {currentFile.editable && !editing && (
              <Button
                type='button'
                size='sm'
                onClick={() => {
                  setEditing(true)
                  setViewMode('source')
                }}
              >
                <Edit3Icon className='size-4' />
                {t('edit')}
              </Button>
            )}
          </div>
        </div>

        {reason && (
          <Alert className='m-4 mb-0 w-auto'>
            <AlertDescription>{reason}</AlertDescription>
          </Alert>
        )}
        {editing && (
          <Alert className='m-4 mb-0 w-auto'>
            <AlertDescription>{t('planImpact')}</AlertDescription>
          </Alert>
        )}

        <div className='min-h-0 flex-1 p-4'>
          {isLoading ? (
            <div className='flex h-full items-center justify-center text-muted-foreground'>
              <Loader2Icon className='mr-2 size-4 animate-spin' />
              {t('loading')}
            </div>
          ) : error ? (
            <div className='flex h-full flex-col items-center justify-center gap-3 text-center'>
              <p className='text-sm text-destructive'>{error.message}</p>
              <Button type='button' variant='outline' onClick={() => refetch()}>
                {t('retry')}
              </Button>
            </div>
          ) : editing ? (
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className='h-full min-h-80 resize-none font-mono'
              aria-label={t('editorLabel')}
            />
          ) : viewMode === 'source' ? (
            <ScrollArea className='h-full'>
              <pre className='whitespace-pre-wrap break-words font-mono text-sm'>
                {content}
              </pre>
            </ScrollArea>
          ) : (
            <ScrollArea className='h-full'>
              <MessageResponse className='max-w-none'>
                {content}
              </MessageResponse>
            </ScrollArea>
          )}
        </div>

        {editing && (
          <SheetFooter className='flex-row justify-end border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setDraft(content ?? '')
                setEditing(false)
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              type='button'
              disabled={!dirty || updateMutation.isPending || !draft.trim()}
              onClick={save}
            >
              {updateMutation.isPending ? (
                <Loader2Icon className='size-4 animate-spin' />
              ) : (
                <SaveIcon className='size-4' />
              )}
              {t('save')}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
