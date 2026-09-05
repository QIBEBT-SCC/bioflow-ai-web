'use client'

import { BotIcon, BracesIcon, Loader2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { CodexAgentAccount } from '@/components/settings/codex-agent-account'
import { CodexAgentSettingsPanel } from '@/components/settings/codex-agent-settings'
import { OpenCodeAgentSettings } from '@/components/settings/opencode-agent-settings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCodeAgentAvailability } from '@/hooks/use-code-agent'
import type { CodingAgentProvider } from '@/types/code-agent'

export type CodingAgentSettingsTab = CodingAgentProvider

export function CodingAgentManagement({
  initialAgent,
}: {
  initialAgent: CodingAgentSettingsTab
}) {
  const t = useTranslations('setting.coding_agent')
  const router = useRouter()
  const [activeAgent, setActiveAgent] = useState(initialAgent)
  const { data, isLoading, error } = useCodeAgentAvailability()

  const available = (provider: CodingAgentProvider) =>
    Boolean(
      data?.providers?.find((item) => item.provider === provider)?.available ??
        (provider === 'codex' ? data?.available : false),
    )

  const changeAgent = (value: string) => {
    const provider = value as CodingAgentSettingsTab
    setActiveAgent(provider)
    router.push(`/setting/coding-agent?agent=${provider}`, { scroll: false })
  }

  if (isLoading) return <Loader2Icon className='size-5 animate-spin' />
  if (error)
    return (
      <p role='alert' className='text-sm text-destructive'>
        {error.message}
      </p>
    )

  return (
    <Tabs value={activeAgent} onValueChange={changeAgent} className='space-y-6'>
      <TabsList className='grid h-11! w-full grid-cols-2 sm:w-fit sm:min-w-96'>
        <TabsTrigger value='codex' className='h-full gap-2 px-5'>
          <BotIcon className='size-4' />
          {t('tabCodex')}
        </TabsTrigger>
        <TabsTrigger value='opencode' className='h-full gap-2 px-5'>
          <BracesIcon className='size-4' />
          {t('tabOpenCode')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value='codex' className='space-y-6'>
        <div>
          <h2 className='text-xl font-semibold'>{t('codexTitle')}</h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            {t('codexDescription')}
          </p>
        </div>
        <CodexAgentAccount available={available('codex')} />
        <CodexAgentSettingsPanel />
      </TabsContent>

      <TabsContent value='opencode' className='space-y-6'>
        <div>
          <h2 className='text-xl font-semibold'>{t('openCodeTitle')}</h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            {t('openCodeDescription')}
          </p>
        </div>
        <OpenCodeAgentSettings available={available('opencode')} />
      </TabsContent>
    </Tabs>
  )
}
