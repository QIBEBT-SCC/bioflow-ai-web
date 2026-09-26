'use client'

import { ArrowLeft, ArrowRight, Check, Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Suspense, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getTool } from '@/app/actions/tool'
import {
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import {
  ToolConfigForm,
  type ToolConfigValues,
} from '@/components/tool/tool-config-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  useCreateTool,
  useSearchImages,
  useToolGroupList,
  useToolTagList,
} from '@/hooks/use-tool'
import { updateFileMountValue } from '@/lib/tool-file-mount'
import { cn } from '@/lib/utils'
import { useCreateToolStore } from '@/stores/toolStore'
import type {
  DockerToolCreate,
  FileMount,
  ParamDefine,
  ToolImage,
  ToolTag,
} from '@/types/tool'

function ImageSelectionStep({
  searchQuery,
  onSearchChange,
  searchResults,
  currentImageUid,
  onSelect,
}: {
  searchQuery: string
  onSearchChange: (q: string) => void
  searchResults: ToolImage[]
  currentImageUid: string | undefined
  onSelect: (image: ToolImage) => void
}) {
  const t = useTranslations('tool.AddPage')
  return (
    <div>
      <StepHeading title={t('selectImage')} description={t('searchImage')} />
      <div className='relative mb-4'>
        <Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          className='pl-8'
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {searchResults.map((image) => (
          <button
            key={image.uid}
            type='button'
            aria-pressed={currentImageUid === image.uid}
            className={cn(
              'flex flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-md',
              currentImageUid === image.uid &&
                'border-primary bg-primary/5 ring-1 ring-primary hover:border-primary',
            )}
            onClick={() => onSelect(image)}
          >
            <div className='flex items-center gap-2'>
              <span className='truncate font-semibold'>{image.name}</span>
              <Badge variant='secondary' className='shrink-0 font-mono'>
                {image.version}
              </Badge>
              {currentImageUid === image.uid && (
                <Check className='ml-auto size-4 shrink-0 text-primary' />
              )}
            </div>
            <p className='line-clamp-2 text-sm text-muted-foreground'>
              {image.description}
            </p>
            <code className='block truncate font-mono text-xs text-muted-foreground'>
              {image.image.registry}/{image.image.namespace}/
              {image.image.repository}:{image.image.tag}
            </code>
          </button>
        ))}
      </div>
      {searchQuery && searchResults.length === 0 && (
        <div className='rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground'>
          {t('noImageFound')}
        </div>
      )}
    </div>
  )
}

function StepNavigation({
  currentStep,
  totalSteps,
  canProceed,
  isCreating,
  onPrev,
  onNext,
  onCreate,
}: {
  currentStep: number
  totalSteps: number
  canProceed: boolean
  isCreating: boolean
  onPrev: () => void
  onNext: () => void
  onCreate: () => void
}) {
  const t = useTranslations('tool.AddPage')
  return (
    <div className='sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6'>
      <Button variant='outline' onClick={onPrev} disabled={currentStep === 1}>
        <ArrowLeft className='size-4' />
        {t('prevStep')}
      </Button>
      <div className='text-sm text-muted-foreground'>
        {t('stepProgress', { current: currentStep, total: totalSteps })}
      </div>
      {currentStep < totalSteps ? (
        <Button onClick={onNext} disabled={!canProceed}>
          {t('nextStep')}
          <ArrowRight className='size-4' />
        </Button>
      ) : (
        <Button onClick={onCreate} disabled={!canProceed || isCreating}>
          {isCreating ? t('creating') : t('createTool')}
        </Button>
      )}
    </div>
  )
}

type ToolConfigFieldValue =
  | string
  | number
  | boolean
  | null
  | ParamDefine[]
  | FileMount[]
  | ToolTag[]

function useToolConfigFormActions(
  toolConfig: ToolConfigValues,
  setToolConfig: (toolConfig: ToolConfigValues) => void,
  updateStoreField: (field: keyof ToolConfigValues, value: never) => void,
) {
  const updateToolConfigField = (
    field: keyof ToolConfigValues,
    value: ToolConfigFieldValue,
  ) => {
    updateStoreField(field, value as never)
  }

  const addDynamicParam = () => {
    setToolConfig({
      ...toolConfig,
      dynamic_params: [
        ...toolConfig.dynamic_params,
        {
          description: '',
          command: '',
          is_position: false,
          index: toolConfig.dynamic_params.length,
        },
      ],
    })
  }

  const updateDynamicParam = (
    index: number,
    field: keyof ParamDefine,
    value: string | number | boolean,
  ) => {
    const updatedParams = [...toolConfig.dynamic_params]
    updatedParams[index] = { ...updatedParams[index], [field]: value }
    setToolConfig({ ...toolConfig, dynamic_params: updatedParams })
  }

  const removeDynamicParam = (index: number) => {
    const updatedParams = [...toolConfig.dynamic_params]
    updatedParams.splice(index, 1)
    updatedParams.forEach((param, idx) => {
      param.index = idx
    })
    setToolConfig({ ...toolConfig, dynamic_params: updatedParams })
  }

  const addFileMount = () => {
    setToolConfig({
      ...toolConfig,
      file_mounts: [
        ...toolConfig.file_mounts,
        {
          name: '',
          description: '',
          file_path: '',
          file_type: 'INPUT',
          is_report: false,
          is_log: false,
          mount_path: '',
        },
      ],
    })
  }

  const updateFileMount = (
    index: number,
    field: keyof FileMount,
    value: string | boolean,
  ) => {
    const updatedFiles = [...toolConfig.file_mounts]
    updatedFiles[index] = updateFileMountValue(
      updatedFiles[index],
      field,
      value,
    )
    setToolConfig({ ...toolConfig, file_mounts: updatedFiles })
  }

  const removeFileMount = (index: number) => {
    const updatedFiles = [...toolConfig.file_mounts]
    updatedFiles.splice(index, 1)
    setToolConfig({ ...toolConfig, file_mounts: updatedFiles })
  }

  const reorderDynamicParams = (newParams: ParamDefine[]) =>
    setToolConfig({ ...toolConfig, dynamic_params: newParams })

  const reorderFileMounts = (newMounts: FileMount[]) =>
    setToolConfig({ ...toolConfig, file_mounts: newMounts })

  return {
    addDynamicParam,
    addFileMount,
    removeDynamicParam,
    removeFileMount,
    reorderDynamicParams,
    reorderFileMounts,
    updateDynamicParam,
    updateFileMount,
    updateToolConfigField,
  }
}

export default function AddToolPage() {
  return (
    <Suspense>
      <AddToolPageContent />
    </Suspense>
  )
}

function AddToolPageContent() {
  const t = useTranslations('tool.AddPage')
  const tPage = useTranslations('tool.Page')
  const steps = [
    {
      id: 1,
      title: t('steps.step1.title'),
      description: t('steps.step1.description'),
    },
    {
      id: 2,
      title: t('steps.step2.title'),
      description: t('steps.step2.description'),
    },
    {
      id: 3,
      title: t('steps.step3.title'),
      description: t('steps.step3.description'),
    },
  ]
  const { push } = useRouter()
  const searchParams = useSearchParams()
  const initialStep = Number(searchParams.get('step')) || 1
  const copyUid = searchParams.get('copy')
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [searchQuery, setSearchQuery] = useState('')

  const {
    currentImage,
    toolConfig,
    setCurrentImage,
    setToolConfig,
    initFromCopy,
    updateToolConfigField: updateStoreField,
    resetStore,
  } = useCreateToolStore()
  const { data: searchPage } = useSearchImages(searchQuery)
  const searchResults = searchPage?.data ?? []
  const { data: toolGroups = [] } = useToolGroupList()
  const { data: availableTags = [] } = useToolTagList()
  const { mutate: createTool, isPending: isCreating } = useCreateTool()
  const {
    addDynamicParam,
    addFileMount,
    removeDynamicParam,
    removeFileMount,
    reorderDynamicParams,
    reorderFileMounts,
    updateDynamicParam,
    updateFileMount,
    updateToolConfigField,
  } = useToolConfigFormActions(toolConfig, setToolConfig, updateStoreField)

  // 组件卸载时重置store
  useEffect(() => {
    return () => {
      resetStore()
    }
  }, [resetStore])

  // 复制工具时，从URL参数获取源工具UID并预填充store
  useEffect(() => {
    if (!copyUid) return
    let cancelled = false
    getTool(copyUid).then((tool) => {
      if (cancelled) return
      setSearchQuery(tool.image.name)
      initFromCopy(tool.image, {
        name: `${tool.name}${t('copySuffix')}`,
        image_uid: tool.image.uid ?? '',
        description: tool.description,
        help_command: tool.help_doc?.help_command ?? '',
        group_id: tool.group_id ?? 0,
        tags: tool.tags,
        command_template: tool.command_template,
        dynamic_params: tool.dynamic_params,
        immutable_static_params: tool.immutable_static_params ?? null,
        modifiable_static_params: tool.modifiable_static_params ?? null,
        file_mounts: tool.file_mounts,
      })
    })
    return () => {
      cancelled = true
    }
  }, [copyUid, initFromCopy, t])

  // 处理下一步
  const handleNext = () => {
    setCurrentStep((prev) => (prev < steps.length ? prev + 1 : prev))
  }

  const handlePrev = () => {
    setCurrentStep((prev) => (prev > 1 ? prev - 1 : prev))
  }

  // 处理工具创建
  const handleCreateTool = () => {
    // 将 ToolConfigValues 转换为 DockerToolCreate
    const requestData: DockerToolCreate = {
      ...toolConfig,
      tag_ids: toolConfig.tags.map((tag) => tag.id),
      immutable_static_params: toolConfig.immutable_static_params ?? '',
      modifiable_static_params: toolConfig.modifiable_static_params ?? '',
    }

    createTool(requestData, {
      onSuccess: () => {
        toast.success(t('createSuccess'))
        push('/tool')
      },
    })
  }

  const hasRequiredToolConfig =
    toolConfig.name.trim().length > 0 &&
    toolConfig.description.trim().length > 0 &&
    toolConfig.command_template.trim().length > 0 &&
    toolConfig.help_command.trim().length > 0

  // 检查当前步骤是否可以继续
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return currentImage.uid !== undefined
      case 2:
        return hasRequiredToolConfig
      case 3:
        return hasRequiredToolConfig
      default:
        return false
    }
  }

  return (
    <PageShell
      breadcrumbs={[
        { label: tPage('title'), href: '/tool' },
        { label: t('breadcrumb') },
      ]}
    >
      <PageContainer size='narrow'>
        <PageHeader title={t('title')} description={t('subtitle')} />

        <StepProgressBar steps={steps} currentStep={currentStep} />

        {/* 步骤内容 */}
        <div className='mb-6'>
          {currentStep === 1 && (
            <ImageSelectionStep
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchResults={searchResults}
              currentImageUid={currentImage?.uid}
              onSelect={setCurrentImage}
            />
          )}
          {currentStep === 2 && (
            <div>
              <StepHeading
                title={t('configTool')}
                description={t('fillBasicInfo')}
              />
              <ToolConfigForm
                value={toolConfig}
                toolGroups={toolGroups}
                availableTags={availableTags}
                onFieldChange={updateToolConfigField}
                onAddDynamicParam={addDynamicParam}
                onUpdateDynamicParam={updateDynamicParam}
                onRemoveDynamicParam={removeDynamicParam}
                onAddFileMount={addFileMount}
                onUpdateFileMount={updateFileMount}
                onRemoveFileMount={removeFileMount}
                onReorderDynamicParams={reorderDynamicParams}
                onReorderFileMounts={reorderFileMounts}
                imageUid={currentImage?.uid}
                imageSummary={
                  currentImage?.name || currentImage?.version
                    ? {
                        name: currentImage.name,
                        version: currentImage.version,
                      }
                    : undefined
                }
                showTabBadges
              />
            </div>
          )}
          {currentStep === 3 && (
            <ConfirmStep
              toolConfig={toolConfig}
              currentImageName={currentImage?.name}
            />
          )}
        </div>

        <StepNavigation
          currentStep={currentStep}
          totalSteps={steps.length}
          canProceed={canProceed()}
          isCreating={isCreating}
          onPrev={handlePrev}
          onNext={handleNext}
          onCreate={handleCreateTool}
        />
      </PageContainer>
    </PageShell>
  )
}

interface Step {
  id: number
  title: string
  description: string
}

function StepProgressBar({
  steps,
  currentStep,
}: {
  steps: Step[]
  currentStep: number
}) {
  return (
    <ol className='mb-8 flex items-start rounded-xl border bg-card p-4'>
      {steps.map((step, index) => {
        const done = currentStep > step.id
        const active = currentStep === step.id
        return (
          <li
            key={step.id}
            className='flex flex-1 items-start last:flex-none'
            aria-current={active ? 'step' : undefined}
          >
            <div className='flex items-center gap-3'>
              <div
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary bg-primary/10 text-primary',
                  !done && !active && 'text-muted-foreground',
                )}
              >
                {done ? <Check className='size-4' /> : step.id}
              </div>
              <div className='hidden min-w-0 sm:block'>
                <div
                  className={cn(
                    'text-sm font-medium',
                    !done && !active && 'text-muted-foreground',
                  )}
                >
                  {step.title}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {step.description}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-4 mt-4 h-px flex-1',
                  done ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function StepHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className='mb-4'>
      <h2 className='text-lg font-semibold tracking-tight'>{title}</h2>
      <p className='text-sm text-muted-foreground'>{description}</p>
    </div>
  )
}

function ConfirmStep({
  toolConfig,
  currentImageName,
}: {
  toolConfig: ToolConfigValues
  currentImageName?: string
}) {
  const t = useTranslations('tool.AddPage')
  const hasStaticParams =
    (toolConfig.immutable_static_params || '').length > 0 ||
    (toolConfig.modifiable_static_params || '').length > 0

  return (
    <div>
      <StepHeading title={t('confirmCreate')} description={t('checkConfig')} />
      <div className='space-y-4'>
        <Card className='py-5'>
          <CardContent className='px-5'>
            <h3 className='mb-4 text-sm font-semibold'>{t('basicInfo')}</h3>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>{t('toolName')}</span>
                <span className='font-medium'>{toolConfig.name}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>{t('toolDesc')}</span>
                <span className='font-medium'>{toolConfig.description}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>{t('toolImage')}</span>
                <span className='font-medium'>{currentImageName}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>
                  {t('commandTemplate')}
                </span>
                <code className='text-sm bg-muted px-2 py-1 rounded'>
                  {toolConfig.command_template}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className='py-5'>
          <CardContent className='px-5'>
            <h3 className='mb-4 text-sm font-semibold'>{t('configSummary')}</h3>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-semibold text-primary tabular-nums'>
                  {toolConfig.dynamic_params.length}
                </div>
                <div className='text-sm text-muted-foreground'>
                  {t('dynamicParams')}
                </div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-semibold text-primary tabular-nums'>
                  {toolConfig.file_mounts.length}
                </div>
                <div className='text-sm text-muted-foreground'>
                  {t('fileMounts')}
                </div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-semibold text-primary tabular-nums'>
                  {hasStaticParams ? t('yes') : t('no')}
                </div>
                <div className='text-sm text-muted-foreground'>
                  {t('staticParams')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
