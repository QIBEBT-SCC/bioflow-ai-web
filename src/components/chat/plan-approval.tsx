'use client'

import { CheckCircle2Icon, Loader2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { MessageResponse } from '@/components/ai-elements/message'
import {
  Plan,
  PlanAction,
  PlanContent,
  PlanDescription,
  PlanFooter,
  PlanHeader,
  PlanTitle,
  PlanTrigger,
} from '@/components/ai-elements/plan'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface PlanApprovalProps {
  plan: string
  feedback: string
  isPending: boolean
  onFeedbackChange: (value: string) => void
  onApprove: () => void
  onSendFeedback: () => void
}

export function PlanApproval({
  plan,
  feedback,
  isPending,
  onFeedbackChange,
  onApprove,
  onSendFeedback,
}: PlanApprovalProps) {
  const t = useTranslations('Chat')

  return (
    <Plan
      defaultOpen
      className='gap-0 overflow-hidden border-primary/20 bg-card py-0 shadow-sm'
    >
      <PlanHeader className='grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4'>
        <div className='flex min-w-0 gap-3'>
          <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <CheckCircle2Icon className='size-4' />
          </div>
          <div className='min-w-0 space-y-1'>
            <PlanTitle>{t('plan_title')}</PlanTitle>
            <PlanDescription>{t('plan_approval_prompt')}</PlanDescription>
          </div>
        </div>
        <PlanAction>
          <PlanTrigger aria-label={t('toggle_plan')} />
        </PlanAction>
      </PlanHeader>

      <PlanContent className='border-t bg-muted/20 p-3'>
        <div className='max-h-[min(48vh,28rem)] overflow-y-auto rounded-lg border bg-background p-4'>
          <MessageResponse className='text-sm leading-relaxed'>
            {plan || t('plan_unavailable')}
          </MessageResponse>
        </div>
      </PlanContent>

      <PlanFooter className='flex-col items-stretch gap-3 border-t p-4'>
        <Textarea
          value={feedback}
          onChange={(event) => onFeedbackChange(event.target.value)}
          placeholder={t('feedback_placeholder')}
          className='min-h-20 resize-y bg-background'
        />
        <div className='flex flex-wrap gap-2'>
          <Button size='sm' onClick={onApprove} disabled={isPending}>
            {isPending && <Loader2Icon className='size-3.5 animate-spin' />}
            {t('approve')}
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={onSendFeedback}
            disabled={isPending || !feedback.trim()}
          >
            {t('send_feedback')}
          </Button>
        </div>
      </PlanFooter>
    </Plan>
  )
}
