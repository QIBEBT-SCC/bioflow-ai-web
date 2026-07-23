'use client'

import { Edit2Icon, SaveIcon, Trash2Icon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useDeleteLLMModel, useUpdateLLMModel } from '@/hooks/use-setting'
import type {
  LLMModelPublic,
  LLMModelUpdate,
  ProviderType,
} from '@/types/setting'
import { ReasoningEffortSelect } from './reasoning-effort-select'

interface ModelCardProps {
  model: LLMModelPublic
  providerType: ProviderType
  providerName: string
  providerBaseUrl?: string
}

export function ModelCard({
  model,
  providerType,
  providerName,
  providerBaseUrl,
}: ModelCardProps) {
  const t = useTranslations('setting.llm_setting')
  const updateModelMutation = useUpdateLLMModel()
  const deleteModelMutation = useDeleteLLMModel()

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<LLMModelUpdate | null>(null)

  const startEditing = () => {
    setDraft({
      display_name: model.display_name,
      name: model.name,
      input_price: model.input_price,
      output_price: model.output_price,
      cache_read_price: model.cache_read_price,
      reasoning_effort: model.reasoning_effort,
      is_active: model.is_active,
    })
    setIsEditing(true)
  }

  const saveModel = async () => {
    if (!draft) return
    await updateModelMutation.mutateAsync({
      id: model.id,
      data: draft,
    })
    setIsEditing(false)
    setDraft(null)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setDraft(null)
  }

  const deleteModel = async () => {
    await deleteModelMutation.mutateAsync(model.id)
  }

  const toggleActive = async (checked: boolean) => {
    await updateModelMutation.mutateAsync({
      id: model.id,
      data: { is_active: checked },
    })
  }

  // biome-ignore lint/suspicious/noExplicitAny: no need
  const updateDraft = (field: keyof LLMModelUpdate, value: any) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  return (
    <Card className='border bg-muted/30 pt-2'>
      <div className='p-4'>
        <div className='flex items-start justify-between gap-3 mb-3'>
          <div className='flex min-w-0 items-center gap-3'>
            {isEditing ? (
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                <div className='space-y-1'>
                  <Label
                    htmlFor={`display-name-${model.id}`}
                    className='text-xs'
                  >
                    {t('model_display_name')}
                  </Label>
                  <Input
                    id={`display-name-${model.id}`}
                    value={draft?.display_name || ''}
                    onChange={(e) =>
                      updateDraft('display_name', e.target.value)
                    }
                    className='h-8 w-[180px] text-sm bg-background'
                  />
                </div>
                <div className='space-y-1'>
                  <Label htmlFor={`api-name-${model.id}`} className='text-xs'>
                    {t('model_api_name')}
                  </Label>
                  <Input
                    id={`api-name-${model.id}`}
                    value={draft?.name || ''}
                    onChange={(e) => updateDraft('name', e.target.value)}
                    className='h-8 w-[180px] font-mono text-sm bg-background'
                  />
                </div>
              </div>
            ) : (
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>
                  {model.display_name}
                </p>
                <Badge
                  variant='secondary'
                  className='mt-1 max-w-full truncate font-mono text-xs'
                >
                  {model.name}
                </Badge>
              </div>
            )}
            <div className='flex items-center gap-2'>
              <span className='text-xs text-muted-foreground'>
                {t('active')}
              </span>
              <Switch
                checked={model.is_active}
                onCheckedChange={toggleActive}
              />
            </div>
          </div>
          <div className='flex items-center gap-1'>
            {isEditing ? (
              <>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={saveModel}
                  className='h-8 gap-2 bg-transparent'
                >
                  <SaveIcon className='size-3' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={cancelEdit}
                  className='h-8 gap-2 bg-transparent'
                >
                  <XIcon className='size-3' />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={startEditing}
                  className='h-8'
                >
                  <Edit2Icon className='size-3' />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={deleteModel}
                  className='h-8 text-destructive hover:text-destructive'
                >
                  <Trash2Icon className='size-3' />
                </Button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className='space-y-3'>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
              <div className='space-y-1'>
                <Label htmlFor={`input-price-${model.id}`} className='text-xs'>
                  Input ($/1M)
                </Label>
                <Input
                  id={`input-price-${model.id}`}
                  type='number'
                  step='0.0001'
                  value={draft?.input_price ?? 0}
                  onChange={(e) =>
                    updateDraft('input_price', Number(e.target.value))
                  }
                  className='h-8 text-xs bg-background'
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor={`output-price-${model.id}`} className='text-xs'>
                  Output ($/1M)
                </Label>
                <Input
                  id={`output-price-${model.id}`}
                  type='number'
                  step='0.0001'
                  value={draft?.output_price ?? 0}
                  onChange={(e) =>
                    updateDraft('output_price', Number(e.target.value))
                  }
                  className='h-8 text-xs bg-background'
                />
              </div>
              <div className='space-y-1'>
                <Label
                  htmlFor={`cache-read-price-${model.id}`}
                  className='text-xs'
                >
                  Cache Read ($/1M)
                </Label>
                <Input
                  id={`cache-read-price-${model.id}`}
                  type='number'
                  step='0.0001'
                  value={draft?.cache_read_price ?? 0}
                  onChange={(e) =>
                    updateDraft('cache_read_price', Number(e.target.value))
                  }
                  className='h-8 text-xs bg-background'
                />
              </div>
              <div className='flex items-center gap-2 pt-4'>
                <Label htmlFor={`model-active-${model.id}`} className='text-xs'>
                  {t('active')}
                </Label>
                <Switch
                  id={`model-active-${model.id}`}
                  checked={draft?.is_active}
                  onCheckedChange={(checked) =>
                    updateDraft('is_active', checked)
                  }
                />
              </div>
              <div className='space-y-1'>
                <Label
                  htmlFor={`reasoning-effort-${model.id}`}
                  className='text-xs'
                >
                  {t('reasoning_effort')}
                </Label>
                <ReasoningEffortSelect
                  id={`reasoning-effort-${model.id}`}
                  providerType={providerType}
                  providerName={providerName}
                  providerBaseUrl={providerBaseUrl}
                  value={draft?.reasoning_effort}
                  onValueChange={(reasoningEffort) =>
                    updateDraft('reasoning_effort', reasoningEffort)
                  }
                  className='h-8 w-full bg-background text-xs'
                />
              </div>
            </div>
            <p className='text-xs text-muted-foreground'>
              {t('reasoning_effort_desc')}
            </p>
          </div>
        ) : (
          <div className='space-y-3 text-sm'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='space-y-1'>
                <p className='text-xs text-muted-foreground'>Input Price</p>
                <p className='font-medium'>${model.input_price}/1M tokens</p>
              </div>
              <div className='space-y-1'>
                <p className='text-xs text-muted-foreground'>Output Price</p>
                <p className='font-medium'>${model.output_price}/1M tokens</p>
              </div>
              <div className='space-y-1'>
                <p className='text-xs text-muted-foreground'>
                  Cache Read Price
                </p>
                <p className='font-medium'>
                  ${model.cache_read_price}/1M tokens
                </p>
              </div>
              <div className='space-y-1'>
                <p className='text-xs text-muted-foreground'>
                  {t('reasoning_effort')}
                </p>
                <p className='font-medium'>
                  {model.reasoning_effort
                    ? t(`reasoning_effort_${model.reasoning_effort}`)
                    : t('reasoning_effort_default')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
