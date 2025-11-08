'use client'

import { History, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import type React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useChatHistories, useDeleteChatSession } from '@/hooks/use-chat'
import { useChatStore } from '@/stores/chatStore'
import type { ChatSessionPublic } from '@/types/chat'
import {AlertDialog, AlertDialogContent} from "@/components/ui/alert-dialog";

interface HistoryMenuProps {
  onEditClick: (id: string, description: string) => void
}

export function HistoryMenu({ onEditClick }: HistoryMenuProps) {
  const { data: histories = [] } = useChatHistories()
  const { mutate: deleteSession } = useDeleteChatSession()
  const { currentSession, setCurrentSession, clearMessages } = useChatStore()

  const handleSelectHistory = (history: ChatSessionPublic) => {
    setCurrentSession(history)
    clearMessages()
  }

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('确定要删除这个对话吗？')) {
      deleteSession(id)
      if (currentSession?.uid === id) {
        setCurrentSession(null)
        clearMessages()
      }
    }
  }

  const handleNewChat = () => {
    setCurrentSession(null)
    clearMessages()
  }

  return (
      <AlertDialog>
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='icon'>
                      <History className='h-5 w-5' />
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-80'>
                  <div className='flex items-center justify-between p-2'>
                      <span className='text-sm font-medium'>对话历史</span>
                      <Button variant='ghost' size='sm' onClick={handleNewChat}>
                          <Plus className='h-4 w-4 mr-1' />
                          新对话
                      </Button>
                  </div>
                  <DropdownMenuSeparator />
                  <div className='max-h-[400px] overflow-y-auto'>
                      {histories.length === 0 ? (
                          <div className='p-4 text-center text-sm text-muted-foreground'>
                              暂无历史对话
                          </div>
                      ) : (
                          histories.map((history) => (
                              <DropdownMenuItem
                                  key={history.uid}
                                  className={`flex items-center justify-between p-3 cursor-pointer ${
                                      currentSession?.uid === history.uid ? 'bg-accent' : ''
                                  }`}
                                  onClick={() => handleSelectHistory(history)}
                              >
                                  <div className='flex-1 min-w-0'>
                                      <p className='text-sm font-medium truncate'>
                                          {history.description || '未命名对话'}
                                      </p>
                                      <p className='text-xs text-muted-foreground'>
                                          {new Date(history.created_at).toLocaleString()}
                                      </p>
                                  </div>
                                  <DropdownMenu>
                                      <DropdownMenuTrigger
                                          asChild
                                          onClick={(e) => e.stopPropagation()}
                                      >
                                          <Button
                                              variant='ghost'
                                              size='icon'
                                              className='h-8 w-8 shrink-0'
                                          >
                                              <MoreHorizontal className='h-4 w-4' />
                                          </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align='end'>
                                          <DropdownMenuItem
                                              onClick={(e) => {
                                                  e.stopPropagation()
                                                  onEditClick(history.uid, history.description)
                                              }}
                                          >
                                              编辑描述
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                              className='text-destructive'
                                              onClick={(e) => handleDeleteSession(history.uid, e)}
                                          >
                                              <Trash2 className='h-4 w-4 mr-2' />
                                              删除
                                          </DropdownMenuItem>
                                      </DropdownMenuContent>
                                  </DropdownMenu>
                              </DropdownMenuItem>
                          ))
                      )}
                  </div>
              </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>

          </AlertDialogContent>
      </AlertDialog>
  )
}
