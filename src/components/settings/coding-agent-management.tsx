'use client'

import { useTranslations } from 'next-intl'
import { CodexAgentSection } from '@/components/settings/codex-agent-section'
import { OpenCodeAgentSettings } from '@/components/settings/opencode-agent-settings'
import { Skeleton } from '@/components/ui/skeleton'
import { useCodeAgentAvailability } from '@/hooks/use-code-agent'
import type { CodingAgentProvider } from '@/types/code-agent'

export function CodingAgentManagement() {
  const t = useTranslations('setting.coding_agent')
  const { data, isLoading, error } = useCodeAgentAvailability()

  const available = (provider: CodingAgentProvider) =>
    Boolean(
      data?.providers?.find((item) => item.provider === provider)?.available ??
        (provider === 'codex' ? data?.available : false),
    )

  if (isLoading) {
    return (
      <div className='space-y-6' aria-busy='true'>
        <span className='sr-only'>{t('loadingSettings')}</span>
        <Skeleton className='h-80 rounded-xl' />
        <Skeleton className='h-48 rounded-xl' />
      </div>
    )
  }
  if (error) {
    return (
      <p role='alert' className='text-sm text-destructive'>
        {error.message}
      </p>
    )
  }

  return (
    <div className='space-y-6'>
      <CodexAgentSection available={available('codex')} />
      <OpenCodeAgentSettings available={available('opencode')} />
    </div>
  )
}
