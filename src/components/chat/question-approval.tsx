'use client'

import {
  CheckIcon,
  ChevronRightIcon,
  Loader2Icon,
  PencilLineIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { AgentQuestion } from '@/types/agent'

interface QuestionApprovalProps {
  questions: AgentQuestion[]
  isPending: boolean
  onSubmit: (response: string) => void
}

export function QuestionApproval({
  questions,
  isPending,
  onSubmit,
}: QuestionApprovalProps) {
  const t = useTranslations('Chat')
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const allAnswered = questions.every((_, index) => answers[index]?.trim())

  const submit = () => {
    onSubmit(
      JSON.stringify(
        questions.map((question, index) => ({
          question: question.question,
          answer: answers[index]?.trim(),
        })),
      ),
    )
  }

  return (
    <div className='w-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm'>
      {questions.map((question, questionIndex) => {
        const answer = answers[questionIndex] ?? ''
        const hasSelectedChoice = question.choices.includes(answer)

        return (
          <section
            className={cn('space-y-3 p-4', questionIndex > 0 && 'border-t')}
            key={`${questionIndex}-${question.question}`}
          >
            <div className='flex items-start justify-between gap-3'>
              <p className='whitespace-pre-wrap font-medium text-foreground text-sm leading-relaxed'>
                {question.question}
              </p>
              {questions.length > 1 && (
                <span className='shrink-0 text-muted-foreground text-xs'>
                  {questionIndex + 1} / {questions.length}
                </span>
              )}
            </div>

            <div className='space-y-1'>
              {question.choices.map((choice, choiceIndex) => {
                const isSelected = answer === choice

                return (
                  <Button
                    aria-pressed={isSelected}
                    className={cn(
                      'group h-auto min-h-12 w-full justify-start gap-3 whitespace-normal rounded-lg border border-transparent px-3 py-2.5 text-left shadow-none',
                      isSelected
                        ? 'border-border bg-muted text-foreground hover:bg-muted'
                        : 'text-foreground hover:border-border hover:bg-muted/60',
                    )}
                    disabled={isPending}
                    key={choice}
                    onClick={() =>
                      setAnswers((current) => ({
                        ...current,
                        [questionIndex]: choice,
                      }))
                    }
                    type='button'
                    variant='ghost'
                  >
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full border bg-background font-normal text-muted-foreground text-xs',
                        isSelected &&
                          'border-primary bg-primary text-primary-foreground',
                      )}
                    >
                      {isSelected ? (
                        <CheckIcon className='size-3.5' />
                      ) : (
                        choiceIndex + 1
                      )}
                    </span>
                    <span className='min-w-0 flex-1 leading-snug'>
                      {choice}
                    </span>
                    <ChevronRightIcon
                      className={cn(
                        'size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100',
                        isSelected && 'opacity-100',
                      )}
                    />
                  </Button>
                )
              })}
            </div>

            <div className='relative'>
              <PencilLineIcon className='absolute top-3.5 left-3.5 z-10 size-4 text-muted-foreground' />
              <Textarea
                aria-label={t('custom_answer_placeholder')}
                className='min-h-12 resize-none rounded-lg bg-background py-3 pr-3 pl-10 shadow-none'
                disabled={isPending}
                value={hasSelectedChoice ? '' : answer}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [questionIndex]: event.target.value,
                  }))
                }
                placeholder={t('custom_answer_placeholder')}
              />
            </div>
          </section>
        )
      })}

      <div className='flex justify-end border-t bg-muted/10 px-4 py-3'>
        <Button
          className='rounded-full px-4'
          disabled={isPending || !allAnswered}
          onClick={submit}
          size='sm'
          type='button'
        >
          {isPending && <Loader2Icon className='size-3.5 animate-spin' />}
          {t('submit_answers')}
        </Button>
      </div>
    </div>
  )
}
