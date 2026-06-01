'use client'

import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Suspense, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getTool } from '@/app/actions/tool'
import {
  ToolConfigForm,
  type ToolConfigValues,
} from '@/components/tool/tool-config-form'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import {
  useCreateTool,
  useSearchImages,
  useToolGroupList,
  useToolTagList,
} from '@/hooks/use-tool'
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
      <h2 className='text-xl font-semibold mb-2'>{t('selectImage')}</h2>
      <p className='text-muted-foreground mb-6'>{t('searchImage')}</p>
      <div className='mb-6'>
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {searchResults.map((image) => (
          <Card
            key={image.uid}
            className={`pt-2 cursor-pointer transition-all hover:shadow-md border-2 ${
              currentImageUid === image.uid
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onSelect(image)}
          >
            <CardContent className='p-4'>
              <h3 className='font-semibold'>{image.name}</h3>
              <Badge variant='secondary' className='mt-2'>
                {image.version}
              </Badge>
              <p className='text-sm text-muted-foreground mt-2 line-clamp-2'>
                {image.description}
              </p>
              <code className='text-xs bg-muted px-2 py-1 rounded block overflow-x-auto mt-2'>
                {image.image.registry}/{image.image.namespace}/
                {image.image.repository}:{image.image.tag}
              </code>
            </CardContent>
          </Card>
        ))}
      </div>
      {searchQuery && searchResults.length === 0 && (
        <div className='text-center py-12 text-muted-foreground'>
          <p>{t('noImageFound')}</p>
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
    <div className='flex justify-between items-center pt-4 border-t'>
      <Button variant='outline' onClick={onPrev} disabled={currentStep === 1}>
        <ArrowLeft className='size-4 mr-2' />
        {t('prevStep')}
      </Button>
      <div className='text-sm text-muted-foreground'>
        {t('stepProgress', { current: currentStep, total: totalSteps })}
      </div>
      {currentStep < totalSteps ? (
        <Button onClick={onNext} disabled={!canProceed}>
          {t('nextStep')}
          <ArrowRight className='size-4 ml-2' />
        </Button>
      ) : (
        <Button
          onClick={onCreate}
          className='bg-green-600 hover:bg-green-700'
          disabled={!canProceed || isCreating}
        >
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
    updatedFiles[index] = { ...updatedFiles[index], [field]: value }
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

  // 检查当前步骤是否可以继续
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return currentImage.uid !== undefined
      case 2:
        return (
          toolConfig.name &&
          toolConfig.command_template &&
          toolConfig.help_command
        )
      case 3:
        return true
      default:
        return false
    }
  }

  return (
    <SidebarInset className='h-screen flex flex-col'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center gap-2 px-4 h-12 bg-background'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2! h-4!' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbLink asChild>
                  <Link href='/tool'>{tPage('title')}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className='hidden md:block' />
              <BreadcrumbItem>
                <BreadcrumbPage>{t('breadcrumb')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className='flex-1 overflow-y-auto'>
        <div className='container mx-auto py-6 max-w-4xl'>
          <div className='mb-6'>
            <Link
              href='/tool'
              className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2'
            >
              <ArrowLeft className='size-4 mr-1' />
              {t('back')}
            </Link>
            <h1 className='text-2xl font-semibold'>{t('title')}</h1>
            <p className='text-muted-foreground mt-1'>{t('subtitle')}</p>
          </div>

          <StepProgressBar steps={steps} currentStep={currentStep} />

          {/* 步骤内容 */}
          <div className='mb-8'>
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
                <h2 className='text-xl font-semibold mb-2'>
                  {t('configTool')}
                </h2>
                <p className='text-muted-foreground mb-6'>
                  {t('fillBasicInfo')}
                </p>
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
                  showAIGeneratePlaceholder
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
        </div>
      </div>
    </SidebarInset>
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
    <Card className='mb-8 py-4'>
      <CardContent className='py-0'>
        <div className='flex items-center justify-between'>
          {steps.map((step, index) => (
            <div key={step.id} className='flex items-center'>
              <div className='flex flex-col items-center'>
                <div
                  className={`size-9 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className='size-5' />
                  ) : (
                    step.id
                  )}
                </div>
                <div className='mt-2 text-center'>
                  <div className='text-sm font-medium'>{step.title}</div>
                  <div className='text-xs text-muted-foreground'>
                    {step.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? 'bg-green-500' : 'bg-muted'}`}
                />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
      <h2 className='text-xl font-semibold mb-2'>{t('confirmCreate')}</h2>
      <p className='text-muted-foreground mb-6'>{t('checkConfig')}</p>
      <div className='space-y-4'>
        <Card>
          <CardContent className='pt-6'>
            <h3 className='font-semibold mb-4'>{t('basicInfo')}</h3>
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
        <Card>
          <CardContent className='pt-6'>
            <h3 className='font-semibold mb-4'>{t('configSummary')}</h3>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-primary'>
                  {toolConfig.dynamic_params.length}
                </div>
                <div className='text-sm text-muted-foreground'>
                  {t('dynamicParams')}
                </div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-primary'>
                  {toolConfig.file_mounts.length}
                </div>
                <div className='text-sm text-muted-foreground'>
                  {t('fileMounts')}
                </div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-primary'>
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
