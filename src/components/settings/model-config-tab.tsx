'use client'

import {
  BotIcon,
  Code2Icon,
  EyeIcon,
  FileTextIcon,
  InfoIcon,
  Loader2Icon,
  type LucideIcon,
  MessageSquareIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  ZapIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { SectionCard } from '@/components/layout/section-card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useLLMModels,
  useLLMSettings,
  useUpdateLLMSetting,
} from '@/hooks/use-setting'
import { statusToneClasses } from '@/lib/status'
import { formatTokenCount } from '@/lib/token-format'
import type { LLMModelPublic, LLMSettingKey } from '@/types/setting'

interface RoleMeta {
  key: LLMSettingKey
  icon: LucideIcon
  labelKey:
    | 'model_type_chat'
    | 'model_type_vision'
    | 'model_type_agent'
    | 'model_type_coding'
    | 'model_type_long_context'
    | 'model_type_high_performance'
    | 'model_type_simple'
  descriptionKey:
    | 'role_desc_chat'
    | 'role_desc_vision'
    | 'role_desc_agent'
    | 'role_desc_coding'
    | 'role_desc_long_context'
    | 'role_desc_high_performance'
    | 'role_desc_simple'
}

const ROLE_DEFINITIONS: readonly RoleMeta[] = [
  {
    key: 'chat_model',
    icon: MessageSquareIcon,
    labelKey: 'model_type_chat',
    descriptionKey: 'role_desc_chat',
  },
  {
    key: 'vision_model',
    icon: EyeIcon,
    labelKey: 'model_type_vision',
    descriptionKey: 'role_desc_vision',
  },
  {
    key: 'agent_model',
    icon: BotIcon,
    labelKey: 'model_type_agent',
    descriptionKey: 'role_desc_agent',
  },
  {
    key: 'coding_model',
    icon: Code2Icon,
    labelKey: 'model_type_coding',
    descriptionKey: 'role_desc_coding',
  },
  {
    key: 'long_context_model',
    icon: FileTextIcon,
    labelKey: 'model_type_long_context',
    descriptionKey: 'role_desc_long_context',
  },
  {
    key: 'high_performance_model',
    icon: SparklesIcon,
    labelKey: 'model_type_high_performance',
    descriptionKey: 'role_desc_high_performance',
  },
  {
    key: 'simple_model',
    icon: ZapIcon,
    labelKey: 'model_type_simple',
    descriptionKey: 'role_desc_simple',
  },
]

const SKELETON_ROWS = [
  'role-skeleton-1',
  'role-skeleton-2',
  'role-skeleton-3',
  'role-skeleton-4',
  'role-skeleton-5',
  'role-skeleton-6',
  'role-skeleton-7',
]

export function ModelConfigTab() {
  const t = useTranslations('setting.llm_statistic')
  const {
    data: availableModels = [],
    isLoading: modelsLoading,
    error: modelsError,
  } = useLLMModels()
  const {
    data: settings,
    isLoading: settingsLoading,
    error: settingsError,
  } = useLLMSettings()
  const updateSettingMutation = useUpdateLLMSetting()

  const [pendingUpdates, setPendingUpdates] = useState<
    Partial<Record<LLMSettingKey, number>>
  >({})

  const groupedModels = useMemo(() => {
    const groups = new Map<string, LLMModelPublic[]>()
    for (const model of availableModels) {
      const groupName = model.provider_name || '—'
      const list = groups.get(groupName)
      if (list) {
        list.push(model)
      } else {
        groups.set(groupName, [model])
      }
    }
    return Array.from(groups.entries())
  }, [availableModels])

  const modelById = useMemo(
    () => new Map(availableModels.map((model) => [model.id, model])),
    [availableModels],
  )

  const handleChange = (key: LLMSettingKey, value: string) => {
    const modelId = Number.parseInt(value, 10)
    if (Number.isNaN(modelId)) return
    setPendingUpdates((prev) => {
      const next = { ...prev }
      if (settings?.[key]?.model_id === modelId) {
        delete next[key]
      } else {
        next[key] = modelId
      }
      return next
    })
  }

  const dirtyEntries = Object.entries(pendingUpdates) as [
    LLMSettingKey,
    number,
  ][]
  const dirtyCount = dirtyEntries.length
  const saving = updateSettingMutation.isPending

  const handleSave = async () => {
    if (dirtyCount === 0 || saving) return
    try {
      await Promise.all(
        dirtyEntries.map(([key, modelId]) =>
          updateSettingMutation.mutateAsync({
            key,
            model_id: modelId,
          }),
        ),
      )
      setPendingUpdates({})
      toast.success(t('save_success'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('save_failed'))
    }
  }

  if (modelsLoading || settingsLoading) {
    return (
      <SectionCard
        icon={<SlidersHorizontalIcon />}
        title={t('module_config_title')}
        description={t('assignment_description')}
        contentClassName='p-0'
      >
        <div className='divide-y border-t' aria-busy='true'>
          {SKELETON_ROWS.map((rowKey) => (
            <div
              key={rowKey}
              className='flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between'
            >
              <div className='flex items-center gap-3'>
                <Skeleton className='size-9 rounded-lg' />
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-28' />
                  <Skeleton className='h-3 w-44' />
                </div>
              </div>
              <Skeleton className='h-9 w-full sm:w-80' />
            </div>
          ))}
        </div>
      </SectionCard>
    )
  }

  if (modelsError || settingsError) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>{t('load_failed')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className='space-y-4'>
      {availableModels.length === 0 && (
        <Alert variant='info'>
          <InfoIcon />
          <AlertDescription>{t('no_available_models')}</AlertDescription>
        </Alert>
      )}

      <SectionCard
        icon={<SlidersHorizontalIcon />}
        title={t('module_config_title')}
        description={t('assignment_description')}
        contentClassName='p-0'
      >
        <div className='divide-y border-t'>
          {ROLE_DEFINITIONS.map((role) => {
            const RoleIcon = role.icon
            const savedItem = settings?.[role.key]
            const savedModelId =
              typeof savedItem?.model_id === 'number'
                ? savedItem.model_id
                : undefined
            const pendingId = pendingUpdates[role.key]
            const isDirty = pendingId !== undefined
            const selectedId = pendingId ?? savedModelId
            const selectedModel =
              selectedId !== undefined ? modelById.get(selectedId) : undefined
            const missingSavedModel =
              savedItem &&
              savedModelId !== undefined &&
              !modelById.has(savedModelId)
                ? savedItem
                : undefined

            const displayModelName =
              selectedModel?.name ??
              (savedModelId !== undefined ? savedItem?.name : undefined)
            const displayProviderName =
              selectedModel?.provider_name ??
              (savedModelId !== undefined
                ? savedItem?.provider_name
                : undefined)
            const contextWindow = selectedModel?.context_window

            return (
              <div
                key={role.key}
                className='flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between'
              >
                <div className='flex min-w-0 items-start gap-3'>
                  <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
                    <RoleIcon className='size-4' />
                  </span>
                  <div className='min-w-0 space-y-0.5'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='text-sm font-medium'>{t(role.labelKey)}</p>
                      {isDirty && (
                        <Badge
                          variant='outline'
                          className={statusToneClasses.info.badge}
                        >
                          {t('modified')}
                        </Badge>
                      )}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      {t(role.descriptionKey)}
                    </p>
                  </div>
                </div>

                <div className='w-full shrink-0 space-y-1 sm:w-80'>
                  <Select
                    value={
                      selectedId !== undefined ? selectedId.toString() : ''
                    }
                    disabled={
                      saving ||
                      (availableModels.length === 0 && !missingSavedModel)
                    }
                    onValueChange={(value) => handleChange(role.key, value)}
                  >
                    <SelectTrigger
                      id={role.key}
                      aria-label={t(role.labelKey)}
                      className='w-full bg-background'
                    >
                      <SelectValue placeholder={t('select_model')} />
                    </SelectTrigger>
                    <SelectContent>
                      {missingSavedModel && savedModelId !== undefined && (
                        <SelectGroup>
                          <SelectLabel>
                            {missingSavedModel.provider_name}
                          </SelectLabel>
                          <SelectItem value={savedModelId.toString()}>
                            <span>{missingSavedModel.display_name}</span>
                          </SelectItem>
                        </SelectGroup>
                      )}
                      {groupedModels.map(([providerName, models]) => (
                        <SelectGroup key={providerName}>
                          <SelectLabel>{providerName}</SelectLabel>
                          {models.map((model) => (
                            <SelectItem
                              key={model.id}
                              value={model.id.toString()}
                            >
                              <span className='flex items-center gap-2'>
                                <span>{model.display_name}</span>
                                <span className='font-mono text-xs text-muted-foreground'>
                                  {model.name}
                                </span>
                                {!model.is_active && (
                                  <span className='text-xs text-muted-foreground'>
                                    ({t('inactive_model_tag')})
                                  </span>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className='flex items-center justify-between gap-2 px-0.5 text-xs text-muted-foreground'>
                    <span className='truncate font-mono'>
                      {displayModelName || t('not_configured')}
                    </span>
                    {(displayProviderName || contextWindow) && (
                      <span className='shrink-0 tabular-nums'>
                        {[
                          displayProviderName,
                          contextWindow
                            ? formatTokenCount(contextWindow)
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {dirtyCount > 0 && (
          <div className='flex flex-col gap-3 border-t bg-muted/20 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between'>
            <span className='text-sm text-muted-foreground tabular-nums'>
              {t('unsaved_changes_count', { count: dirtyCount })}
            </span>
            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='ghost'
                disabled={saving}
                onClick={() => setPendingUpdates({})}
              >
                {t('discard')}
              </Button>
              <Button type='button' disabled={saving} onClick={handleSave}>
                {saving && <Loader2Icon className='size-4 animate-spin' />}
                {saving ? t('saving') : t('save_config')}
              </Button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
