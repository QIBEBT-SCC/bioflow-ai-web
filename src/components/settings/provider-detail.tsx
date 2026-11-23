'use client'

import {
  CpuIcon,
  LayersIcon,
  MoreHorizontalIcon,
  PlugIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { SectionCard } from '@/components/layout/section-card'
import { ModelFormDialog } from '@/components/settings/model-form-dialog'
import { ProviderConnectionForm } from '@/components/settings/provider-connection-form'
import { ProviderModelsTable } from '@/components/settings/provider-models-table'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useDeleteLLMProvider, useUpdateLLMProvider } from '@/hooks/use-setting'
import { statusToneClasses } from '@/lib/status'
import type { LLMProviderPublic } from '@/types/setting'

export function ProviderDetail({
  provider,
  onDeleted,
}: {
  provider: LLMProviderPublic
  onDeleted: () => void
}) {
  const t = useTranslations('setting.llm_setting')
  const updateProviderMutation = useUpdateLLMProvider()
  const deleteProviderMutation = useDeleteLLMProvider()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleToggleActive = async (checked: boolean) => {
    try {
      await updateProviderMutation.mutateAsync({
        id: provider.id,
        data: { is_active: checked },
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('provider_toggle_failed'),
      )
    }
  }

  const handleDelete = async () => {
    try {
      await deleteProviderMutation.mutateAsync(provider.id)
      setDeleteOpen(false)
      onDeleted()
      toast.success(t('provider_deleted'))
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('provider_delete_failed'),
      )
    }
  }

  return (
    <div className='min-w-0 space-y-6'>
      <header className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex min-w-0 items-center gap-3'>
          <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <CpuIcon className='size-5' />
          </span>
          <div className='min-w-0 space-y-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 className='truncate text-lg font-semibold tracking-tight'>
                {provider.name}
              </h2>
              {provider.use_proxy && (
                <Badge variant='outline'>{t('using_proxy')}</Badge>
              )}
              {!provider.credential_configured && (
                <Badge
                  variant='outline'
                  className={statusToneClasses.warning.badge}
                >
                  {t('api_key_not_configured')}
                </Badge>
              )}
            </div>
            <p className='truncate text-sm text-muted-foreground'>
              <span>{t(`provider_type_${provider.provider_type}`)}</span>
              <span> · </span>
              <span className='font-mono text-xs'>
                {provider.base_url || t('default_endpoint')}
              </span>
            </p>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <div className='flex h-9 items-center gap-2 rounded-md border px-3'>
            <Label htmlFor={`provider-active-${provider.id}`}>
              {t('active')}
            </Label>
            <Switch
              id={`provider-active-${provider.id}`}
              aria-label={t('toggle_provider_active')}
              checked={provider.is_active}
              disabled={updateProviderMutation.isPending}
              onCheckedChange={(checked) => void handleToggleActive(checked)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                aria-label={t('more_actions')}
              >
                <MoreHorizontalIcon className='size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                variant='destructive'
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2Icon className='size-4' />
                {t('delete_provider')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <SectionCard
        icon={<LayersIcon />}
        title={t('model_list')}
        description={t('model_count', { count: provider.models.length })}
        action={
          <ModelFormDialog
            providerId={provider.id}
            providerName={provider.name}
            providerType={provider.provider_type}
            providerBaseUrl={provider.base_url}
            trigger={
              <Button type='button' variant='outline' size='sm'>
                <PlusIcon className='size-3.5' />
                {t('add_model')}
              </Button>
            }
          />
        }
      >
        <ProviderModelsTable provider={provider} />
      </SectionCard>

      <SectionCard
        icon={<PlugIcon />}
        title={t('connection')}
        description={t('connection_help')}
      >
        <ProviderConnectionForm key={provider.id} provider={provider} />
      </SectionCard>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete_provider_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_provider_desc', { name: provider.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProviderMutation.isPending}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={deleteProviderMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {deleteProviderMutation.isPending
                ? t('deleting')
                : t('delete_provider')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
