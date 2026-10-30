'use client'

import { Loader2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type FormEvent, useId, useMemo } from 'react'
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '@/components/ui/questionnaire'
import type { AgentQuestion } from '@/types/agent'

interface QuestionApprovalProps {
  questions: AgentQuestion[]
  isPending: boolean
  onSubmit: (response: string) => void
}

/** The agent's clarifying questions, answered one at a time. */
export function QuestionApproval({
  questions,
  isPending,
  onSubmit,
}: QuestionApprovalProps) {
  const t = useTranslations('Chat')
  const titleId = useId()
  const items = useMemo(
    () =>
      questions.map((question, index) => ({
        name: `question-${index}`,
        required: true,
        choices: [...new Set(question.choices)].map((value) => ({ value })),
      })),
    [questions],
  )

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const answers = new FormData(event.currentTarget)
    onSubmit(
      JSON.stringify(
        questions.map((question, index) => ({
          question: question.question,
          answer: String(answers.get(`question-${index}`) ?? '').trim(),
        })),
      ),
    )
  }

  return (
    <Questionnaire items={items} shortcuts='numbers' onSubmit={submit}>
      <Card size='sm'>
        {questions.map((question, index) => (
          <QuestionnaireItem
            key={items[index].name}
            name={items[index].name}
            required
            aria-labelledby={`${titleId}-${index}`}
            className='gap-3'
          >
            <CardHeader>
              <QuestionnaireTitle
                id={`${titleId}-${index}`}
                render={<CardTitle />}
                // The card header already spaces the title from the choices.
                className='whitespace-pre-wrap leading-relaxed [&:not(:has(~[data-slot=questionnaire-description]))]:mb-0'
              >
                {question.question}
              </QuestionnaireTitle>
              {questions.length > 1 && (
                <CardAction>
                  <QuestionnaireProgress
                    className='min-w-0'
                    render={(props, state) => (
                      <div {...props}>
                        {t('question_progress', {
                          current: state.current,
                          total: state.total,
                        })}
                      </div>
                    )}
                  />
                </CardAction>
              )}
            </CardHeader>
            <CardContent>
              <QuestionnaireChoices>
                {items[index].choices.map(({ value }) => (
                  <QuestionnaireChoice key={value} value={value}>
                    {value}
                  </QuestionnaireChoice>
                ))}
                <QuestionnaireInput
                  aria-label={t('custom_answer_placeholder')}
                  placeholder={t('custom_answer_placeholder')}
                />
              </QuestionnaireChoices>
              <QuestionnaireError>{t('answer_required')}</QuestionnaireError>
            </CardContent>
          </QuestionnaireItem>
        ))}
        <CardFooter>
          <QuestionnaireActions className='w-full'>
            <QuestionnairePrevious size='sm' disabled={isPending}>
              {t('question_previous')}
            </QuestionnairePrevious>
            <QuestionnaireNext size='sm' disabled={isPending}>
              {t('question_next')}
            </QuestionnaireNext>
            <QuestionnaireSubmit size='sm' disabled={isPending}>
              {isPending && <Loader2Icon className='animate-spin' />}
              {t('submit_answers')}
            </QuestionnaireSubmit>
          </QuestionnaireActions>
        </CardFooter>
      </Card>
    </Questionnaire>
  )
}
