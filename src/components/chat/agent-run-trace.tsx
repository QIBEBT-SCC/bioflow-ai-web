'use client'

import { cn } from 'cn'
import { CircleAlertIcon, CircleSlashIcon, RotateCcwIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { AGENT_ICONS } from '@/components/chat/agent-meta'
import { AgentRunProgress } from '@/components/chat/agent-run-content'
import { Button } from '@/components/ui/button'
import { CodeBlock, CodeBlockContent } from '@/components/ui/code-block'
import {
  Trace,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@/components/ui/trace'
import {
  type AgentEvent,
  type AgentRun,
  STREAMING_AGENT_STATUSES,
} from '@/types/agent'

function useElapsedSeconds(run: AgentRun, live: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!live) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [live])
  if (!run.start_time) return null
  const start = new Date(run.start_time).getTime()
  const end = run.end_time ? new Date(run.end_time).getTime() : now
  return Math.max(0, Math.floor((end - start) / 1000))
}

function RunDuration({ run, live }: { run: AgentRun; live: boolean }) {
  const t = useTranslations('task.duration')
  const seconds = useElapsedSeconds(run, live)
  if (seconds === null) return null
  const label =
    seconds < 60
      ? t('seconds', { seconds })
      : seconds < 3600
        ? t('minutesSeconds', {
            minutes: Math.floor(seconds / 60),
            seconds: seconds % 60,
          })
        : t('hoursMinutes', {
            hours: Math.floor(seconds / 3600),
            minutes: Math.floor((seconds % 3600) / 60),
          })
  return <TraceDescription>{label}</TraceDescription>
}

/**
 * Runtime trace of one agent run: the assistant and duration, the
 * Chain of Thought of its steps with the todo Queue, and a failure
 * line with retry for the current run.
 */
export function AgentRunTrace({
  run,
  events,
  onRetry,
  isRetrying = false,
}: {
  run: AgentRun
  events: AgentEvent[]
  onRetry?: () => void
  isRetrying?: boolean
}) {
  const t = useTranslations('Chat')
  const Icon = AGENT_ICONS[run.agent_name]
  const isStreaming = STREAMING_AGENT_STATUSES.includes(run.status)

  return (
    <Trace>
      <TraceLine>
        <TraceIcon>
          <Icon />
        </TraceIcon>
        <TraceTitle className='font-medium text-foreground/80'>
          {t(`assistants.${run.agent_name}.label`)}
        </TraceTitle>
        <RunDuration run={run} live={isStreaming} />
      </TraceLine>

      <AgentRunProgress events={events} run={run} />

      {run.status === 'failed' && (
        <>
          <div className='flex min-w-0 items-center justify-between gap-2'>
            <TraceLine status='error'>
              <TraceIcon>
                <CircleAlertIcon />
              </TraceIcon>
              <TraceTitle>{t('failed')}</TraceTitle>
            </TraceLine>
            {onRetry && (
              <Button
                size='xs'
                variant='outline'
                className='shrink-0'
                onClick={onRetry}
                disabled={isRetrying}
              >
                <RotateCcwIcon className={cn(isRetrying && 'animate-spin')} />
                {t('retry')}
              </Button>
            )}
          </div>
          {run.error_message && (
            <CodeBlock size='sm' variant='destructive'>
              <CodeBlockContent wrap className='max-h-48'>
                {run.error_message}
              </CodeBlockContent>
            </CodeBlock>
          )}
        </>
      )}

      {run.status === 'cancelled' && (
        <TraceLine status='pending'>
          <TraceIcon>
            <CircleSlashIcon />
          </TraceIcon>
          <TraceTitle>{t('cancelled')}</TraceTitle>
        </TraceLine>
      )}
    </Trace>
  )
}
