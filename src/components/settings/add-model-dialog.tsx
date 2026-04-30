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
import { Textarea } from '@/components/ui/textarea'
import { useCreateLLMModel } from '@/hooks/use-setting'
import type { LLMModelCreate } from '@/types/setting'

interface AddModelDialogProps {
  providerId: number
  providerName: string
}

const defaultModel: Omit<LLMModelCreate, 'provider_id'> = {
  name: '',
  input_price: 0,
  output_price: 0,
  cache_read_price: 0,
  extra_body: {},
  is_active: true,
}

export function AddModelDialog({
  providerId,
  providerName,
}: AddModelDialogProps) {
  const t = useTranslations('setting.llm_setting')
  const createModelMutation = useCreateLLMModel()

  const [open, setOpen] = useState(false)
  const [newModel, setNewModel] =
    useState<Omit<LLMModelCreate, 'provider_id'>>(defaultModel)
  const [extraBodyText, setExtraBodyText] = useState('')
  const [extraBodyError, setExtraBodyError] = useState(false)

  const handleAdd = async () => {
    let parsedExtraBody = {}
    if (extraBodyText.trim()) {
      try {
        parsedExtraBody = JSON.parse(extraBodyText)
      } catch {
        setExtraBodyError(true)
        return
      }
    }
    await createModelMutation.mutateAsync({
      provider_id: providerId,
      name: newModel.name,
      input_price: Number(newModel.input_price),
      output_price: Number(newModel.output_price),
      cache_read_price: Number(newModel.cache_read_price),
      extra_body: parsedExtraBody,
      is_active: newModel.is_active,
    })
    setOpen(false)
    setNewModel(defaultModel)
    setExtraBodyText('')
    setExtraBodyError(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' className='gap-2'>
          <PlusIcon className='h-3 w-3' />
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
            <Label htmlFor='new-model-name'>{t('model_name')}</Label>
            <Input
              id='new-model-name'
              value={newModel.name}
              onChange={(e) =>
                setNewModel({ ...newModel, name: e.target.value })
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
                value={newModel.input_price}
                onChange={(e) =>
                  setNewModel({
                    ...newModel,
                    input_price: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='new-model-output'>{t('output_price')}</Label>
              <Input
                id='new-model-output'
                type='number'
                step='0.0001'
                value={newModel.output_price}
                onChange={(e) =>
                  setNewModel({
                    ...newModel,
                    output_price: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='new-model-cache'>{t('cache_price')}</Label>
              <Input
                id='new-model-cache'
                type='number'
                step='0.0001'
                value={newModel.cache_read_price}
                onChange={(e) =>
                  setNewModel({
                    ...newModel,
                    cache_read_price: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='new-model-extra-body'>{t('extra_body')}</Label>
            <Textarea
              id='new-model-extra-body'
              value={extraBodyText}
              onChange={(e) => {
                setExtraBodyText(e.target.value)
                setExtraBodyError(false)
              }}
              placeholder='{}'
              className='font-mono text-sm min-h-[80px] resize-y'
            />
            {extraBodyError && (
              <p className='text-xs text-destructive'>
                {t('extra_body_invalid')}
              </p>
            )}
            <p className='text-xs text-muted-foreground'>
              {t('extra_body_desc')}
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
                setNewModel({ ...newModel, is_active: checked })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleAdd} disabled={!newModel.name}>
            {t('add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
