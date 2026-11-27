'use client'

import {
  Loader2Icon,
  MessageCircleQuestionIcon,
  MessageCircleWarningIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ApprovalFeedback } from '@/components/chat/plan-approval'
import { Markdown } from '@/components/markdown'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import {
  Item,
  ItemContent,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import type { AgentInterrupt } from '@/types/agent'

function isQuestionInterrupt(payload: AgentInterrupt | null) {
  return (
    typeof payload?.question === 'string' && payload.question.trim().length > 0
  )
}

function interruptText(payload: AgentInterrupt | null) {
  if (typeof payload?.question === 'string') return payload.question
  if (typeof payload?.message === 'string') return payload.message
  return JSON.stringify(payload, null, 2)
}

/** Fallback for an interrupt that is neither a plan review nor questions. */
export function InterruptApproval({
  payload,
  ...feedbackProps
}: {
  payload: AgentInterrupt | null
} & React.ComponentProps<typeof ApprovalFeedback>) {
  const t = useTranslations('Chat')
  const isQuestion = isQuestionInterrupt(payload)

  return (
    <Item variant='outline' size='sm' className='rounded-xl bg-card shadow-xs'>
      <ItemMedia
        variant='icon'
        className={isQuestion ? 'text-primary' : 'text-warning'}
      >
        {isQuestion ? (
          <MessageCircleQuestionIcon />
        ) : (
          <MessageCircleWarningIcon />
        )}
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          {isQuestion ? t('question_title') : t('interrupt_title')}
        </ItemTitle>
        <Markdown className='text-muted-foreground leading-relaxed'>
          {interruptText(payload)}
        </Markdown>
      </ItemContent>
      <ItemFooter className='flex-col items-stretch'>
        {isQuestion ? (
          <InputGroup className='rounded-lg bg-background'>
            <InputGroupTextarea
              value={feedbackProps.feedback}
              onChange={(event) =>
                feedbackProps.onFeedbackChange(event.target.value)
              }
              placeholder={t('reply_placeholder')}
              aria-label={t('reply_placeholder')}
              className='max-h-40 min-h-14 p-3'
            />
            <InputGroupAddon align='block-end' className='justify-end'>
              <InputGroupButton
                size='sm'
                variant='default'
                onClick={feedbackProps.onSendFeedback}
                disabled={
                  feedbackProps.isPending || !feedbackProps.feedback.trim()
                }
              >
                {feedbackProps.isPending && (
                  <Loader2Icon className='animate-spin' />
                )}
                {t('send_reply')}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        ) : (
          <ApprovalFeedback {...feedbackProps} />
        )}
      </ItemFooter>
    </Item>
  )
}
