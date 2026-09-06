'use client'

import {
  BracesIcon,
  CheckCircle2Icon,
  Loader2Icon,
  PencilIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useOpenCodeAgentSettings,
  useSaveOpenCodeCredentials,
} from '@/hooks/use-code-agent'
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
    <Card>
      <CardHeader className='flex-row items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='rounded-lg bg-primary/10 p-2 text-primary'>
            <BracesIcon className='size-5' />
          </div>
          <div>
            <CardTitle className='text-base'>OpenCode</CardTitle>
            <p className='text-xs text-muted-foreground'>ACP v1</p>
          </div>
        </div>
        {configured ? (
          <div className='flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400'>
            <CheckCircle2Icon className='size-4' />
            {t('connected')}
          </div>
        ) : (
          <span className='text-sm text-muted-foreground'>
            {t('disconnected')}
          </span>
        )}
      </CardHeader>
      <CardContent className='space-y-5'>
        {settings.isLoading && (
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Loader2Icon className='size-4 animate-spin' />
            {t('loadingSettings')}
          </div>
        )}
        {settings.error && (
          <p role='alert' className='text-sm text-destructive'>
            {settings.error.message}
          </p>
        )}
        {showSummary && (
          <>
            <div className='space-y-3 rounded-lg border bg-muted/30 p-4 text-sm'>
              <div className='flex items-start justify-between gap-4'>
                <span className='text-muted-foreground'>
                  {t('configuredProvider')}
                </span>
                <span className='font-medium'>{providerName}</span>
              </div>
              {modelProvider === 'custom' && (
                <>
                  <div className='flex items-start justify-between gap-4'>
                    <span className='text-muted-foreground'>
                      {t('customBaseUrl')}
                    </span>
                    <span className='break-all text-right font-mono text-xs'>
                      {baseUrl}
                    </span>
                  </div>
                  <div className='flex items-start justify-between gap-4'>
                    <span className='text-muted-foreground'>
                      {t('customModelId')}
                    </span>
                    <span className='break-all text-right font-mono text-xs'>
                      {modelId}
                    </span>
                  </div>
                </>
              )}
              <p className='border-t pt-3 text-xs text-muted-foreground'>
                {t('credentialStored')}
              </p>
            </div>
            <div className='flex justify-end'>
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
            </div>
          </>
        )}
        {!settings.isLoading && !showSummary && (
          <form className='space-y-4' onSubmit={save}>
            <p className='text-sm text-muted-foreground'>
              {t('apiCredentialHelp')}
            </p>
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
              <>
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
                  <p className='text-xs text-muted-foreground'>
                    {t('customProviderHelp')}
                  </p>
                </div>
              </>
            )}
            <div className='space-y-2'>
              <Label htmlFor='opencode-api-key'>API Key</Label>
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
                  onClick={() => {
                    resetForm()
                  }}
                >
                  {t('cancel')}
                </Button>
              )}
              <Button
                type='submit'
                disabled={saving || !draft.apiKey.trim() || !customReady}
              >
                {saving ? t('savingCredentials') : t('saveCredentials')}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
