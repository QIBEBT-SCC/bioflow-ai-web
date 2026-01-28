'use client'

import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ToolConfigForm, type ToolConfigValues } from '@/components/tool/tool-config-form'
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
import type { DockerToolCreate, FileMount, ParamDefine, ToolTag } from '@/types/tool'

const steps = [
  { id: 1, title: '选择镜像', description: '选择或创建Docker镜像' },
  { id: 2, title: '配置工具', description: '配置工具参数和文件' },
  { id: 3, title: '确认创建', description: '确认并创建工具' },
]

export default function AddToolPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  const {
    currentImage,
    toolConfig,
    setCurrentImage,
    setToolConfig,
    updateToolConfigField: updateStoreField,
    resetStore,
  } = useCreateToolStore()
  const { data: searchResults = [] } = useSearchImages(searchQuery)
  const { data: toolGroups = [] } = useToolGroupList()
  const { data: availableTags = [] } = useToolTagList()
  const { mutate: createTool, isPending: isCreating } = useCreateTool()

  // 组件卸载时重置store
  useEffect(() => {
    return () => {
      resetStore()
    }
  }, [resetStore])

  // 处理下一步
  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  // 处理上一步
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
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
        toast.success('工具创建成功')
        router.push('/tool')
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

  const updateToolConfigField = (
    field: keyof ToolConfigValues,
    value: string | number | boolean | null | ParamDefine[] | FileMount[] | ToolTag[],
  ) => {
    updateStoreField(field, value as never)
  }

  // 添加动态参数
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

  // 更新动态参数
  const updateDynamicParam = (
    index: number,
    field: keyof ParamDefine,
    value: string | number | boolean,
  ) => {
    const updatedParams = [...toolConfig.dynamic_params]
    updatedParams[index] = { ...updatedParams[index], [field]: value }
    setToolConfig({ ...toolConfig, dynamic_params: updatedParams })
  }

  // 删除动态参数
  const removeDynamicParam = (index: number) => {
    const updatedParams = [...toolConfig.dynamic_params]
    updatedParams.splice(index, 1)
    // 重新排序索引
    updatedParams.forEach((param, idx) => {
      param.index = idx
    })
    setToolConfig({ ...toolConfig, dynamic_params: updatedParams })
  }

  // 添加文件挂载
  const addFileMount = () => {
    setToolConfig({
      ...toolConfig,
      file_mounts: [
        ...toolConfig.file_mounts,
        {
          name: '',
          description: '',
          file_path: '',
          file_type: 'OUTPUT',
          is_report: false,
          is_log: false,
          mount_path: '',
        },
      ],
    })
  }

  // 更新文件挂载
  const updateFileMount = (
    index: number,
    field: keyof FileMount,
    value: string | boolean,
  ) => {
    const updatedFiles = [...toolConfig.file_mounts]
    updatedFiles[index] = { ...updatedFiles[index], [field]: value }
    setToolConfig({ ...toolConfig, file_mounts: updatedFiles })
  }

  // 删除文件挂载
  const removeFileMount = (index: number) => {
    const updatedFiles = [...toolConfig.file_mounts]
    updatedFiles.splice(index, 1)
    setToolConfig({ ...toolConfig, file_mounts: updatedFiles })
  }

  return (
    <SidebarInset className='h-screen flex flex-col'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center gap-2 px-4 h-12 bg-background'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='!mr-2 !h-4' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbLink asChild>
                  <Link href='/tool'>工具</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className='hidden md:block' />
              <BreadcrumbItem>
                <BreadcrumbPage>添加工具</BreadcrumbPage>
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
              <ArrowLeft className='h-4 w-4 mr-1' />
              返回
            </Link>
            <h1 className='text-2xl font-bold'>添加新工具</h1>
            <p className='text-muted-foreground mt-1'>
              通过3个步骤创建自定义分析工具
            </p>
          </div>

          {/* 进度条 */}
          <Card className='mb-8 py-4'>
            <CardContent className='py-0'>
              <div className='flex items-center justify-between'>
                {steps.map((step, index) => (
                  <div key={step.id} className='flex items-center'>
                    <div className='flex flex-col items-center'>
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep > step.id
                            ? 'bg-green-500 text-white'
                            : currentStep === step.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {currentStep > step.id ? (
                          <Check className='h-5 w-5' />
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

          {/* 步骤内容 */}
          <div className='mb-8'>
            {/* 步骤1: 选择镜像 */}
            {currentStep === 1 && (
              <div>
                <h2 className='text-xl font-semibold mb-2'>选择Docker镜像</h2>
                <p className='text-muted-foreground mb-6'>
                  搜索并选择要使用的Docker镜像
                </p>

                <div className='mb-6'>
                  <Input
                    placeholder='搜索镜像...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {searchResults.map((image) => (
                    <Card
                      key={image.uid}
                      className={`pt-2 cursor-pointer transition-all hover:shadow-md border-2 ${
                        currentImage?.uid === image.uid
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setCurrentImage(image)}
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
                    <p>未找到匹配的镜像</p>
                  </div>
                )}
              </div>
            )}

            {/* 步骤2: 配置工具 */}
            {currentStep === 2 && (
              <div>
                <h2 className='text-xl font-semibold mb-2'>配置工具</h2>
                <p className='text-muted-foreground mb-6'>
                  填写工具的基本信息和参数配置
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

            {/* 步骤3: 确认创建 */}
            {currentStep === 3 && (
              <div>
                <h2 className='text-xl font-semibold mb-2'>确认创建</h2>
                <p className='text-muted-foreground mb-6'>请检查工具配置信息</p>

                <div className='space-y-4'>
                  <Card>
                    <CardContent className='pt-6'>
                      <h3 className='font-semibold mb-4'>基本信息</h3>
                      <div className='space-y-2'>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>
                            工具名称：
                          </span>
                          <span className='font-medium'>{toolConfig.name}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>描述：</span>
                          <span className='font-medium'>
                            {toolConfig.description}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>镜像：</span>
                          <span className='font-medium'>
                            {currentImage?.name}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>
                            命令模板：
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
                      <h3 className='font-semibold mb-4'>配置汇总</h3>
                      <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                        <div className='text-center'>
                          <div className='text-2xl font-bold text-primary'>
                            {toolConfig.dynamic_params.length}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            动态参数
                          </div>
                        </div>
                        <div className='text-center'>
                          <div className='text-2xl font-bold text-primary'>
                            {toolConfig.file_mounts.length}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            文件挂载
                          </div>
                        </div>
                        <div className='text-center'>
                          <div className='text-2xl font-bold text-primary'>
                            {(toolConfig.immutable_static_params || '').length > 0 ||
                            (toolConfig.modifiable_static_params || '').length > 0
                              ? '是'
                              : '否'}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            静态参数
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>

          {/* 导航按钮 */}
          <div className='flex justify-between items-center pt-4 border-t'>
            <Button
              variant='outline'
              onClick={handlePrev}
              disabled={currentStep === 1}
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              上一步
            </Button>

            <div className='text-sm text-muted-foreground'>
              步骤 {currentStep} / {steps.length}
            </div>

            {currentStep < steps.length ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                下一步
                <ArrowRight className='h-4 w-4 ml-2' />
              </Button>
            ) : (
              <Button
                onClick={handleCreateTool}
                className='bg-green-600 hover:bg-green-700'
                disabled={!canProceed() || isCreating}
              >
                {isCreating ? '创建中...' : '创建工具'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}
