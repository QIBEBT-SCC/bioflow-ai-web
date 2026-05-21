'use client'

import {
  ChevronDownIcon,
  ChevronRightIcon,
  Edit2Icon,
  EyeIcon,
  EyeOffIcon,
  SaveIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { AddModelDialog } from '@/components/settings/add-model-dialog'
import { ModelCard } from '@/components/settings/model-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import { useDeleteLLMProvider, useUpdateLLMProvider } from '@/hooks/use-setting'
import type {
  LLMProviderPublic,
  LLMProviderUpdate,
  ProviderType,
} from '@/types/setting'

interface ProviderCardProps {
  provider: LLMProviderPublic
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const t = useTranslations('setting.llm_setting')
  const updateProviderMutation = useUpdateLLMProvider()
  const deleteProviderMutation = useDeleteLLMProvider()

  const [isOpen, setIsOpen] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<LLMProviderUpdate | null>(null)

  const startEditing = () => {
    setDraft({
      name: provider.name,
      provider_type: provider.provider_type,
      base_url: provider.base_url,
      api_key: provider.api_key,
      use_proxy: provider.use_proxy,
      is_active: provider.is_active,
    })
    setIsEditing(true)
  }

  const saveProvider = async () => {
    if (!draft) return
    await updateProviderMutation.mutateAsync({ id: provider.id, data: draft })
    setIsEditing(false)
    setDraft(null)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setDraft(null)
  }

  const deleteProvider = async () => {
    await deleteProviderMutation.mutateAsync(provider.id)
  }

  const toggleActive = async (checked: boolean) => {
    await updateProviderMutation.mutateAsync({
      id: provider.id,
      data: { is_active: checked },
    })
  }

  // biome-ignore lint/suspicious/noExplicitAny: no need
  const updateDraft = (field: keyof LLMProviderUpdate, value: any) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  return (
    <Card className='border-border bg-card py-0'>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className='p-6'>
          {/* Provider Header */}
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-3 flex-1'>
              <CollapsibleTrigger asChild>
                <Button variant='ghost' size='sm' className='size-8 p-0'>
                  {isOpen ? (
                    <ChevronDownIcon className='size-4' />
                  ) : (
                    <ChevronRightIcon className='size-4' />
                  )}
                </Button>
              </CollapsibleTrigger>
              {isEditing ? (
                <Input
                  value={draft?.name || ''}
                  onChange={(e) => updateDraft('name', e.target.value)}
                  className='max-w-xs font-semibold text-lg bg-background'
                  placeholder='Provider 名称'
                />
              ) : (
                <h2 className='font-semibold text-lg'>{provider.name}</h2>
              )}
              <Badge variant='secondary' className='ml-2'>
                {t('model_count', { count: provider.models.length })}
              </Badge>
              <Badge variant='outline' className='ml-1 capitalize'>
                {provider.provider_type}
              </Badge>
              {provider.use_proxy && (
                <Badge variant='outline' className='ml-1'>
                  {t('using_proxy')}
                </Badge>
              )}
              {provider.is_active && (
                <Badge
                  variant='destructive'
                  className='ml-1 bg-green-500 text-white'
                >
                  {t('active')}
                </Badge>
              )}
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-2'>
                <span className='text-sm text-muted-foreground'>
                  {t('active')}
                </span>
                <Switch
                  checked={provider.is_active}
                  onCheckedChange={toggleActive}
                />
              </div>
              {isEditing ? (
                <>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={saveProvider}
                    className='gap-2 bg-transparent'
                  >
                    <SaveIcon className='size-4' />
                    {t('save')}
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={cancelEdit}
                    className='gap-2 bg-transparent'
                  >
                    <XIcon className='size-4' />
                    {t('cancel')}
                  </Button>
                </>
              ) : (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={startEditing}
                  className='gap-2'
                >
                  <Edit2Icon className='size-4' />
                  {t('edit')}
                </Button>
              )}
              <Button
                variant='ghost'
                size='sm'
                onClick={deleteProvider}
                className='text-destructive hover:text-destructive'
              >
                <Trash2Icon className='size-4' />
              </Button>
            </div>
          </div>

          <CollapsibleContent>
            <div className='space-y-4 mb-6 pl-11'>
              {isEditing ? (
                <ProviderEditForm
                  provider={provider}
                  draft={draft}
                  showApiKey={showApiKey}
                  onToggleApiKey={() => setShowApiKey((v) => !v)}
                  onUpdateDraft={updateDraft}
                />
              ) : (
                <ProviderReadView provider={provider} />
              )}
            </div>
            <ProviderModelsSection provider={provider} />
          </CollapsibleContent>
        </div>
      </Collapsible>
    </Card>
  )
}

interface ProviderEditFormProps {
  provider: LLMProviderPublic
  draft: LLMProviderUpdate | null
  showApiKey: boolean
  onToggleApiKey: () => void
  // biome-ignore lint/suspicious/noExplicitAny: field value can be any provider field type
  onUpdateDraft: (field: keyof LLMProviderUpdate, value: any) => void
}

function ProviderEditForm({
  provider,
  draft,
  showApiKey,
  onToggleApiKey,
  onUpdateDraft,
}: ProviderEditFormProps) {
  const t = useTranslations('setting.llm_setting')
  return (
    <>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor={`provider-type-${provider.id}`}>
            {t('provider_type')}
          </Label>
          <Select
            value={draft?.provider_type}
            onValueChange={(value) =>
              onUpdateDraft('provider_type', value as ProviderType)
            }
          >
            <SelectTrigger
              id={`provider-type-${provider.id}`}
              className='bg-background'
            >
              <SelectValue placeholder={t('select_type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='openai'>OpenAI</SelectItem>
              <SelectItem value='anthropic'>Anthropic</SelectItem>
              <SelectItem value='google'>Google</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <Label htmlFor={`baseurl-${provider.id}`}>Base URL</Label>
          <Input
            id={`baseurl-${provider.id}`}
            value={draft?.base_url || ''}
            onChange={(e) => onUpdateDraft('base_url', e.target.value)}
            placeholder='https://api.provider.com/v1'
            className='font-mono text-sm bg-background'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor={`apikey-${provider.id}`}>API Key</Label>
          <div className='relative'>
            <Input
              id={`apikey-${provider.id}`}
              type={showApiKey ? 'text' : 'password'}
              value={draft?.api_key || ''}
              onChange={(e) => onUpdateDraft('api_key', e.target.value)}
              placeholder='sk-...'
              className='font-mono text-sm pr-10 bg-background'
            />
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='absolute right-1 top-1/2 -translate-y-1/2 size-7 p-0'
              onClick={onToggleApiKey}
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
      <div className='flex items-center justify-between max-w-md'>
        <div className='space-y-0.5'>
          <Label htmlFor={`proxy-${provider.id}`}>{t('use_proxy')}</Label>
          <p className='text-xs text-muted-foreground'>{t('use_proxy_desc')}</p>
        </div>
        <Switch
          id={`proxy-${provider.id}`}
          checked={draft?.use_proxy}
          onCheckedChange={(checked) => onUpdateDraft('use_proxy', checked)}
        />
      </div>
      <div className='flex items-center justify-between max-w-md'>
        <div className='space-y-0.5'>
          <Label htmlFor={`active-${provider.id}`}>
            {t('enable_provider')}
          </Label>
          <p className='text-xs text-muted-foreground'>
            {t('enable_provider_desc')}
          </p>
        </div>
        <Switch
          id={`active-${provider.id}`}
          checked={draft?.is_active}
          onCheckedChange={(checked) => onUpdateDraft('is_active', checked)}
        />
      </div>
    </>
  )
}

function ProviderReadView({ provider }: { provider: LLMProviderPublic }) {
  const t = useTranslations('setting.llm_setting')
  return (
    <div className='space-y-3 text-sm'>
      <div className='flex items-start gap-8'>
        <div className='space-y-1 min-w-[120px]'>
          <p className='text-muted-foreground'>{t('provider_type')}</p>
          <p className='capitalize'>{provider.provider_type}</p>
        </div>
        <div className='space-y-1 min-w-[120px]'>
          <p className='text-muted-foreground'>Base URL</p>
          <p className='font-mono'>
            {provider.base_url || t('base_url_not_set')}
          </p>
        </div>
        <div className='space-y-1 min-w-[120px]'>
          <p className='text-muted-foreground'>API Key</p>
          <p className='font-mono'>
            {provider.api_key
              ? `••••••••${provider.api_key.slice(-4)}`
              : t('base_url_not_set')}
          </p>
        </div>
        <div className='space-y-1 min-w-[120px]'>
          <p className='text-muted-foreground'>{t('network_proxy')}</p>
          <p>{provider.use_proxy ? t('proxy_enabled') : t('proxy_disabled')}</p>
        </div>
        <div className='space-y-1 min-w-[120px]'>
          <p className='text-muted-foreground'>{t('active_status')}</p>
          <p>
            {provider.is_active ? t('provider_active') : t('provider_inactive')}
          </p>
        </div>
      </div>
    </div>
  )
}

function ProviderModelsSection({ provider }: { provider: LLMProviderPublic }) {
  const t = useTranslations('setting.llm_setting')
  return (
    <div className='pl-11 space-y-4'>
      <div className='flex justify-between items-center mb-4'>
        <h4 className='text-sm font-medium'>{t('model_list')}</h4>
        <AddModelDialog providerId={provider.id} providerName={provider.name} />
      </div>
      <div className='space-y-3'>
        {provider.models.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}
        {provider.models.length === 0 && (
          <div className='text-center py-8 text-muted-foreground text-sm'>
            {t('no_models')}
          </div>
        )}
      </div>
    </div>
  )
}
