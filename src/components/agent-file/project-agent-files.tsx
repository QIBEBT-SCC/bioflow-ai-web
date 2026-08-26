'use client'

import { FileTextIcon, Loader2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AgentFileCard } from '@/components/agent-file/agent-file-card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useProjectAgentFiles } from '@/hooks/use-agent-file'

export function ProjectAgentFiles({ projectId }: { projectId: string }) {
  const t = useTranslations('Project.agentFiles')
  const { data: files = [], isLoading, error } = useProjectAgentFiles(projectId)
  const documents = files.filter((file) =>
    ['plan', 'samples'].includes(file.kind),
  )
  const records = files.filter((file) =>
    ['diagnosis', 'update'].includes(file.kind),
  )

  if (isLoading) {
    return (
      <div className='flex min-h-48 items-center justify-center text-muted-foreground'>
        <Loader2Icon className='mr-2 size-4 animate-spin' />
        {t('loading')}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }

  if (files.length === 0) {
    return (
      <div className='flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed text-center'>
        <FileTextIcon className='mb-3 size-10 text-muted-foreground' />
        <p className='font-medium'>{t('emptyTitle')}</p>
        <p className='mt-1 max-w-md text-muted-foreground text-sm'>
          {t('emptyDescription')}
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      <section className='space-y-3'>
        <div>
          <h3 className='font-semibold'>{t('documentsTitle')}</h3>
          <p className='text-muted-foreground text-sm'>
            {t('documentsDescription')}
          </p>
        </div>
        {documents.length > 0 ? (
          <div className='flex flex-col items-start gap-3'>
            {documents.map((file) => (
              <AgentFileCard
                key={file.id}
                file={file}
                className='w-full max-w-3xl'
              />
            ))}
          </div>
        ) : (
          <p className='rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm'>
            {t('noDocuments')}
          </p>
        )}
      </section>

      <section className='space-y-3'>
        <div>
          <h3 className='font-semibold'>{t('recordsTitle')}</h3>
          <p className='text-muted-foreground text-sm'>
            {t('recordsDescription')}
          </p>
        </div>
        {records.length > 0 ? (
          <div className='flex flex-col items-start gap-3'>
            {records.map((file) => (
              <AgentFileCard
                key={file.id}
                file={file}
                className='w-full max-w-3xl'
              />
            ))}
          </div>
        ) : (
          <p className='rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm'>
            {t('noRecords')}
          </p>
        )}
      </section>
    </div>
  )
}
