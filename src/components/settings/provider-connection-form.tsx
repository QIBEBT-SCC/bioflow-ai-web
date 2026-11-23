'use client'

import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type FormEvent, useReducer, useState } from 'react'
import { toast } from 'sonner'
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
import { Switch } from '@/components/ui/switch'
import { useUpdateLLMProvider } from '@/hooks/use-setting'
import type { LLMProviderPublic, ProviderType } from '@/types/setting'

interface ConnectionFormState {
  name: string
  providerType: ProviderType
  baseUrl: string
  apiKey: string
  useProxy: boolean
}

type ConnectionFormAction =
  | { type: 'setName'; value: string }
  | { type: 'setProviderType'; value: ProviderType }
  | { type: 'setBaseUrl'; value: string }
  | { type: 'setApiKey'; value: string }
  | { type: 'setUseProxy'; value: boolean }
  | { type: 'reset'; state: ConnectionFormState }

function connectionFormReducer(
  state: ConnectionFormState,
  action: ConnectionFormAction,
): ConnectionFormState {
  switch (action.type) {
    case 'setName':
      return { ...state, name: action.value }
    case 'setProviderType':
      return { ...state, providerType: action.value }
    case 'setBaseUrl':
      return { ...state, baseUrl: action.value }
    case 'setApiKey':
      return { ...state, apiKey: action.value }
    case 'setUseProxy':
      return { ...state, useProxy: action.value }
    case 'reset':
      return action.state
  }
}

function initialState(provider: LLMProviderPublic): ConnectionFormState {
  return {
    name: provider.name,
    providerType: provider.provider_type,
    baseUrl: provider.base_url ?? '',
    apiKey: '',
    useProxy: provider.use_proxy,
  }
}

export function ProviderConnectionForm({
  provider,
}: {
  provider: LLMProviderPublic
}) {
  const t = useTranslations('setting.llm_setting')
  const updateProviderMutation = useUpdateLLMProvider()
  const [form, dispatch] = useReducer(
    connectionFormReducer,
    provider,
    initialState,
  )
  const [showApiKey, setShowApiKey] = useState(false)
  const saving = updateProviderMutation.isPending

  const baseline = initialState(provider)
  const dirty =
    form.name.trim() !== baseline.name.trim() ||
    form.providerType !== baseline.providerType ||
    form.baseUrl.trim() !== baseline.baseUrl.trim() ||
    form.apiKey.trim() !== '' ||
    form.useProxy !== baseline.useProxy

  const canSave = dirty && !!form.name.trim() && !saving

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSave) return

    const trimmedApiKey = form.apiKey.trim()
    const trimmedBaseUrl = form.baseUrl.trim()

    try {
      await updateProviderMutation.mutateAsync({
        id: provider.id,
        data: {
          name: form.name.trim(),
          provider_type: form.providerType,
          base_url: trimmedBaseUrl || null,
          use_proxy: form.useProxy,
          ...(trimmedApiKey ? { api_key: trimmedApiKey } : {}),
        },
      })
      dispatch({ type: 'setApiKey', value: '' })
      toast.success(t('provider_saved'))
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('provider_save_failed'),
      )
    }
  }

  return (
    <form className='space-y-4' onSubmit={handleSubmit}>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor={`provider-name-${provider.id}`}>
            {t('provider_name')}
          </Label>
          <Input
            id={`provider-name-${provider.id}`}
            value={form.name}
            disabled={saving}
            onChange={(e) =>
              dispatch({ type: 'setName', value: e.target.value })
            }
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor={`provider-type-${provider.id}`}>
            {t('provider_type')}
          </Label>
          <Select
            value={form.providerType}
            disabled={saving}
            onValueChange={(value) =>
              dispatch({
                type: 'setProviderType',
                value: value as ProviderType,
              })
            }
          >
            <SelectTrigger
              id={`provider-type-${provider.id}`}
              className='w-full'
            >
              <SelectValue placeholder={t('select_type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='openai'>
                {t('provider_type_openai')}
              </SelectItem>
              <SelectItem value='anthropic'>
                {t('provider_type_anthropic')}
              </SelectItem>
              <SelectItem value='google'>
                {t('provider_type_google')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <Label htmlFor={`provider-baseurl-${provider.id}`}>Base URL</Label>
          <Input
            id={`provider-baseurl-${provider.id}`}
            value={form.baseUrl}
            disabled={saving}
            onChange={(e) =>
              dispatch({ type: 'setBaseUrl', value: e.target.value })
            }
            placeholder='https://api.provider.com/v1'
            className='font-mono text-sm'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor={`provider-apikey-${provider.id}`}>API Key</Label>
          <div className='relative'>
            <Input
              id={`provider-apikey-${provider.id}`}
              type={showApiKey ? 'text' : 'password'}
              autoComplete='new-password'
              value={form.apiKey}
              disabled={saving}
              onChange={(e) =>
                dispatch({ type: 'setApiKey', value: e.target.value })
              }
              placeholder={
                provider.credential_configured
                  ? t('api_key_update_placeholder')
                  : 'sk-...'
              }
              className='pr-10 font-mono text-sm'
            />
            <Button
              type='button'
              variant='ghost'
              size='icon'
              aria-label={t('toggle_api_key_visibility')}
              className='absolute top-1/2 right-1 size-7 -translate-y-1/2'
              onClick={() => setShowApiKey((visible) => !visible)}
            >
              {showApiKey ? (
                <EyeOffIcon className='size-4' />
              ) : (
                <EyeIcon className='size-4' />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className='flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5'>
        <div className='space-y-0.5'>
          <Label htmlFor={`provider-proxy-${provider.id}`}>
            {t('use_proxy')}
          </Label>
          <p className='text-xs text-muted-foreground'>{t('use_proxy_desc')}</p>
        </div>
        <Switch
          id={`provider-proxy-${provider.id}`}
          checked={form.useProxy}
          disabled={saving}
          onCheckedChange={(checked) =>
            dispatch({ type: 'setUseProxy', value: checked })
          }
        />
      </div>

      {dirty && (
        <div className='flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-end'>
          <span className='mr-auto text-sm text-muted-foreground'>
            {t('unsaved_changes')}
          </span>
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='ghost'
              disabled={saving}
              onClick={() => dispatch({ type: 'reset', state: baseline })}
            >
              {t('reset')}
            </Button>
            <Button type='submit' disabled={!canSave}>
              {saving && <Loader2Icon className='size-4 animate-spin' />}
              {saving ? t('saving') : t('save')}
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
