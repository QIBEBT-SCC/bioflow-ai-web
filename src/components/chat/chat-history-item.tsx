'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  CheckIcon,
  Loader2Icon,
  PencilIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { useState } from 'react'
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
import { useDeleteAgentSession, useUpdateAgentSession } from '@/hooks/use-agent'
import { cn } from '@/lib/utils'
import { ACTIVE_AGENT_STATUSES, type AgentSession } from '@/types/agent'

export function ChatHistoryItem({
  chat,
  isActive,
  onSelectAction,
  onDeleteAction,
}: {
  chat: AgentSession
  isActive: boolean
  onSelectAction: (chat: AgentSession) => void
  onDeleteAction: () => void
}) {
  const t = useTranslations('Chat')
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { mutateAsync: updateChat, isPending: isUpdating } =
    useUpdateAgentSession()
  const { mutateAsync: deleteChat, isPending: isDeleting } =
    useDeleteAgentSession()

  const save = async (event: React.MouseEvent | React.FormEvent) => {
    event.stopPropagation()
    const title = inputValue.trim()
    if (!title || title === chat.title) {
      setIsEditing(false)
      return
    }
    await updateChat({ sessionId: chat.uid, title })
    setIsEditing(false)
  }

  const remove = async () => {
    setDeleteError(null)
    try {
      await deleteChat(chat.uid)
      setDeleteOpen(false)
      if (isActive) onDeleteAction()
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : t('delete_failed'),
      )
    }
  }

  if (isEditing) {
    return (
      <div className='flex items-center gap-1 rounded-md bg-muted/50 p-2'>
        <Input
          autoFocus
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void save(event)
            if (event.key === 'Escape') setIsEditing(false)
          }}
          className='h-7 bg-background px-2 text-sm'
        />
        <Button size='icon' variant='ghost' className='size-7' onClick={save}>
          {isUpdating ? (
            <Loader2Icon className='size-3 animate-spin' />
          ) : (
            <CheckIcon className='size-3' />
          )}
        </Button>
        <Button
          size='icon'
          variant='ghost'
          className='size-7'
          onClick={(event) => {
            event.stopPropagation()
            setIsEditing(false)
          }}
        >
          <XIcon className='size-3' />
        </Button>
      </div>
    )
  }

  const active =
    chat.latest_run && ACTIVE_AGENT_STATUSES.includes(chat.latest_run.status)

  const title = chat.title || t('new_conversation')

  return (
    <>
      <div
        className={cn(
          'group grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-1 overflow-hidden rounded-md p-2 text-left transition-colors hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring',
          isActive && 'bg-muted',
        )}
      >
        <button
          type='button'
          className='flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left outline-none'
          onClick={() => onSelectAction(chat)}
        >
          {active && (
            <span className='size-2 shrink-0 rounded-full bg-blue-500' />
          )}
          <div className='flex min-w-0 flex-1 flex-col gap-1'>
            <span
              className='line-clamp-2 wrap-break-word font-medium text-sm leading-tight'
              title={title}
            >
              {title}
            </span>
            <span
              className='text-[10px] text-muted-foreground'
              suppressHydrationWarning
            >
              {formatDistanceToNow(new Date(chat.update_time), {
                addSuffix: true,
              })}
            </span>
          </div>
        </button>
        <div className='flex shrink-0 items-center'>
          <Button
            variant='ghost'
            size='icon'
            className='size-6 text-muted-foreground hover:text-foreground'
            aria-label={t('rename')}
            title={t('rename')}
            onClick={(event) => {
              event.stopPropagation()
              setInputValue(chat.title)
              setIsEditing(true)
            }}
          >
            <PencilIcon className='size-3.5' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='size-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
            aria-label={active ? t('delete_active') : t('delete')}
            title={active ? t('delete_active') : t('delete')}
            disabled={isDeleting || Boolean(active)}
            onClick={(event) => {
              event.stopPropagation()
              setDeleteError(null)
              setDeleteOpen(true)
            }}
          >
            {isDeleting ? (
              <Loader2Icon className='size-3.5 animate-spin' />
            ) : (
              <TrashIcon className='size-3.5' />
            )}
          </Button>
        </div>
      </div>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          if (isDeleting) return
          setDeleteOpen(nextOpen)
          if (!nextOpen) setDeleteError(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_confirm_description', { title })}
            </AlertDialogDescription>
            {deleteError && (
              <p className='text-destructive text-sm'>{deleteError}</p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-white hover:bg-destructive/90'
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault()
                void remove()
              }}
            >
              {isDeleting ? (
                <Loader2Icon className='size-4 animate-spin' />
              ) : (
                <TrashIcon className='size-4' />
              )}
              {t('delete_confirm_action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
