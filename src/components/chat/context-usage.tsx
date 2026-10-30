'use client'

import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { InputGroupButton } from '@/components/ui/input-group'
import { Progress } from '@/components/ui/progress'
import { formatTokenCount } from '@/lib/token-format'
import type { AgentEvent } from '@/types/agent'

interface ModelUsage {
  model: string
  context_window: number | null
  input_tokens: number
  output_tokens: number
  cache_read: number
  reasoning_tokens: number
  cost: number
}

function formatCost(value: number) {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  })}`
}

/**
 * Context fill of the latest model call, plus totals for the whole session.
 * Usage arrives as `run.usage` events, one per model call.
 */
export function ContextUsage({ events }: { events: AgentEvent[] }) {
  const t = useTranslations('Chat.context')
  const summary = useMemo(() => {
    const usages = events
      .filter((event) => event.event_type === 'run.usage')
      .map((event) => event.payload as unknown as ModelUsage)
    const latest = usages.at(-1)
    if (!latest) return null
    const total = usages.reduce(
      (sum, usage) => ({
        input: sum.input + usage.input_tokens,
        output: sum.output + usage.output_tokens,
        cacheRead: sum.cacheRead + usage.cache_read,
        reasoning: sum.reasoning + usage.reasoning_tokens,
        cost: sum.cost + usage.cost,
      }),
      { input: 0, output: 0, cacheRead: 0, reasoning: 0, cost: 0 },
    )
    const used = latest.input_tokens + latest.output_tokens
    const limit = latest.context_window
    const percent = limit
      ? Math.min(100, Math.round((used / limit) * 100))
      : null
    return { latest, total, used, limit, percent }
  }, [events])

  if (!summary) return null
  const { latest, total, used, limit, percent } = summary

  const rows = [
    { label: t('input'), value: formatTokenCount(total.input) },
    { label: t('cache_read'), value: formatTokenCount(total.cacheRead) },
    { label: t('output'), value: formatTokenCount(total.output) },
    ...(total.reasoning > 0
      ? [{ label: t('reasoning'), value: formatTokenCount(total.reasoning) }]
      : []),
  ]

  return (
    <HoverCard openDelay={10} closeDelay={100}>
      <HoverCardTrigger asChild>
        <InputGroupButton size='sm' aria-label={t('label')}>
          {percent === null
            ? formatTokenCount(used)
            : t('percent', { percent })}
        </InputGroupButton>
      </HoverCardTrigger>
      <HoverCardContent side='top' className='flex w-64 flex-col gap-3'>
        <div className='flex items-center justify-between gap-3 text-sm'>
          <span className='font-medium'>{t('title')}</span>
          <span className='text-muted-foreground'>
            {formatTokenCount(used)}
            {limit ? ` / ${formatTokenCount(limit)}` : ''}
          </span>
        </div>
        {percent !== null && (
          <Progress value={percent} aria-label={t('label')} />
        )}
        <div className='truncate text-muted-foreground text-xs'>
          {latest.model}
        </div>
        <div className='flex flex-col gap-1 text-sm'>
          <span className='text-muted-foreground text-xs'>
            {t('session_total')}
          </span>
          {rows.map((row) => (
            <div key={row.label} className='flex justify-between gap-3'>
              <span className='text-muted-foreground'>{row.label}</span>
              <span>{row.value}</span>
            </div>
          ))}
          <div className='flex justify-between gap-3'>
            <span className='text-muted-foreground'>{t('cost')}</span>
            <span>{formatCost(total.cost)}</span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
