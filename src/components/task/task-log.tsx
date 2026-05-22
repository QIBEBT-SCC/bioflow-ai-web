'use client'

import { FileTextIcon } from 'lucide-react'
import { Terminal, TerminalContent } from '@/components/ai-elements/terminal'
import { Skeleton } from '@/components/ui/skeleton'
import { useTaskLog } from '@/hooks/use-task'

interface TaskLogProps {
  taskUid: string
}

export function TaskLog({ taskUid }: TaskLogProps) {
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
        <p>日志文件不存在或无法读取</p>
      </div>
    )
  }

  if (!logData?.content) {
    return (
      <div className='text-center text-muted-foreground py-12'>
        <FileTextIcon className='size-12 mx-auto mb-3 opacity-50' />
        <p>暂无日志内容</p>
      </div>
    )
  }

  return (
    <>
      <div className='flex justify-between items-center mb-3'>
        <span className='text-sm text-muted-foreground'>
          共 {logData.content.split('\n').length} 行
        </span>
      </div>
      <Terminal output={logData.content} autoScroll={false}>
        <TerminalContent />
      </Terminal>
    </>
  )
}
