'use client'

import { formatDistanceToNow } from 'date-fns'
import {
  CheckIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useDeleteChatSession, useUpdateChatSession } from '@/hooks/use-chat'
import { cn } from '@/lib/utils'
import type { ChatSessionPublic } from '@/types/chat'

interface ChatHistoryItemProps {
  chat: ChatSessionPublic
  isActive: boolean
  onSelect: (chat: ChatSessionPublic) => void
}

export function ChatHistoryItem({
  chat,
  isActive,
  onSelect,
}: ChatHistoryItemProps) {
  const { push } = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
    }
  }, [isEditing])

  const { mutateAsync: updateChat, isPending: isUpdating } =
    useUpdateChatSession()
  const { mutateAsync: deleteChat, isPending: isDeleting } =
    useDeleteChatSession()

  const handleSave = async (e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation()
    if (!inputValue.trim() || inputValue === chat.description) {
      setIsEditing(false)
      return
    }

    try {
      await updateChat({
        sessionId: chat.uid,
        description: inputValue,
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update chat session', error)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteChat(chat.uid)
      // 如果删除的是当前正在查看的对话，重定向到 /chat
      if (isActive) {
        push('/chat')
      }
    } catch (error) {
      console.error('Failed to delete chat session', error)
    }
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setInputValue(chat.description)
    setIsEditing(false)
  }

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave(e)
    } else if (e.key === 'Escape') {
      e.stopPropagation() // Prevent dialog closing if applicable
      setInputValue(chat.description)
      setIsEditing(false)
    }
  }

  const handleItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(chat)
    }
  }

  if (isEditing) {
    return (
      <div className='flex items-center gap-1 p-2 rounded-md bg-muted/50'>
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onClick={handleInputClick}
          onKeyDown={handleInputKeyDown}
          className='h-7 text-sm px-2 bg-background'
        />
        <Button
          size='icon'
          variant='ghost'
          className='size-7 shrink-0 hover:bg-green-500/10 hover:text-green-500'
          onClick={handleSave}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2Icon className='size-3 animate-spin' />
          ) : (
            <CheckIcon className='size-3' />
          )}
        </Button>
        <Button
          size='icon'
          variant='ghost'
          className='size-7 shrink-0 hover:bg-red-500/10 hover:text-red-500'
          onClick={handleCancel}
          disabled={isUpdating}
        >
          <XIcon className='size-3' />
        </Button>
      </div>
    )
  }

  return (
    // biome-ignore lint: avoiding nested buttons
    <div
      role='button'
      tabIndex={0}
      className={cn(
        'group flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer text-left w-full border-none bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isActive && 'bg-muted',
      )}
      onClick={() => onSelect(chat)}
      onKeyDown={handleItemKeyDown}
    >
      <div className='flex flex-col gap-1 overflow-hidden pointer-events-none'>
        <span className='font-medium text-sm truncate'>
          {chat.description || 'New Conversation'}
        </span>
        <span
          className='text-[10px] text-muted-foreground'
          suppressHydrationWarning
        >
          {formatDistanceToNow(new Date(chat.create_time), {
            addSuffix: true,
          })}
        </span>
      </div>

      <div className='opacity-0 group-hover:opacity-100 transition-opacity flex items-center'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant='ghost' size='icon' className='size-6'>
              <MoreHorizontalIcon className='size-3' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setInputValue(chat.description)
                setIsEditing(true)
              }}
            >
              <PencilIcon className='mr-2 size-4' />
              <span>Rename</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className='text-destructive focus:text-destructive'
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2Icon className='mr-2 size-4 animate-spin' />
              ) : (
                <TrashIcon className='mr-2 size-4' />
              )}
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
