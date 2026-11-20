'use client'

import { Loader2, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useResetProjectWorkflowRuns } from '@/hooks/use-project-workflow'
import { ClientApiError } from '@/lib/api-client'

interface ResetWorkflowRunsDialogProps {
  projectId: string
  workflowUid: string
  workflowName: string
}

export function ResetWorkflowRunsDialog({
  projectId,
  workflowUid,
  workflowName,
}: ResetWorkflowRunsDialogProps) {
  const t = useTranslations('Project.workflow')
  const [open, setOpen] = useState(false)
  const reset = useResetProjectWorkflowRuns()

  const confirmReset = async () => {
    try {
      await reset.mutateAsync({ projectId, workflowUid })
      setOpen(false)
      toast.success(t('resetSuccess'))
    } catch (error) {
      toast.error(
        t(
          error instanceof ClientApiError && error.status === 409
            ? 'resetBusy'
            : 'resetFailed',
        ),
      )
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(open) => !reset.isPending && setOpen(open)}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button
              aria-label={t('resetRuns')}
              variant='outline'
              size='icon'
              className='text-muted-foreground hover:border-destructive/30 hover:text-destructive'
            >
              <RotateCcw className='size-4' />
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{t('resetRuns')}</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('resetDialogTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('resetDialogDescription', { workflowName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={reset.isPending}>
            {t('cancel')}
          </AlertDialogCancel>
          <Button
            variant='destructive'
            onClick={confirmReset}
            disabled={reset.isPending}
          >
            {reset.isPending && <Loader2 className='size-4 animate-spin' />}
            {t(reset.isPending ? 'resetting' : 'confirmReset')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
