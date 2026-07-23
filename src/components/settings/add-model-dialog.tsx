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
import { Switch } from '@/components/ui/switch'
import { useCreateLLMModel } from '@/hooks/use-setting'
import type { LLMModelCreate, ProviderType } from '@/types/setting'
import { ReasoningEffortSelect } from './reasoning-effort-select'

interface AddModelDialogProps {
  providerId: number
  providerName: string
  providerType: ProviderType
  providerBaseUrl?: string
}

const defaultModel: Omit<LLMModelCreate, 'provider_id'> = {
  display_name: '',
  name: '',
  reasoning_effort: null,
  is_active: true,
}

function parseOptionalPrice(value: string): number | undefined {
  return value === '' ? undefined : Number(value)
}

export function AddModelDialog({
  providerId,
  providerName,
  providerType,
  providerBaseUrl,
}: AddModelDialogProps) {
  const t = useTranslations('setting.llm_setting')
  const createModelMutation = useCreateLLMModel()

  const [open, setOpen] = useState(false)
  const [newModel, setNewModel] =
    useState<Omit<LLMModelCreate, 'provider_id'>>(defaultModel)

  const handleAdd = async () => {
    await createModelMutation.mutateAsync({
      provider_id: providerId,
      display_name: newModel.display_name,
      name: newModel.name,
      input_price: newModel.input_price,
      output_price: newModel.output_price,
      cache_read_price: newModel.cache_read_price,
      reasoning_effort: newModel.reasoning_effort,
      is_active: newModel.is_active,
    })
    setOpen(false)
    setNewModel(defaultModel)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' className='gap-2'>
          <PlusIcon className='size-3' />
          {t('add_model')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('add_model_title')}</DialogTitle>
          <DialogDescription>
            {t('add_model_desc', { name: providerName })}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='new-model-display-name'>
              {t('model_display_name')}
            </Label>
            <Input
              id='new-model-display-name'
              value={newModel.display_name}
              onChange={(e) =>
                setNewModel((prev) => ({
                  ...prev,
                  display_name: e.target.value,
                }))
              }
              placeholder='GPT-5, Claude Sonnet, etc.'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='new-model-name'>{t('model_api_name')}</Label>
            <Input
              id='new-model-name'
              value={newModel.name}
              onChange={(e) =>
                setNewModel((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder='gpt-4, claude-3-opus, etc.'
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='new-model-input'>{t('input_price')}</Label>
              <Input
                id='new-model-input'
                type='number'
                step='0.0001'
                value={newModel.input_price ?? ''}
                onChange={(e) =>
                  setNewModel((prev) => ({
                    ...prev,
                    input_price: parseOptionalPrice(e.target.value),
                  }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='new-model-output'>{t('output_price')}</Label>
              <Input
                id='new-model-output'
                type='number'
                step='0.0001'
                value={newModel.output_price ?? ''}
                onChange={(e) =>
                  setNewModel((prev) => ({
                    ...prev,
                    output_price: parseOptionalPrice(e.target.value),
                  }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='new-model-cache'>{t('cache_price')}</Label>
              <Input
                id='new-model-cache'
                type='number'
                step='0.0001'
                value={newModel.cache_read_price ?? ''}
                onChange={(e) =>
                  setNewModel((prev) => ({
                    ...prev,
                    cache_read_price: parseOptionalPrice(e.target.value),
                  }))
                }
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='new-model-reasoning-effort'>
              {t('reasoning_effort')}
            </Label>
            <ReasoningEffortSelect
              id='new-model-reasoning-effort'
              providerType={providerType}
              providerName={providerName}
              providerBaseUrl={providerBaseUrl}
              value={newModel.reasoning_effort}
              onValueChange={(reasoningEffort) =>
                setNewModel((prev) => ({
                  ...prev,
                  reasoning_effort: reasoningEffort,
                }))
              }
              className='w-full'
            />
            <p className='text-xs text-muted-foreground'>
              {t('reasoning_effort_desc')}
            </p>
          </div>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='new-model-active'>{t('enable_model')}</Label>
              <p className='text-xs text-muted-foreground'>
                {t('enable_model_desc')}
              </p>
            </div>
            <Switch
              id='new-model-active'
              checked={newModel.is_active}
              onCheckedChange={(checked) =>
                setNewModel((prev) => ({ ...prev, is_active: checked }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!newModel.display_name.trim() || !newModel.name.trim()}
          >
            {t('add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
