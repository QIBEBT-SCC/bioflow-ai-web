'use client'

import { useTranslations } from 'next-intl'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ProviderType, ReasoningEffort } from '@/types/setting'

const DEFAULT_VALUE = 'default'

const reasoningEffortsByProvider: Record<ProviderType, ReasoningEffort[]> = {
  openai: ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'],
  anthropic: ['low', 'medium', 'high', 'xhigh', 'max'],
  google: ['minimal', 'low', 'medium', 'high'],
}
const deepseekReasoningEfforts: ReasoningEffort[] = [
  'none',
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
]

interface ReasoningEffortSelectProps {
  id: string
  providerType: ProviderType
  providerName: string
  providerBaseUrl?: string
  value?: ReasoningEffort | null
  onValueChange: (value: ReasoningEffort | null) => void
  className?: string
}

export function ReasoningEffortSelect({
  id,
  providerType,
  providerName,
  providerBaseUrl,
  value,
  onValueChange,
  className,
}: ReasoningEffortSelectProps) {
  const t = useTranslations('setting.llm_setting')
  const isDeepseekProvider =
    providerName.toLowerCase().includes('deepseek') ||
    (providerBaseUrl?.toLowerCase().includes('api.deepseek.com') ?? false)
  const reasoningEfforts =
    providerType === 'openai' && isDeepseekProvider
      ? deepseekReasoningEfforts
      : reasoningEffortsByProvider[providerType]

  return (
    <Select
      value={value ?? DEFAULT_VALUE}
      onValueChange={(nextValue) =>
        onValueChange(
          nextValue === DEFAULT_VALUE ? null : (nextValue as ReasoningEffort),
        )
      }
    >
      <SelectTrigger id={id} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={DEFAULT_VALUE}>
          {t('reasoning_effort_default')}
        </SelectItem>
        {reasoningEfforts.map((effort) => (
          <SelectItem key={effort} value={effort}>
            {t(`reasoning_effort_${effort}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
