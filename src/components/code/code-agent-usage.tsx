'use client'

import { useTranslations } from 'next-intl'

export interface CodeAgentUsageData {
  used: number
  size: number
  cost?: { amount: number; currency: string }
}

export function CodeAgentUsage({ usage }: { usage: CodeAgentUsageData }) {
  const t = useTranslations('code.Agent')
  if (
    !Number.isFinite(usage.used) ||
    !Number.isFinite(usage.size) ||
    usage.size <= 0
  )
    return null
  const percent = Math.min(
    100,
    Math.max(0, Math.round((usage.used / usage.size) * 100)),
  )
  const details = `${usage.used.toLocaleString()} / ${usage.size.toLocaleString()} tokens`
  return (
    <span className='inline-flex items-center gap-2' title={details}>
      <span>
        {t('contextUsage')} {percent}%
      </span>
      {usage.cost && Number.isFinite(usage.cost.amount) && (
        <span>
          {usage.cost.amount.toLocaleString(undefined, {
            maximumFractionDigits: 4,
          })}{' '}
          {usage.cost.currency}
        </span>
      )}
    </span>
  )
}
