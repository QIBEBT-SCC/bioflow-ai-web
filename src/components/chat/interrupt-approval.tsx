'use client'

import { MessageCircleWarningIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ApprovalFeedback } from '@/components/chat/plan-approval'
import { Markdown } from '@/components/markdown'
import {
  Item,
  ItemContent,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import type { AgentInterrupt } from '@/types/agent'

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

  return (
    <Item variant='outline' size='sm' className='rounded-xl bg-card shadow-xs'>
      <ItemMedia variant='icon' className='text-warning'>
        <MessageCircleWarningIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{t('interrupt_title')}</ItemTitle>
        <Markdown className='text-muted-foreground leading-relaxed'>
          {interruptText(payload)}
        </Markdown>
      </ItemContent>
      <ItemFooter className='flex-col items-stretch'>
        <ApprovalFeedback {...feedbackProps} />
      </ItemFooter>
    </Item>
  )
}
