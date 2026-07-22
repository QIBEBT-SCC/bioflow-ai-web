'use client'

import {
  FileInputIcon,
  FileOutputIcon,
  RefreshCwIcon,
  TerminalIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTool } from '@/hooks/use-tool'
import type { FileMount } from '@/types/tool'

function FileMountItem({ file }: { file: FileMount }) {
  const t = useTranslations('editor.tool_node.details')

  return (
    <div className='space-y-3 rounded-lg border border-border p-3'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h4 className='truncate font-medium text-sm'>{file.name}</h4>
          {file.description && (
            <p className='mt-1 text-muted-foreground text-xs leading-relaxed'>
              {file.description}
            </p>
          )}
        </div>
        <div className='flex shrink-0 gap-1'>
          {file.is_log && (
            <Badge variant='secondary' className='text-[10px]'>
              LOG
            </Badge>
          )}
          {file.is_report && (
            <Badge variant='secondary' className='text-[10px]'>
              REPORT
            </Badge>
          )}
        </div>
      </div>

      <dl className='grid gap-2 text-xs sm:grid-cols-2'>
        <div className='min-w-0 space-y-1'>
          <dt className='text-muted-foreground'>{t('filePath')}</dt>
          <dd>
            <code className='block break-all rounded bg-muted px-2 py-1.5'>
              {file.file_path}
            </code>
          </dd>
        </div>
        <div className='min-w-0 space-y-1'>
          <dt className='text-muted-foreground'>{t('mountPath')}</dt>
          <dd>
            <code className='block break-all rounded bg-muted px-2 py-1.5'>
              {file.mount_path}
            </code>
          </dd>
        </div>
      </dl>
    </div>
  )
}

function FileMountList({
  files,
  emptyMessage,
}: {
  files: FileMount[]
  emptyMessage: string
}) {
  if (files.length === 0) {
    return (
      <div className='rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm'>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className='space-y-3'>
      {files.map((file) => (
        <FileMountItem key={`${file.name}-${file.mount_path}`} file={file} />
      ))}
    </div>
  )
}

function ToolDetailsSkeleton() {
  return (
    <div className='space-y-6 px-4 pb-6'>
      <div className='space-y-3'>
        <Skeleton className='h-5 w-28' />
        <Skeleton className='h-28 w-full' />
      </div>
      <div className='space-y-3'>
        <Skeleton className='h-5 w-24' />
        <Skeleton className='h-9 w-full' />
        <Skeleton className='h-36 w-full' />
      </div>
    </div>
  )
}

export function ToolNodeDetails({ toolUid }: { toolUid: string }) {
  const t = useTranslations('editor.tool_node.details')
  const { data: tool, isLoading, isError, refetch } = useTool(toolUid)

  if (isLoading) return <ToolDetailsSkeleton />

  if (isError || !tool) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center'>
        <p className='text-muted-foreground text-sm'>{t('loadError')}</p>
        <Button variant='outline' size='sm' onClick={() => refetch()}>
          <RefreshCwIcon className='size-3.5' />
          {t('retry')}
        </Button>
      </div>
    )
  }

  const command = tool.complete_command || t('noCommand')
  const inputFiles = tool.file_mounts.filter(
    (file) => file.file_type === 'INPUT',
  )
  const outputFiles = tool.file_mounts.filter(
    (file) => file.file_type === 'OUTPUT',
  )

  return (
    <div className='min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-6'>
      <section className='space-y-3'>
        <div>
          <h3 className='flex items-center gap-2 font-semibold text-sm'>
            <TerminalIcon className='size-4 text-primary' />
            {t('completeCommand')}
          </h3>
          <p className='mt-1 text-muted-foreground text-xs'>
            {t('completeCommandDescription')}
          </p>
        </div>
        <div className='relative rounded-lg border bg-muted/60'>
          <pre className='max-h-72 overflow-auto whitespace-pre-wrap break-words p-4 pr-12 font-mono text-xs leading-relaxed'>
            <code>{command}</code>
          </pre>
          {tool.complete_command && (
            <CopyButton
              code={tool.complete_command}
              className='absolute top-2 right-2 bg-background/80'
            />
          )}
        </div>
      </section>

      <section className='space-y-3'>
        <h3 className='font-semibold text-sm'>{t('fileMounts')}</h3>
        <Tabs defaultValue='input'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='input' className='gap-1.5'>
              <FileInputIcon className='size-3.5' />
              {t('inputFiles', { count: inputFiles.length })}
            </TabsTrigger>
            <TabsTrigger value='output' className='gap-1.5'>
              <FileOutputIcon className='size-3.5' />
              {t('outputFiles', { count: outputFiles.length })}
            </TabsTrigger>
          </TabsList>
          <TabsContent value='input' className='mt-3'>
            <FileMountList
              files={inputFiles}
              emptyMessage={t('noInputFiles')}
            />
          </TabsContent>
          <TabsContent value='output' className='mt-3'>
            <FileMountList
              files={outputFiles}
              emptyMessage={t('noOutputFiles')}
            />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
