'use client'

import { cn } from 'cn'
import {
  CheckCircle2Icon,
  Edit2Icon,
  Loader2Icon,
  SendIcon,
  Trash2Icon,
  XCircleIcon,
  XIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Fragment, useState } from 'react'
import { toast } from 'sonner'
import { ModelFormDialog } from '@/components/settings/model-form-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  LLMProviderPublic,
} from '@/types/setting'

function formatLatency(latencyMs: number): string {
  return latencyMs < 1000
    ? `${latencyMs} ms`
    : `${(latencyMs / 1000).toFixed(2)} s`
}

function ProviderModelRow({
  model,
  provider,
}: {
  model: LLMModelPublic
  provider: LLMProviderPublic
}) {
  const t = useTranslations('setting.llm_setting')
  const updateModelMutation = useUpdateLLMModel()
  const deleteModelMutation = useDeleteLLMModel()
  const testModelMutation = useTestLLMModel()

  const [testResult, setTestResult] = useState<LLMModelTestResult | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleToggleActive = async (checked: boolean) => {
    try {
      await updateModelMutation.mutateAsync({
        id: model.id,
        data: { is_active: checked },
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('model_toggle_failed'),
      )
    }
  }

  const handleDelete = async () => {
    try {
      await deleteModelMutation.mutateAsync(model.id)
      setDeleteOpen(false)
      toast.success(t('model_deleted'))
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('model_delete_failed'),
      )
    }
  }

  const handleTest = async () => {
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
        provider_name: provider.name,
        available: false,
        latency_ms: 0,
        response_text: null,
        error: message,
      })
      toast.error(message)
    }
  }

  const busy = testModelMutation.isPending || deleteModelMutation.isPending

  return (
    <Fragment>
      <TableRow className={cn(testResult && 'border-b-0')}>
        <TableCell className='max-w-56'>
          <div className='min-w-0'>
            <p
              className={cn(
                'truncate text-sm font-medium',
                !model.is_active && 'text-muted-foreground',
              )}
            >
              {model.display_name}
            </p>
            <p className='truncate font-mono text-xs text-muted-foreground'>
              {model.name}
            </p>
          </div>
        </TableCell>
        <TableCell>
          <div className='space-y-0.5 text-xs tabular-nums'>
            <p>
              <span className='text-muted-foreground'>
                {t('price_input_short')}{' '}
              </span>
              <span>${model.input_price}</span>
              <span className='text-muted-foreground'>
                {' '}
                · {t('price_output_short')}{' '}
              </span>
              <span>${model.output_price}</span>
            </p>
            <p className='text-muted-foreground'>
              {t('price_cache_short')} ${model.cache_read_price}
            </p>
          </div>
        </TableCell>
        <TableCell>
          <div className='space-y-0.5 text-xs'>
            <p className='tabular-nums'>
              {model.context_window
                ? formatTokenCount(model.context_window)
                : t('context_window_unset')}
            </p>
            <p className='text-muted-foreground'>
              {model.reasoning_effort
                ? t(`reasoning_effort_${model.reasoning_effort}`)
                : t('reasoning_effort_default')}
            </p>
          </div>
        </TableCell>
        <TableCell>
          <Switch
            checked={model.is_active}
            disabled={updateModelMutation.isPending}
            aria-label={t('toggle_model_active')}
            onCheckedChange={(checked) => void handleToggleActive(checked)}
          />
        </TableCell>
        <TableCell className='text-right'>
          <div className='flex items-center justify-end gap-1'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleTest}
              disabled={busy}
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
            <ModelFormDialog
              providerId={provider.id}
              providerName={provider.name}
              providerType={provider.provider_type}
              providerBaseUrl={provider.base_url}
              model={model}
              onSaved={() => setTestResult(null)}
              trigger={
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='size-8'
                  disabled={busy}
                  aria-label={t('edit')}
                >
                  <Edit2Icon className='size-3.5' />
                </Button>
              }
            />
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-8 text-destructive hover:text-destructive'
              disabled={busy}
              aria-label={t('delete_model')}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2Icon className='size-3.5' />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {testResult && (
        <TableRow className='bg-transparent hover:bg-transparent'>
          <TableCell colSpan={5} className='px-3 pt-0 pb-3 whitespace-normal'>
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
                    <p className='break-words opacity-90'>{testResult.error}</p>
                  )}
                </div>
              </div>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => setTestResult(null)}
                aria-label={t('dismiss_test_result')}
                className='size-6 shrink-0 text-current hover:bg-transparent hover:text-current/80'
              >
                <XIcon className='size-3.5' />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete_model_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_model_desc', { name: model.display_name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteModelMutation.isPending}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={deleteModelMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {deleteModelMutation.isPending
                ? t('deleting')
                : t('delete_model')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Fragment>
  )
}

export function ProviderModelsTable({
  provider,
}: {
  provider: LLMProviderPublic
}) {
  const t = useTranslations('setting.llm_setting')

  if (provider.models.length === 0) {
    return (
      <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
        {t('no_models')}
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('col_model')}</TableHead>
            <TableHead>{t('col_pricing')}</TableHead>
            <TableHead>{t('col_specs')}</TableHead>
            <TableHead>{t('col_status')}</TableHead>
            <TableHead className='text-right'>{t('col_actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {provider.models.map((model) => (
            <ProviderModelRow
              key={model.id}
              model={model}
              provider={provider}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
