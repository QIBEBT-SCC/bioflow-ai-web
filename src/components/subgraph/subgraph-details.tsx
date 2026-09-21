'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useWorkflow } from '@/hooks/use-workflow'
import { WorkflowType } from '@/types/workflow'
import { SubgraphPreview } from './subgraph-preview'

export function SubgraphDetails({
  uid,
  onClose,
}: {
  uid: string
  onClose: () => void
}) {
  const t = useTranslations('editor.subgraph.management')
  const { data, isPending, error } = useWorkflow(uid)
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-6xl'>
        <DialogHeader>
          <DialogTitle>{data?.name ?? t('view')}</DialogTitle>
          <DialogDescription className='whitespace-pre-wrap'>
            {data?.description ?? t('loading')}
          </DialogDescription>
        </DialogHeader>
        {isPending && <p>{t('loading')}</p>}
        {error && <p role='alert'>{error.message}</p>}
        {data?.wf_type === WorkflowType.SUBMODULE && (
          <>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-sm text-muted-foreground'>
                {data.public ? t('public') : t('private')}
              </span>
              <Button asChild>
                <Link href={`/editor?workflowUid=${encodeURIComponent(uid)}`}>
                  {t('edit')}
                </Link>
              </Button>
            </div>
            {!data.workflow.interface && (
              <p className='text-sm text-muted-foreground'>{t('legacy')}</p>
            )}
            <SubgraphPreview workflow={data.workflow} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
