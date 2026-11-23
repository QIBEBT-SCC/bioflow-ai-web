'use client'

import { cn } from 'cn'
import {
  CheckCircle2Icon,
  Edit2Icon,
  Loader2Icon,
  SaveIcon,
  SendIcon,
  Trash2Icon,
  XCircleIcon,
  XIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  useDeleteLLMModel,
  useTestLLMModel,
  useUpdateLLMModel,
} from '@/hooks/use-setting'
import { statusToneClasses } from '@/lib/status'
import { formatTokenCount } from '@/lib/token-format'
import type {
  LLMModelPublic,
  LLMModelTestResult,
  LLMModelUpdate,
  ProviderType,
} from '@/types/setting'
import { ReasoningEffortSelect } from './reasoning-effort-select'

function formatLatency(latencyMs: number): string {
  return latencyMs < 1000
    ? `${latencyMs} ms`
    : `${(latencyMs / 1000).toFixed(2)} s`
}

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
  const testModelMutation = useTestLLMModel()

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<LLMModelUpdate | null>(null)
  const [testResult, setTestResult] = useState<LLMModelTestResult | null>(null)

  const startEditing = () => {
    setDraft({
      display_name: model.display_name,
      name: model.name,
      input_price: model.input_price,
      output_price: model.output_price,
      cache_read_price: model.cache_read_price,
      context_window: model.context_window,
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
    setTestResult(null)
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

  const handleTestModel = async () => {
    try {
      const result = await testModelMutation.mutateAsync(model.id)
      setTestResult(result)
      if (result.available) {
        toast.success(
          t('test_success_toast', {
            name: model.display_name,
            latency: formatLatency(result.latency_ms),
          }),
        )
      } else {
        toast.error(t('test_unavailable_toast', { name: model.display_name }), {
          description: result.error ?? undefined,
        })
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('test_request_failed')
      setTestResult({
        model_id: model.id,
        model_name: model.name,
        provider_name: providerName,
        available: false,
        latency_ms: 0,
        response_text: null,
        error: message,
      })
      toast.error(message)
    }
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
    <Card className='bg-muted/30 pt-2'>
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
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleTestModel}
                  disabled={testModelMutation.isPending}
                  className='h-8 bg-background'
                >
                  {testModelMutation.isPending ? (
                    <Loader2Icon className='size-3.5 animate-spin' />
                  ) : (
                    <SendIcon className='size-3.5' />
                  )}
                  {testModelMutation.isPending
                    ? t('testing_model')
                    : t('test_model')}
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={startEditing}
                  disabled={testModelMutation.isPending}
                  aria-label={t('edit')}
                  className='h-8'
                >
                  <Edit2Icon className='size-3' />
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={deleteModel}
                  disabled={
                    testModelMutation.isPending || deleteModelMutation.isPending
                  }
                  aria-label={t('delete_model')}
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
              <div className='space-y-1'>
                <Label
                  htmlFor={`context-window-${model.id}`}
                  className='text-xs'
                >
                  {t('context_window')}
                </Label>
                <Input
                  id={`context-window-${model.id}`}
                  type='number'
                  min={1}
                  step={1}
                  value={draft?.context_window ?? ''}
                  onChange={(e) =>
                    updateDraft(
                      'context_window',
                      e.target.value === '' ? null : Number(e.target.value),
                    )
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
                  {t('context_window')}
                </p>
                <p className='font-medium'>
                  {model.context_window
                    ? formatTokenCount(model.context_window)
                    : t('context_window_unset')}
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
            {testResult && (
              <div
                className={cn(
                  'flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 text-xs',
                  testResult.available
                    ? statusToneClasses.success.badge
                    : statusToneClasses.danger.badge,
                )}
              >
                <div className='flex min-w-0 items-start gap-2'>
                  {testResult.available ? (
                    <CheckCircle2Icon className='mt-0.5 size-3.5 shrink-0' />
                  ) : (
                    <XCircleIcon className='mt-0.5 size-3.5 shrink-0' />
                  )}
                  <div className='min-w-0 space-y-1'>
                    <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
                      <span className='font-medium'>
                        {testResult.available
                          ? t('test_status_available')
                          : t('test_status_unavailable')}
                      </span>
                      {testResult.latency_ms > 0 && (
                        <span className='font-mono tabular-nums opacity-80'>
                          {formatLatency(testResult.latency_ms)}
                        </span>
                      )}
                    </div>
                    {testResult.available && testResult.response_text && (
                      <p className='break-words text-foreground/90'>
                        <span className='text-muted-foreground'>
                          {t('test_response_label')}:{' '}
                        </span>
                        <span className='font-mono'>
                          {testResult.response_text}
                        </span>
                      </p>
                    )}
                    {!testResult.available && testResult.error && (
                      <p className='break-words opacity-90'>
                        {testResult.error}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => setTestResult(null)}
                  aria-label={t('dismiss_test_result')}
                  className='size-6 shrink-0 p-0 text-current hover:bg-transparent hover:text-current/80'
                >
                  <XIcon className='size-3.5' />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
