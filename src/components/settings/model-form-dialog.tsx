'use client'

import { Loader2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type FormEvent, type ReactNode, useState } from 'react'
import { toast } from 'sonner'
import { ReasoningEffortSelect } from '@/components/settings/reasoning-effort-select'
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
import { useCreateLLMModel, useUpdateLLMModel } from '@/hooks/use-setting'
import type {
  LLMModelPublic,
  ProviderType,
  ReasoningEffort,
} from '@/types/setting'

interface ModelFormState {
  displayName: string
  name: string
  inputPrice: string
  outputPrice: string
  cacheReadPrice: string
  contextWindow: string
  reasoningEffort: ReasoningEffort | null
  isActive: boolean
}

function initialFormState(model?: LLMModelPublic): ModelFormState {
  return {
    displayName: model?.display_name ?? '',
    name: model?.name ?? '',
    inputPrice: model ? model.input_price.toString() : '',
    outputPrice: model ? model.output_price.toString() : '',
    cacheReadPrice: model ? model.cache_read_price.toString() : '',
    contextWindow:
      model?.context_window != null ? model.context_window.toString() : '',
    reasoningEffort: model?.reasoning_effort ?? null,
    isActive: model?.is_active ?? true,
  }
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

interface ModelFormDialogProps {
  providerId: number
  providerName: string
  providerType: ProviderType
  providerBaseUrl?: string | null
  model?: LLMModelPublic
  trigger: ReactNode
  onSaved?: () => void
}

export function ModelFormDialog({
  providerId,
  providerName,
  providerType,
  providerBaseUrl,
  model,
  trigger,
  onSaved,
}: ModelFormDialogProps) {
  const t = useTranslations('setting.llm_setting')
  const createModelMutation = useCreateLLMModel()
  const updateModelMutation = useUpdateLLMModel()
  const isEdit = !!model
  const saving = createModelMutation.isPending || updateModelMutation.isPending

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ModelFormState>(() =>
    initialFormState(model),
  )

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setForm(initialFormState(model))
    }
  }

  const canSubmit = !!form.displayName.trim() && !!form.name.trim() && !saving
  const idPrefix = model ? `edit-model-${model.id}` : `new-model-${providerId}`

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    const displayName = form.displayName.trim()
    const name = form.name.trim()
    const inputPrice = parseOptionalNumber(form.inputPrice)
    const outputPrice = parseOptionalNumber(form.outputPrice)
    const cacheReadPrice = parseOptionalNumber(form.cacheReadPrice)
    const parsedContextWindow = parseOptionalNumber(form.contextWindow)
    const contextWindow =
      parsedContextWindow !== undefined
        ? Math.trunc(parsedContextWindow)
        : isEdit
          ? null
          : undefined

    try {
      if (model) {
        await updateModelMutation.mutateAsync({
          id: model.id,
          data: {
            display_name: displayName,
            name,
            input_price: inputPrice,
            output_price: outputPrice,
            cache_read_price: cacheReadPrice,
            context_window: contextWindow,
            reasoning_effort: form.reasoningEffort,
          },
        })
        toast.success(t('model_saved'))
      } else {
        await createModelMutation.mutateAsync({
          provider_id: providerId,
          display_name: displayName,
          name,
          input_price: inputPrice,
          output_price: outputPrice,
          cache_read_price: cacheReadPrice,
          context_window: contextWindow,
          reasoning_effort: form.reasoningEffort,
          is_active: form.isActive,
        })
        toast.success(t('model_created'))
      }
      setOpen(false)
      onSaved?.()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t(isEdit ? 'model_save_failed' : 'model_create_failed'),
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('edit_model_title') : t('add_model_title')}
          </DialogTitle>
          <DialogDescription>
            {t(isEdit ? 'edit_model_desc' : 'add_model_desc', {
              name: providerName,
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor={`${idPrefix}-display-name`}>
                {t('model_display_name')}
              </Label>
              <Input
                id={`${idPrefix}-display-name`}
                value={form.displayName}
                disabled={saving}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, displayName: e.target.value }))
                }
                placeholder='GPT-5, Claude Sonnet, etc.'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor={`${idPrefix}-api-name`}>
                {t('model_api_name')}
              </Label>
              <Input
                id={`${idPrefix}-api-name`}
                value={form.name}
                disabled={saving}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder='gpt-4o, claude-sonnet-4-5, etc.'
                className='font-mono text-sm'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <div className='grid gap-3 sm:grid-cols-3'>
              <div className='space-y-1.5'>
                <Label htmlFor={`${idPrefix}-input-price`}>
                  {t('input_price')}
                </Label>
                <Input
                  id={`${idPrefix}-input-price`}
                  type='number'
                  step='0.0001'
                  value={form.inputPrice}
                  disabled={saving}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, inputPrice: e.target.value }))
                  }
                  className='tabular-nums'
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor={`${idPrefix}-output-price`}>
                  {t('output_price')}
                </Label>
                <Input
                  id={`${idPrefix}-output-price`}
                  type='number'
                  step='0.0001'
                  value={form.outputPrice}
                  disabled={saving}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      outputPrice: e.target.value,
                    }))
                  }
                  className='tabular-nums'
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor={`${idPrefix}-cache-price`}>
                  {t('cache_price')}
                </Label>
                <Input
                  id={`${idPrefix}-cache-price`}
                  type='number'
                  step='0.0001'
                  value={form.cacheReadPrice}
                  disabled={saving}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      cacheReadPrice: e.target.value,
                    }))
                  }
                  className='tabular-nums'
                />
              </div>
            </div>
            {!isEdit && (
              <p className='text-xs text-muted-foreground'>
                {t('model_pricing_hint')}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-1.5'>
                <Label htmlFor={`${idPrefix}-context-window`}>
                  {t('context_window')}
                </Label>
                <Input
                  id={`${idPrefix}-context-window`}
                  type='number'
                  min={1}
                  step={1}
                  value={form.contextWindow}
                  disabled={saving}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      contextWindow: e.target.value,
                    }))
                  }
                  className='tabular-nums'
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor={`${idPrefix}-reasoning-effort`}>
                  {t('reasoning_effort')}
                </Label>
                <ReasoningEffortSelect
                  id={`${idPrefix}-reasoning-effort`}
                  providerType={providerType}
                  providerName={providerName}
                  providerBaseUrl={providerBaseUrl ?? undefined}
                  value={form.reasoningEffort}
                  onValueChange={(reasoningEffort) =>
                    setForm((prev) => ({ ...prev, reasoningEffort }))
                  }
                  className='w-full'
                />
              </div>
            </div>
            <p className='text-xs text-muted-foreground'>
              {t('reasoning_effort_desc')}
            </p>
          </div>

          {!isEdit && (
            <div className='flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5'>
              <div className='space-y-0.5'>
                <Label htmlFor={`${idPrefix}-active`}>
                  {t('enable_model')}
                </Label>
                <p className='text-xs text-muted-foreground'>
                  {t('enable_model_desc')}
                </p>
              </div>
              <Switch
                id={`${idPrefix}-active`}
                checked={form.isActive}
                disabled={saving}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              disabled={saving}
              onClick={() => setOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button type='submit' disabled={!canSubmit}>
              {saving && <Loader2Icon className='size-4 animate-spin' />}
              {saving
                ? isEdit
                  ? t('saving')
                  : t('adding')
                : isEdit
                  ? t('save')
                  : t('add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
