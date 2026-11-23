'use client'

import { cn } from 'cn'
import { CpuIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { FilterPanel } from '@/components/layout/filter-panel'
import { AddProviderDialog } from '@/components/settings/add-provider-dialog'
import { ProviderDetail } from '@/components/settings/provider-detail'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { useLLMProviders } from '@/hooks/use-setting'
import { statusToneClasses } from '@/lib/status'
import type { LLMProviderPublic } from '@/types/setting'

function ProviderListItem({
  provider,
  selected,
  onSelect,
}: {
  provider: LLMProviderPublic
  selected: boolean
  onSelect: () => void
}) {
  const t = useTranslations('setting.llm_setting')
  const statusDotClass = !provider.is_active
    ? 'bg-muted-foreground/30'
    : provider.credential_configured
      ? statusToneClasses.success.dot
      : statusToneClasses.warning.dot

  return (
    <button
      type='button'
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted',
        selected && 'bg-accent text-accent-foreground hover:bg-accent',
      )}
    >
      <span
        aria-hidden
        className={cn('mt-1.5 size-2 shrink-0 rounded-full', statusDotClass)}
      />
      <span className='min-w-0 flex-1'>
        <span
          className={cn(
            'block truncate text-sm font-medium',
            !provider.is_active && 'text-muted-foreground',
          )}
        >
          {provider.name}
        </span>
        <span className='block truncate text-xs text-muted-foreground tabular-nums'>
          {provider.is_active
            ? `${t(`provider_type_${provider.provider_type}`)} · ${t('model_count', { count: provider.models.length })}`
            : t('status_disabled')}
        </span>
      </span>
    </button>
  )
}

export function ProviderList() {
  const t = useTranslations('setting.llm_setting')
  const { data: providers, isLoading, error } = useLLMProviders()
  const [selectedProviderId, setSelectedProviderId] = useState<number>()

  const selectedProvider =
    providers?.find((provider) => provider.id === selectedProviderId) ??
    providers?.[0]

  if (isLoading) {
    return (
      <div
        className='grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]'
        aria-busy='true'
      >
        <Skeleton className='h-48 rounded-xl' />
        <div className='space-y-4'>
          <Skeleton className='h-14 rounded-xl' />
          <Skeleton className='h-60 rounded-xl' />
          <Skeleton className='h-56 rounded-xl' />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <p role='alert' className='text-sm text-destructive'>
        {t('load_failed')}
      </p>
    )
  }

  if (!providers?.length) {
    return (
      <Empty className='border border-dashed'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <CpuIcon />
          </EmptyMedia>
          <EmptyTitle>{t('no_providers')}</EmptyTitle>
          <EmptyDescription>{t('no_providers_desc')}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <AddProviderDialog
            onCreated={(provider) => setSelectedProviderId(provider.id)}
          />
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className='flex flex-col gap-6 lg:flex-row lg:items-start'>
      <FilterPanel
        className='lg:w-64'
        title={t('providers')}
        action={
          <AddProviderDialog
            triggerVariant='icon'
            onCreated={(provider) => setSelectedProviderId(provider.id)}
          />
        }
      >
        <nav aria-label={t('providers')} className='space-y-0.5'>
          {providers.map((provider) => (
            <ProviderListItem
              key={provider.id}
              provider={provider}
              selected={selectedProvider?.id === provider.id}
              onSelect={() => setSelectedProviderId(provider.id)}
            />
          ))}
        </nav>
      </FilterPanel>

      {selectedProvider && (
        <section className='min-w-0 flex-1'>
          <ProviderDetail
            key={selectedProvider.id}
            provider={selectedProvider}
            onDeleted={() => setSelectedProviderId(undefined)}
          />
        </section>
      )}
    </div>
  )
}
