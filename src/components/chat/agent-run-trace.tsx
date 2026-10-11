'use client'

import { RotateCcwIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { AGENT_ICONS } from '@/components/chat/agent-meta'
import { AgentRunProgress } from '@/components/chat/agent-run-content'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
  return (
    <>
      <span aria-hidden='true'>·</span>
      <span>{label}</span>
    </>
  )
}

/**
 * Runtime trace of one agent run: a quiet meta line (assistant and
 * duration), the collapsible execution trace, and a failure line
 * with retry for the current run.
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
    <div className='flex flex-col gap-1.5'>
      <p className='flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-muted-foreground text-xs tabular-nums'>
        <Icon className='size-3.5 shrink-0' />
        <span className='font-medium text-foreground/80'>
          {t(`assistants.${run.agent_name}.label`)}
        </span>
        <RunDuration run={run} live={isStreaming} />
      </p>

      <AgentRunProgress events={events} run={run} />

      {run.status === 'failed' && (
        <div className='flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2'>
          <p className='min-w-0 flex-1 whitespace-pre-wrap break-words text-destructive text-xs leading-relaxed'>
            {run.error_message || t('failed')}
          </p>
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
      )}
    </div>
  )
}
