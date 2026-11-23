'use client'

import { Loader2Icon, PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { useCreateLLMProvider } from '@/hooks/use-setting'
import type {
  LLMProviderCreate,
  LLMProviderPublic,
  ProviderType,
} from '@/types/setting'

const defaultProvider: LLMProviderCreate = {
  name: '',
  provider_type: 'openai',
  base_url: '',
  api_key: '',
  use_proxy: false,
  is_active: true,
}

interface AddProviderDialogProps {
  triggerVariant?: 'button' | 'icon'
  onCreated?: (provider: LLMProviderPublic) => void
}

export function AddProviderDialog({
  triggerVariant = 'button',
  onCreated,
}: AddProviderDialogProps) {
  const t = useTranslations('setting.llm_setting')
  const createProviderMutation = useCreateLLMProvider()

  const [open, setOpen] = useState(false)
  const [newProvider, setNewProvider] =
    useState<LLMProviderCreate>(defaultProvider)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setNewProvider(defaultProvider)
    }
  }

  const canSubmit =
    !!newProvider.name.trim() &&
    !!newProvider.api_key.trim() &&
    !createProviderMutation.isPending

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    const trimmedBaseUrl = newProvider.base_url?.trim()
    try {
      const created = await createProviderMutation.mutateAsync({
        name: newProvider.name.trim(),
        provider_type: newProvider.provider_type,
        base_url: trimmedBaseUrl || undefined,
        api_key: newProvider.api_key.trim(),
        use_proxy: newProvider.use_proxy,
        is_active: newProvider.is_active,
      })
      toast.success(t('provider_created'))
      handleOpenChange(false)
      onCreated?.(created)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('provider_create_failed'),
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerVariant === 'icon' ? (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-7'
            aria-label={t('add_provider')}
          >
            <PlusIcon className='size-4' />
          </Button>
        ) : (
          <Button type='button'>
            <PlusIcon className='size-4' />
            {t('add_provider')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>{t('add_provider_title')}</DialogTitle>
          <DialogDescription>{t('add_provider_desc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='new-provider-name'>{t('provider_name')}</Label>
              <Input
                id='new-provider-name'
                value={newProvider.name}
                disabled={createProviderMutation.isPending}
                onChange={(e) =>
                  setNewProvider((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder='OpenAI, Anthropic, etc.'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='new-provider-type'>{t('provider_type')}</Label>
              <Select
                value={newProvider.provider_type}
                disabled={createProviderMutation.isPending}
                onValueChange={(value) =>
                  setNewProvider((prev) => ({
                    ...prev,
                    provider_type: value as ProviderType,
                  }))
                }
              >
                <SelectTrigger id='new-provider-type' className='w-full'>
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
          </div>
          <div className='space-y-2'>
            <Label htmlFor='new-provider-baseurl'>Base URL</Label>
            <Input
              id='new-provider-baseurl'
              value={newProvider.base_url}
              disabled={createProviderMutation.isPending}
              onChange={(e) =>
                setNewProvider((prev) => ({
                  ...prev,
                  base_url: e.target.value,
                }))
              }
              placeholder='https://api.provider.com/v1'
              className='font-mono text-sm'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='new-provider-apikey'>API Key</Label>
            <Input
              id='new-provider-apikey'
              type='password'
              autoComplete='new-password'
              value={newProvider.api_key}
              disabled={createProviderMutation.isPending}
              onChange={(e) =>
                setNewProvider((prev) => ({ ...prev, api_key: e.target.value }))
              }
              placeholder='sk-...'
              className='font-mono text-sm'
            />
          </div>
          <div className='flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5'>
            <div className='space-y-0.5'>
              <Label htmlFor='new-provider-proxy'>{t('use_proxy')}</Label>
              <p className='text-xs text-muted-foreground'>
                {t('use_proxy_desc')}
              </p>
            </div>
            <Switch
              id='new-provider-proxy'
              checked={newProvider.use_proxy}
              disabled={createProviderMutation.isPending}
              onCheckedChange={(checked) =>
                setNewProvider((prev) => ({ ...prev, use_proxy: checked }))
              }
            />
          </div>
          <div className='flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5'>
            <div className='space-y-0.5'>
              <Label htmlFor='new-provider-active'>
                {t('enable_provider')}
              </Label>
              <p className='text-xs text-muted-foreground'>
                {t('enable_provider_desc')}
              </p>
            </div>
            <Switch
              id='new-provider-active'
              checked={newProvider.is_active}
              disabled={createProviderMutation.isPending}
              onCheckedChange={(checked) =>
                setNewProvider((prev) => ({ ...prev, is_active: checked }))
              }
            />
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              disabled={createProviderMutation.isPending}
              onClick={() => handleOpenChange(false)}
            >
              {t('cancel')}
            </Button>
            <Button type='submit' disabled={!canSubmit}>
              {createProviderMutation.isPending && (
                <Loader2Icon className='size-4 animate-spin' />
              )}
              {createProviderMutation.isPending ? t('adding') : t('add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
