'use client'

import { FileTextIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Terminal, TerminalContent } from '@/components/ai-elements/terminal'
import { Skeleton } from '@/components/ui/skeleton'
import { useTaskLog } from '@/hooks/use-task'

interface TaskLogProps {
  taskUid: string
}

export function TaskLog({ taskUid }: TaskLogProps) {
  const t = useTranslations('task.log')
  const { data: logData, isLoading, error } = useTaskLog(taskUid)

  if (isLoading) {
    return (
      <div className='space-y-3'>
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-3/4' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-5/6' />
      </div>
    )
  }

  if (error) {
    return (
      <div className='text-center text-muted-foreground py-12'>
        <FileTextIcon className='size-12 mx-auto mb-3 opacity-50' />
        <p>{t('unavailable')}</p>
      </div>
    )
  }

  if (!logData?.content) {
    return (
      <div className='text-center text-muted-foreground py-12'>
        <FileTextIcon className='size-12 mx-auto mb-3 opacity-50' />
        <p>{t('empty')}</p>
      </div>
    )
  }

  return (
    <>
      <div className='flex justify-between items-center mb-3'>
        <span className='text-sm text-muted-foreground'>
          {t('lineCount', { count: logData.content.split('\n').length })}
        </span>
      </div>
      <Terminal output={logData.content} autoScroll={false}>
        <TerminalContent />
      </Terminal>
    </>
  )
}
