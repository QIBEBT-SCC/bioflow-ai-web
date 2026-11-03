'use client'

import { cn } from 'cn'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { InputGroupButton } from '@/components/ui/input-group'
import { Separator } from '@/components/ui/separator'
import { formatTokenCount } from '@/lib/token-format'
import type { AgentEvent } from '@/types/agent'

interface ModelUsage {
  agent?: string
  model: string
  context_window: number | null
  input_tokens: number
  output_tokens: number
  cache_read: number
  reasoning_tokens: number
  cost: number
  /** Sub-agent nesting depth; 0 or absent is the main agent. */
  scope?: { depth?: number; parent_id?: string | null }
}

interface AgentTotal {
  agent: string
  tokens: number
  cost: number
  calls: number
  subAgent: boolean
}

interface Segment {
  key: string
  label: string
  value: number
  className: string
}

const RING_RADIUS = 6.5
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function formatCost(value: number) {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  })}`
}

function formatShare(value: number, total: number) {
  if (total <= 0) return '0%'
  const share = (value / total) * 100
  return share > 0 && share < 1 ? '<1%' : `${Math.round(share)}%`
}

/** Fill colour escalates as the window runs out. */
function fillLevel(percent: number) {
  if (percent >= 90) return 'text-destructive'
  if (percent >= 70) return 'text-chart-4'
  return 'text-primary'
}

function ContextRing({ percent }: { percent: number }) {
  return (
    <svg viewBox='0 0 16 16' className='size-4 -rotate-90' aria-hidden='true'>
      <circle
        cx='8'
        cy='8'
        r={RING_RADIUS}
        fill='none'
        strokeWidth='2'
        className='stroke-muted'
      />
      <circle
        cx='8'
        cy='8'
        r={RING_RADIUS}
        fill='none'
        strokeWidth='2'
        strokeLinecap='round'
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={RING_CIRCUMFERENCE * (1 - percent / 100)}
        className={cn('stroke-current transition-all', fillLevel(percent))}
      />
    </svg>
  )
}

/** One bar split into segments; `total` beyond the segments stays as track. */
function SegmentBar({
  segments,
  total,
  label,
}: {
  segments: Segment[]
  total: number
  label: string
}) {
  return (
    <div
      role='img'
      aria-label={label}
      className='flex h-2 w-full gap-px overflow-hidden rounded-full bg-muted'
    >
      {segments
        .filter((segment) => segment.value > 0)
        .map((segment) => (
          <div
            key={segment.key}
            className={cn('h-full min-w-0.5', segment.className)}
            style={{ width: `${(segment.value / total) * 100}%` }}
          />
        ))}
    </div>
  )
}

function SegmentLegend({
  segments,
  total,
}: {
  segments: Segment[]
  total: number
}) {
  return (
    <div className='flex flex-col gap-1.5 text-[11px]'>
      {segments.map((segment) => (
        <div key={segment.key} className='flex items-center gap-2'>
          <span
            className={cn('size-2 shrink-0 rounded-xs', segment.className)}
          />
          <span className='flex-1 text-muted-foreground'>{segment.label}</span>
          <span className='tabular-nums'>
            {formatTokenCount(segment.value)}
          </span>
          <span className='w-9 text-right text-muted-foreground tabular-nums'>
            {formatShare(segment.value, total)}
          </span>
        </div>
      ))}
    </div>
  )
}

function isSubAgent(usage: ModelUsage) {
  return (usage.scope?.depth ?? 0) > 0
}

/** Session totals per agent, main agents first, then by cost. */
function agentTotals(usages: ModelUsage[]) {
  const totals = new Map<string, AgentTotal>()
  for (const usage of usages) {
    const agent = usage.agent ?? usage.model
    const total = totals.get(agent) ?? {
      agent,
      tokens: 0,
      cost: 0,
      calls: 0,
      subAgent: isSubAgent(usage),
    }
    total.tokens += usage.input_tokens + usage.output_tokens
    total.cost += usage.cost
    total.calls += 1
    totals.set(agent, total)
  }
  return [...totals.values()].sort(
    (a, b) => Number(a.subAgent) - Number(b.subAgent) || b.cost - a.cost,
  )
}

function AgentTotals({ totals }: { totals: AgentTotal[] }) {
  const t = useTranslations('Chat.context')
  return (
    <div className='flex flex-col gap-1.5 text-[11px]'>
      <span className='font-medium text-xs'>{t('by_agent')}</span>
      {totals.map((total) => (
        <div key={total.agent} className='flex items-center gap-2'>
          <span className='min-w-0 flex-1 truncate' title={total.agent}>
            {total.agent.replaceAll('_', ' ')}
            {total.subAgent && (
              <span className='ml-1 text-muted-foreground'>
                · {t('sub_agent')}
              </span>
            )}
          </span>
          <span className='text-muted-foreground tabular-nums'>
            {formatTokenCount(total.tokens)}
          </span>
          <span className='w-14 text-right tabular-nums'>
            {formatCost(total.cost)}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Context fill of the main agent's latest model call, plus totals for the
 * whole session. Usage arrives as `run.usage` events, one per model call;
 * sub-agent calls count toward the totals but not the context fill unless
 * no main-agent call exists (a run made only of sub-agents).
 */
export function ContextUsage({ events }: { events: AgentEvent[] }) {
  const t = useTranslations('Chat.context')
  const summary = useMemo(() => {
    const usages = events
      .filter((event) => event.event_type === 'run.usage')
      .map((event) => event.payload as unknown as ModelUsage)
    const latest =
      usages.findLast((usage) => !isSubAgent(usage)) ?? usages.at(-1)
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
    return {
      latest,
      total,
      used,
      limit,
      percent,
      calls: usages.length,
      agents: agentTotals(usages),
    }
  }, [events])

  if (!summary) return null
  const { latest, total, used, limit, percent, calls, agents } = summary

  // Input tokens include cache hits, so split them to keep the segments disjoint.
  const segmentsOf = (input: number, cacheRead: number, output: number) => [
    {
      key: 'cache_read',
      label: t('cache_read'),
      value: cacheRead,
      className: 'bg-chart-2',
    },
    {
      key: 'input',
      label: t('input'),
      value: Math.max(0, input - cacheRead),
      className: 'bg-chart-1',
    },
    {
      key: 'output',
      label: t('output'),
      value: output,
      className: 'bg-chart-3',
    },
  ]
  const sessionSegments = segmentsOf(total.input, total.cacheRead, total.output)
  const sessionTokens = total.input + total.output

  return (
    <HoverCard openDelay={10} closeDelay={100}>
      <HoverCardTrigger asChild>
        <InputGroupButton
          size='icon-sm'
          className='rounded-full'
          aria-label={percent === null ? t('label') : t('percent', { percent })}
        >
          <ContextRing percent={percent ?? 0} />
        </InputGroupButton>
      </HoverCardTrigger>
      <HoverCardContent
        side='top'
        align='end'
        className='flex w-64 flex-col gap-3 text-xs'
      >
        <div className='flex flex-col gap-2'>
          <div className='flex items-baseline justify-between gap-3 text-xs'>
            <span className='font-medium'>{t('title')}</span>
            {percent !== null && (
              <span
                className={cn('font-medium tabular-nums', fillLevel(percent))}
              >
                {percent}%
              </span>
            )}
          </div>
          {percent !== null && limit ? (
            <>
              <div
                role='progressbar'
                aria-label={t('label')}
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className='h-2 w-full overflow-hidden rounded-full bg-muted'
              >
                <div
                  className={cn(
                    'h-full rounded-full bg-current transition-all',
                    fillLevel(percent),
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className='flex justify-between gap-3 text-muted-foreground text-[11px] tabular-nums'>
                <span>
                  {t('used', {
                    used: formatTokenCount(used),
                    limit: formatTokenCount(limit),
                  })}
                </span>
                <span>
                  {t('remaining', {
                    tokens: formatTokenCount(Math.max(0, limit - used)),
                  })}
                </span>
              </div>
            </>
          ) : (
            <p className='text-muted-foreground text-[11px]'>
              {t('no_limit', { used: formatTokenCount(used) })}
            </p>
          )}
        </div>

        <Separator />

        <div className='flex flex-col gap-2'>
          <div className='flex items-baseline justify-between gap-3 text-xs'>
            <span className='font-medium'>{t('session_total')}</span>
            <span className='font-medium tabular-nums'>
              {formatCost(total.cost)}
            </span>
          </div>
          <SegmentBar
            segments={sessionSegments}
            total={Math.max(sessionTokens, 1)}
            label={t('session_total')}
          />
          <SegmentLegend segments={sessionSegments} total={sessionTokens} />
          {total.reasoning > 0 && (
            <p className='text-muted-foreground text-[11px]'>
              {t('reasoning_note', {
                tokens: formatTokenCount(total.reasoning),
              })}
            </p>
          )}
        </div>

        {agents.length > 1 && (
          <>
            <Separator />
            <AgentTotals totals={agents} />
          </>
        )}

        <div className='flex items-center justify-between gap-3 text-muted-foreground text-[11px]'>
          <span className='truncate'>{latest.model}</span>
          <span className='shrink-0'>{t('calls', { count: calls })}</span>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
