'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  useCodingAgentSettings,
  useSaveCodingAgentSettings,
} from '@/hooks/use-code-agent'
import type { CodingAgentSettings } from '@/types/code-agent'

export function CodingAgentSettingsPanel() {
  const { data, isPending, error } = useCodingAgentSettings()
  const t = useTranslations('setting.coding_agent')
  if (isPending)
    return (
      <p className='text-sm text-muted-foreground'>{t('loadingSettings')}</p>
    )
  if (error)
    return (
      <p role='alert' className='text-sm text-destructive'>
        {error.message}
      </p>
    )
  return <SettingsForm key={JSON.stringify(data)} initial={data} />
}

function SettingsForm({ initial }: { initial: CodingAgentSettings }) {
  const t = useTranslations('setting.coding_agent')
  const [settings, setSettings] = useState(initial)
  const save = useSaveCodingAgentSettings()
  const selectClass =
    'h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('runtimeTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className='space-y-5'
          onSubmit={(event) => {
            event.preventDefault()
            save.mutate(settings, {
              onSuccess: () => toast.success(t('settingsSaved')),
              onError: (error) => toast.error(error.message),
            })
          }}
        >
          <p className='text-sm text-muted-foreground'>
            {t('newSessionsOnly')}
          </p>
          <label className='grid gap-2 text-sm'>
            {t('sandbox')}
            <select
              aria-label={t('sandbox')}
              className={selectClass}
              value={settings.sandbox_mode}
              disabled={save.isPending}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  sandbox_mode: event.target
                    .value as CodingAgentSettings['sandbox_mode'],
                })
              }
            >
              <option value='read-only'>{t('readOnly')}</option>
              <option value='workspace-write'>{t('workspaceWrite')}</option>
              <option value='danger-full-access'>{t('fullAccess')}</option>
            </select>
          </label>
          <p className='text-xs text-muted-foreground'>
            {t('automaticApproval')}
          </p>
          <label className='grid gap-2 text-sm'>
            {t('webSearch')}
            <select
              aria-label={t('webSearch')}
              className={selectClass}
              value={settings.web_search}
              disabled={save.isPending}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  web_search: event.target
                    .value as CodingAgentSettings['web_search'],
                })
              }
            >
              <option value='live'>{t('searchLive')}</option>
              <option value='cached'>{t('searchCached')}</option>
              <option value='disabled'>{t('searchDisabled')}</option>
            </select>
          </label>
          <div className='flex items-center justify-between gap-4'>
            <label htmlFor='agent-network' className='text-sm'>
              {t('commandNetwork')}
            </label>
            <Switch
              id='agent-network'
              checked={settings.network_access}
              disabled={
                save.isPending || settings.sandbox_mode !== 'workspace-write'
              }
              onCheckedChange={(network_access) =>
                setSettings({ ...settings, network_access })
              }
            />
          </div>
          <p className='text-xs text-muted-foreground'>{t('networkHelp')}</p>
          <div className='flex justify-end'>
            <Button type='submit' disabled={save.isPending}>
              {t('saveSettings')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
