'use client'

import { SettingsIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AddProviderDialog } from '@/components/settings/add-provider-dialog'
import { ProviderCard } from '@/components/settings/provider-card'
import { Card } from '@/components/ui/card'
import { useLLMProviders } from '@/hooks/use-setting'

export function ProviderList() {
  const t = useTranslations('setting.llm_setting')
  const { data: providers = [] } = useLLMProviders()

  if (providers.length === 0) {
    return (
      <Card className='p-12 text-center'>
        <SettingsIcon className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
        <h3 className='text-lg font-semibold mb-2'>{t('no_providers')}</h3>
        <p className='text-muted-foreground mb-4'>{t('no_providers_desc')}</p>
        <AddProviderDialog />
      </Card>
    )
  }

  return (
    <div className='space-y-4'>
      {providers.map((provider) => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  )
}
