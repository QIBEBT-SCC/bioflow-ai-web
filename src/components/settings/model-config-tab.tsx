'use client'

import { SettingsIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useLLMModels,
  useLLMSettings,
  useUpdateLLMSetting,
} from '@/hooks/use-setting'
import type { LLMSettingKey } from '@/types/setting'

const SETTING_KEYS: LLMSettingKey[] = [
  'chat_model',
  'vision_model',
  'agent_model',
  'coding_model',
  'long_context_model',
  'high_performance_model',
  'simple_model',
]

export function ModelConfigTab() {
  const t = useTranslations('setting.llm_statistic')
  const tSetting = useTranslations('setting.llm_setting')
  const { data: availableModels = [] } = useLLMModels()
  const { data: settings } = useLLMSettings()
  const updateSettingMutation = useUpdateLLMSetting()

  const [isEditing, setIsEditing] = useState(false)
  const [pendingUpdates, setPendingUpdates] = useState<
    Partial<Record<LLMSettingKey, number>>
  >({})

  const modelTypeLabels: Record<LLMSettingKey, string> = {
    chat_model: t('model_type_chat'),
    vision_model: t('model_type_vision'),
    agent_model: t('model_type_agent'),
    coding_model: t('model_type_coding'),
    long_context_model: t('model_type_long_context'),
    high_performance_model: t('model_type_high_performance'),
    simple_model: t('model_type_simple'),
  }

  const handleChange = (key: LLMSettingKey, value: string) => {
    const modelId = parseInt(value, 10)
    if (settings?.[key]?.model_id === modelId) {
      setPendingUpdates((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    } else {
      setPendingUpdates((prev) => ({ ...prev, [key]: modelId }))
    }
  }

  const handleSave = async () => {
    try {
      await Promise.all(
        Object.entries(pendingUpdates).map(([key, modelId]) =>
          updateSettingMutation.mutateAsync({
            key: key as LLMSettingKey,
            model_id: modelId,
          }),
        ),
      )
      setPendingUpdates({})
      setIsEditing(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleCancel = () => {
    setPendingUpdates({})
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <Card className='border-border bg-card p-6'>
        <h2 className='text-xl font-semibold mb-6'>
          {t('module_config_title')}
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {SETTING_KEYS.map((key) => {
            const currentId = pendingUpdates[key] ?? settings?.[key]?.model_id
            return (
              <div key={key} className='space-y-2'>
                <Label htmlFor={key} className='text-sm font-medium'>
                  {modelTypeLabels[key]}
                </Label>
                <Select
                  value={currentId?.toString()}
                  onValueChange={(value) => handleChange(key, value)}
                >
                  <SelectTrigger id={key} className='bg-background'>
                    <SelectValue placeholder={t('select_model')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.id} value={model.id.toString()}>
                        <div className='flex items-center gap-2'>
                          <span className='font-mono text-sm'>
                            {model.name}
                          </span>
                          <span className='text-xs text-muted-foreground'>
                            ({model.provider_name})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          })}
        </div>
        <div className='mt-6 flex justify-end gap-2'>
          <Button
            variant='outline'
            onClick={handleCancel}
            disabled={updateSettingMutation.isPending}
          >
            {tSetting('cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              updateSettingMutation.isPending ||
              Object.keys(pendingUpdates).length === 0
            }
          >
            {updateSettingMutation.isPending ? t('saving') : t('save_config')}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className='border-border bg-card p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold'>{t('current_config_title')}</h3>
        <Button variant='outline' onClick={() => setIsEditing(true)}>
          <SettingsIcon className='size-4 mr-2' />
          {tSetting('edit')}
        </Button>
      </div>
      <div className='space-y-3'>
        {SETTING_KEYS.map((key) => {
          const item = settings?.[key]
          const model = availableModels.find((m) => m.id === item?.model_id)
          return (
            <div
              key={key}
              className='flex items-center justify-between py-2 border-b border-border last:border-0'
            >
              <div className='space-y-1'>
                <p className='text-sm font-medium'>{modelTypeLabels[key]}</p>
                <p className='text-xs text-muted-foreground'>{key}</p>
              </div>
              <div className='flex items-center gap-2'>
                <Badge variant='secondary' className='font-mono text-xs'>
                  {model?.name ?? item?.model_name ?? t('not_configured')}
                </Badge>
                {model && (
                  <Badge variant='outline' className='text-xs'>
                    {model.provider_name}
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
