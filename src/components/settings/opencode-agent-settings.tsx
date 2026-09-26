'use client'

import {
  BracesIcon,
  Loader2Icon,
  PencilIcon,
  ShieldCheckIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type FormEvent, type ReactNode, useState } from 'react'
import { toast } from 'sonner'
import {
  CodingAgentBlock,
  CodingAgentSection,
} from '@/components/settings/coding-agent-section'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useOpenCodeAgentSettings,
  useSaveOpenCodeCredentials,
} from '@/hooks/use-code-agent'
import { cn } from '@/lib/utils'
import type { OpenCodeModelProvider } from '@/types/code-agent'

const MODEL_PROVIDERS: Array<{
  id: OpenCodeModelProvider
  name: string
}> = [
  { id: 'opencode-go', name: 'OpenCode Go' },
  { id: 'opencode', name: 'OpenCode Zen' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'google', name: 'Google' },
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'deepseek', name: 'DeepSeek' },
]

interface OpenCodeFormDraft {
  editing: boolean
  apiKey: string
  modelProvider?: OpenCodeModelProvider
  baseUrl?: string
  modelId?: string
}

export function OpenCodeAgentSettings({ available }: { available: boolean }) {
  const t = useTranslations('setting.coding_agent')
  const settings = useOpenCodeAgentSettings()
  const saveCredentials = useSaveOpenCodeCredentials()
  const [draft, setDraft] = useState<OpenCodeFormDraft>({
    editing: false,
    apiKey: '',
  })

  const configured = settings.data?.configured ?? available
  const modelProvider =
    draft.modelProvider ?? settings.data?.model_provider ?? 'opencode-go'
  const baseUrl = draft.baseUrl ?? settings.data?.base_url ?? ''
  const modelId = draft.modelId ?? settings.data?.model_id ?? ''
  const providerName =
    modelProvider === 'custom'
      ? t('customProvider')
      : (MODEL_PROVIDERS.find((provider) => provider.id === modelProvider)
          ?.name ?? modelProvider)
  const customReady =
    modelProvider !== 'custom' ||
    (Boolean(baseUrl.trim()) && Boolean(modelId.trim()))

  const resetForm = () => {
    setDraft({ editing: false, apiKey: '' })
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await saveCredentials.mutateAsync({
        api_key: draft.apiKey,
        model_provider: modelProvider,
        ...(modelProvider === 'custom'
          ? { base_url: baseUrl.trim(), model_id: modelId.trim() }
          : {}),
      })
      resetForm()
      toast.success(t('credentialsSaved'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('loginFailed'))
    }
  }

  const saving = saveCredentials.isPending
  const showSummary = configured && Boolean(settings.data) && !draft.editing

  return (
    <CodingAgentSection
      icon={<BracesIcon />}
      name='OpenCode'
      summary={t('openCodeSummary')}
      connected={configured}
      statusLabel={configured ? t('credentialsConfigured') : t('disconnected')}
      action={
        showSummary && (
          <Button
            type='button'
            variant='outline'
            onClick={() =>
              setDraft((current) => ({ ...current, editing: true }))
            }
          >
            <PencilIcon className='size-4' />
            {t('updateCredentials')}
          </Button>
        )
      }
    >
      <CodingAgentBlock
        title={t('modelProvider')}
        description={showSummary ? undefined : t('apiCredentialHelp')}
      >
        {settings.isLoading && (
          <div className='space-y-2' aria-busy='true'>
            <span className='sr-only'>{t('loadingSettings')}</span>
            <Skeleton className='h-9 rounded-md' />
            <Skeleton className='h-9 rounded-md' />
          </div>
        )}
        {settings.error && (
          <p role='alert' className='text-sm text-destructive'>
            {settings.error.message}
          </p>
        )}
        {showSummary && (
          <dl className='divide-y rounded-lg border text-sm'>
            <SummaryRow label={t('modelProvider')}>{providerName}</SummaryRow>
            {modelProvider === 'custom' && (
              <>
                <SummaryRow label={t('customBaseUrl')} mono>
                  {baseUrl}
                </SummaryRow>
                <SummaryRow label={t('customModelId')} mono>
                  {modelId}
                </SummaryRow>
              </>
            )}
            <SummaryRow label={t('apiKey')}>
              <span className='inline-flex items-center gap-1.5 text-success'>
                <ShieldCheckIcon className='size-4' />
                {t('credentialsConfigured')}
              </span>
            </SummaryRow>
          </dl>
        )}
        {showSummary && (
          <p className='text-xs text-muted-foreground'>
            {t('credentialStored')}
          </p>
        )}
        {!settings.isLoading && !showSummary && (
          <form className='space-y-4' onSubmit={save}>
            <div className='space-y-2'>
              <Label htmlFor='opencode-model-provider'>
                {t('modelProvider')}
              </Label>
              <Select
                value={modelProvider}
                onValueChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    modelProvider: value as OpenCodeModelProvider,
                  }))
                }
                disabled={saving}
              >
                <SelectTrigger id='opencode-model-provider' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                  <SelectItem value='custom'>{t('customProvider')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {modelProvider === 'custom' && (
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='opencode-custom-base-url'>
                    {t('customBaseUrl')}
                  </Label>
                  <Input
                    id='opencode-custom-base-url'
                    type='url'
                    inputMode='url'
                    value={baseUrl}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        baseUrl: event.target.value,
                      }))
                    }
                    placeholder='https://api.example.com/v1'
                    required
                    disabled={saving}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='opencode-custom-model-id'>
                    {t('customModelId')}
                  </Label>
                  <Input
                    id='opencode-custom-model-id'
                    value={modelId}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        modelId: event.target.value,
                      }))
                    }
                    placeholder='my-model'
                    required
                    disabled={saving}
                  />
                </div>
                <p className='text-xs text-muted-foreground sm:col-span-2'>
                  {t('customProviderHelp')}
                </p>
              </div>
            )}
            <div className='space-y-2'>
              <Label htmlFor='opencode-api-key'>{t('apiKey')}</Label>
              <Input
                id='opencode-api-key'
                type='password'
                autoComplete='new-password'
                value={draft.apiKey}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    apiKey: event.target.value,
                  }))
                }
                required
                disabled={saving}
              />
            </div>
            <div className='flex justify-end gap-2'>
              {configured && (
                <Button
                  type='button'
                  variant='ghost'
                  disabled={saving}
                  onClick={resetForm}
                >
                  {t('cancel')}
                </Button>
              )}
              <Button
                type='submit'
                disabled={saving || !draft.apiKey.trim() || !customReady}
              >
                {saving && <Loader2Icon className='size-4 animate-spin' />}
                {saving ? t('savingCredentials') : t('saveCredentials')}
              </Button>
            </div>
          </form>
        )}
      </CodingAgentBlock>
    </CodingAgentSection>
  )
}

function SummaryRow({
  label,
  mono,
  children,
}: {
  label: string
  mono?: boolean
  children: ReactNode
}) {
  return (
    <div className='flex items-start justify-between gap-4 px-4 py-2.5'>
      <dt className='shrink-0 text-muted-foreground'>{label}</dt>
      <dd
        className={cn(
          'min-w-0 text-right font-medium break-all',
          mono && 'font-mono text-xs',
        )}
      >
        {children}
      </dd>
    </div>
  )
}
