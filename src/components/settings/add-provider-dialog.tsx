'use client'

import { PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
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
import type { LLMProviderCreate, ProviderType } from '@/types/setting'

const defaultProvider: LLMProviderCreate = {
  name: '',
  provider_type: 'openai',
  base_url: '',
  api_key: '',
  use_proxy: false,
  is_active: true,
}

export function AddProviderDialog() {
  const t = useTranslations('setting.llm_setting')
  const createProviderMutation = useCreateLLMProvider()

  const [open, setOpen] = useState(false)
  const [newProvider, setNewProvider] =
    useState<LLMProviderCreate>(defaultProvider)

  const handleAdd = async () => {
    if (!newProvider.name) return
    await createProviderMutation.mutateAsync(newProvider)
    setOpen(false)
    setNewProvider(defaultProvider)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='gap-2'>
          <PlusIcon className='size-4' />
          {t('add_provider')}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>{t('add_provider_title')}</DialogTitle>
          <DialogDescription>{t('add_provider_desc')}</DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='new-provider-name'>{t('provider_name')}</Label>
            <Input
              id='new-provider-name'
              value={newProvider.name}
              onChange={(e) =>
                setNewProvider({ ...newProvider, name: e.target.value })
              }
              placeholder='OpenAI, Anthropic, etc.'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='new-provider-type'>{t('provider_type')}</Label>
            <Select
              value={newProvider.provider_type}
              onValueChange={(value) =>
                setNewProvider({
                  ...newProvider,
                  provider_type: value as ProviderType,
                })
              }
            >
              <SelectTrigger id='new-provider-type'>
                <SelectValue placeholder={t('select_type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={'openai'}>OpenAI</SelectItem>
                <SelectItem value={'anthropic'}>Anthropic</SelectItem>
                <SelectItem value={'google'}>Google</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='new-provider-baseurl'>Base URL</Label>
            <Input
              id='new-provider-baseurl'
              value={newProvider.base_url}
              onChange={(e) =>
                setNewProvider({ ...newProvider, base_url: e.target.value })
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
              value={newProvider.api_key || ''}
              onChange={(e) =>
                setNewProvider({ ...newProvider, api_key: e.target.value })
              }
              placeholder='sk-...'
              className='font-mono text-sm'
            />
          </div>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='new-provider-proxy'>{t('use_proxy')}</Label>
              <p className='text-xs text-muted-foreground'>
                {t('use_proxy_desc')}
              </p>
            </div>
            <Switch
              id='new-provider-proxy'
              checked={newProvider.use_proxy}
              onCheckedChange={(checked) =>
                setNewProvider({ ...newProvider, use_proxy: checked })
              }
            />
          </div>
          <div className='flex items-center justify-between'>
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
              onCheckedChange={(checked) =>
                setNewProvider({ ...newProvider, is_active: checked })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleAdd} disabled={!newProvider.name}>
            {t('add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
