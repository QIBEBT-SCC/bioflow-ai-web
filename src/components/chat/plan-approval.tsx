'use client'

import { ChevronDownIcon, ClipboardCheckIcon, Loader2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Markdown } from '@/components/markdown'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'

interface ApprovalFeedbackProps {
  feedback: string
  isPending: boolean
  onFeedbackChange: (value: string) => void
  onApprove: () => void
  onSendFeedback: () => void
}

/** Approve, or write feedback that sends the agent back to revise. */
export function ApprovalFeedback({
  feedback,
  isPending,
  onFeedbackChange,
  onApprove,
  onSendFeedback,
}: ApprovalFeedbackProps) {
  const t = useTranslations('Chat')

  return (
    <InputGroup className='rounded-lg bg-background'>
      <InputGroupTextarea
        value={feedback}
        onChange={(event) => onFeedbackChange(event.target.value)}
        placeholder={t('feedback_placeholder')}
        aria-label={t('feedback_placeholder')}
        className='max-h-40 min-h-14 p-3'
      />
      <InputGroupAddon align='block-end' className='justify-end'>
        <InputGroupButton
          size='sm'
          variant='outline'
          onClick={onSendFeedback}
          disabled={isPending || !feedback.trim()}
        >
          {t('send_feedback')}
        </InputGroupButton>
        <InputGroupButton
          size='sm'
          variant='default'
          onClick={onApprove}
          disabled={isPending}
        >
          {isPending && <Loader2Icon className='animate-spin' />}
          {t('approve')}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

interface PlanApprovalProps extends ApprovalFeedbackProps {
  plan: string
}

export function PlanApproval({ plan, ...feedbackProps }: PlanApprovalProps) {
  const t = useTranslations('Chat')

  return (
    <Collapsible defaultOpen asChild>
      <Item
        variant='outline'
        size='sm'
        className='rounded-xl bg-card shadow-xs'
      >
        <ItemMedia variant='icon'>
          <ClipboardCheckIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{t('plan_title')}</ItemTitle>
          <ItemDescription className='line-clamp-none'>
            {t('plan_approval_prompt')}
          </ItemDescription>
        </ItemContent>
        <ItemActions className='self-start'>
          <CollapsibleTrigger asChild>
            <Button
              variant='ghost'
              size='icon-sm'
              className='group/plan-toggle'
              aria-label={t('toggle_plan')}
            >
              <ChevronDownIcon className='transition-transform group-data-[state=open]/plan-toggle:rotate-180' />
            </Button>
          </CollapsibleTrigger>
        </ItemActions>
        <CollapsibleContent className='basis-full'>
          <div className='max-h-[min(48vh,28rem)] overflow-y-auto rounded-lg border bg-background p-4'>
            <Markdown className='leading-relaxed'>
              {plan || t('plan_unavailable')}
            </Markdown>
          </div>
        </CollapsibleContent>
        <ItemFooter className='flex-col items-stretch'>
          <ApprovalFeedback {...feedbackProps} />
        </ItemFooter>
      </Item>
    </Collapsible>
  )
}
