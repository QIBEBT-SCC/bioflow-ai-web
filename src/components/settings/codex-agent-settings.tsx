'use client'

import {
  FileLockIcon,
  FilePenIcon,
  TriangleAlertIcon,
  UnlockIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type ReactNode, useState } from 'react'
import { toast } from 'sonner'
import { CodingAgentBlock } from '@/components/settings/coding-agent-section'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  useCodexAgentSettings,
  useSaveCodexAgentSettings,
} from '@/hooks/use-code-agent'
import { cn } from '@/lib/utils'
import type { CodexAgentSettings } from '@/types/code-agent'

type SandboxMode = CodexAgentSettings['sandbox_mode']

export function CodexAgentSettingsPanel() {
  const { data, isPending, error } = useCodexAgentSettings()
  const t = useTranslations('setting.coding_agent')

  return (
    <CodingAgentBlock
      title={t('runtimeTitle')}
      description={t('newSessionsOnly')}
    >
      {isPending && (
        <div className='space-y-2' aria-busy='true'>
          <span className='sr-only'>{t('loadingSettings')}</span>
          <Skeleton className='h-16 rounded-lg' />
          <Skeleton className='h-16 rounded-lg' />
          <Skeleton className='h-16 rounded-lg' />
        </div>
      )}
      {error && (
        <p role='alert' className='text-sm text-destructive'>
          {error.message}
        </p>
      )}
      {data && <SettingsForm key={JSON.stringify(data)} initial={data} />}
    </CodingAgentBlock>
  )
}

function SandboxOption({
  value,
  selected,
  icon,
  title,
  description,
  warning,
  disabled,
  onSelect,
  children,
}: {
  value: SandboxMode
  selected: boolean
  icon: ReactNode
  title: string
  description: string
  warning?: string
  disabled: boolean
  onSelect: (value: SandboxMode) => void
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-lg border transition-colors',
        selected && 'border-primary bg-primary/5',
        selected && warning && 'border-warning bg-warning/5',
      )}
    >
      <label className='flex w-full cursor-pointer items-start gap-3 p-3 has-disabled:cursor-not-allowed has-disabled:opacity-60'>
        <input
          type='radio'
          name='codex-sandbox'
          value={value}
          checked={selected}
          disabled={disabled}
          onChange={() => onSelect(value)}
          className='peer sr-only'
        />
        <span
          aria-hidden
          className={cn(
            'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50',
            selected && 'border-primary',
            selected && warning && 'border-warning',
          )}
        >
          {selected && (
            <span
              className={cn(
                'size-2 rounded-full bg-primary',
                warning && 'bg-warning',
              )}
            />
          )}
        </span>
        <span className='min-w-0 flex-1'>
          <span className='flex items-center gap-2 text-sm font-medium [&_svg]:size-4 [&_svg]:text-muted-foreground'>
            {icon}
            {title}
          </span>
          <span className='mt-0.5 block text-sm text-muted-foreground'>
            {description}
          </span>
          {warning && selected && (
            <span className='mt-1.5 flex items-center gap-1.5 text-xs font-medium text-warning'>
              <TriangleAlertIcon className='size-3.5' />
              {warning}
            </span>
          )}
        </span>
      </label>
      {children}
    </div>
  )
}

function SettingsForm({ initial }: { initial: CodexAgentSettings }) {
  const t = useTranslations('setting.coding_agent')
  const [settings, setSettings] = useState(initial)
  const save = useSaveCodexAgentSettings()
  const dirty =
    settings.sandbox_mode !== initial.sandbox_mode ||
    settings.web_search !== initial.web_search ||
    settings.network_access !== initial.network_access

  const selectSandbox = (sandbox_mode: SandboxMode) =>
    setSettings((current) => ({ ...current, sandbox_mode }))

  return (
    <form
      className='space-y-6'
      action={() =>
        save.mutate(settings, {
          onSuccess: () => toast.success(t('settingsSaved')),
          onError: (error) => toast.error(error.message),
        })
      }
    >
      <fieldset className='space-y-2'>
        <legend className='mb-2 text-sm font-medium'>{t('sandbox')}</legend>
        <div className='space-y-2'>
          <SandboxOption
            value='read-only'
            selected={settings.sandbox_mode === 'read-only'}
            icon={<FileLockIcon />}
            title={t('readOnly')}
            description={t('readOnlyDesc')}
            disabled={save.isPending}
            onSelect={selectSandbox}
          />
          <SandboxOption
            value='workspace-write'
            selected={settings.sandbox_mode === 'workspace-write'}
            icon={<FilePenIcon />}
            title={t('workspaceWrite')}
            description={t('workspaceWriteDesc')}
            disabled={save.isPending}
            onSelect={selectSandbox}
          >
            {settings.sandbox_mode === 'workspace-write' && (
              <div className='flex items-center justify-between gap-4 border-t px-3 py-3 pl-10'>
                <div className='space-y-0.5'>
                  <Label htmlFor='agent-network'>{t('commandNetwork')}</Label>
                  <p className='text-xs text-muted-foreground'>
                    {t('networkHelp')}
                  </p>
                </div>
                <Switch
                  id='agent-network'
                  checked={settings.network_access}
                  disabled={save.isPending}
                  onCheckedChange={(network_access) =>
                    setSettings((current) => ({ ...current, network_access }))
                  }
                />
              </div>
            )}
          </SandboxOption>
          <SandboxOption
            value='danger-full-access'
            selected={settings.sandbox_mode === 'danger-full-access'}
            icon={<UnlockIcon />}
            title={t('fullAccess')}
            description={t('fullAccessDesc')}
            warning={t('fullAccessWarning')}
            disabled={save.isPending}
            onSelect={selectSandbox}
          />
        </div>
        <p className='text-xs text-muted-foreground'>
          {t('automaticApproval')}
        </p>
      </fieldset>

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='space-y-0.5'>
          <Label htmlFor='agent-web-search'>{t('webSearch')}</Label>
          <p className='text-xs text-muted-foreground'>{t('webSearchHelp')}</p>
        </div>
        <Select
          value={settings.web_search}
          disabled={save.isPending}
          onValueChange={(value) =>
            setSettings((current) => ({
              ...current,
              web_search: value as CodexAgentSettings['web_search'],
            }))
          }
        >
          <SelectTrigger id='agent-web-search' className='w-full sm:w-44'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='live'>{t('searchLive')}</SelectItem>
            <SelectItem value='cached'>{t('searchCached')}</SelectItem>
            <SelectItem value='disabled'>{t('searchDisabled')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {dirty && (
        <div className='flex flex-col gap-3 rounded-lg border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between'>
          <span className='text-sm text-muted-foreground'>
            {t('unsavedChanges')}
          </span>
          <div className='flex gap-2'>
            <Button
              type='button'
              variant='ghost'
              disabled={save.isPending}
              onClick={() => setSettings(initial)}
            >
              {t('discard')}
            </Button>
            <Button type='submit' disabled={save.isPending}>
              {t('saveSettings')}
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
