'use client'

import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ToolFileCard, ToolParamCard } from '@/components/tool/tool-cards'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateTool,
  useSearchImages,
  useToolGroupList,
} from '@/hooks/use-tool'
import { useCreateToolStore } from '@/stores/toolStore'
import type { FileMount, ParamDefine } from '@/types/tool'

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
    resetStore,
  } = useCreateToolStore()
  const { data: searchResults = [] } = useSearchImages(searchQuery)
  const { data: toolGroups = [] } = useToolGroupList()
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
    createTool(toolConfig, {
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
        return toolConfig.name && toolConfig.command_template
      case 3:
        return true
      default:
        return false
    }
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
          required: true,
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
                      className={`cursor-pointer transition-all hover:shadow-md border-2 ${
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

                {currentImage && (
                  <div className='mb-4 flex items-center gap-2'>
                    <span className='text-sm text-muted-foreground'>
                      基于镜像：
                    </span>
                    <Badge variant='outline'>{currentImage.name}</Badge>
                    <Badge variant='secondary'>{currentImage.version}</Badge>
                  </div>
                )}

                <Tabs defaultValue='basic' className='w-full'>
                  <TabsList className='grid w-full grid-cols-3'>
                    <TabsTrigger value='basic'>
                      基本信息
                      {toolConfig.name && (
                        <Badge variant='outline' className='ml-2'>
                          {toolConfig.name}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value='params'>
                      参数配置
                      {toolConfig.dynamic_params.length > 0 && (
                        <Badge variant='outline' className='ml-2'>
                          {toolConfig.dynamic_params.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value='files'>
                      文件挂载
                      {toolConfig.file_mounts.length > 0 && (
                        <Badge variant='outline' className='ml-2'>
                          {toolConfig.file_mounts.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* 基本信息 */}
                  <TabsContent value='basic'>
                    <Card>
                      <CardContent className='space-y-6 pt-6'>
                        <div className='space-y-2'>
                          <Label htmlFor='name'>
                            工具名称 <span className='text-red-500'>*</span>
                          </Label>
                          <Input
                            id='name'
                            value={toolConfig.name}
                            onChange={(e) =>
                              setToolConfig({
                                ...toolConfig,
                                name: e.target.value,
                              })
                            }
                            placeholder='输入工具名称'
                            required
                          />
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='description'>
                            描述 <span className='text-red-500'>*</span>
                          </Label>
                          <Textarea
                            id='description'
                            value={toolConfig.description}
                            onChange={(e) =>
                              setToolConfig({
                                ...toolConfig,
                                description: e.target.value,
                              })
                            }
                            placeholder='描述工具的功能'
                            rows={3}
                          />
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='command_template'>
                            命令模板 <span className='text-red-500'>*</span>
                          </Label>
                          <Input
                            id='command_template'
                            value={toolConfig.command_template}
                            onChange={(e) =>
                              setToolConfig({
                                ...toolConfig,
                                command_template: e.target.value,
                              })
                            }
                            placeholder='tool {dynamic_params} {static_params}'
                            required
                          />
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='group_id'>工具分组</Label>
                          <Select
                            value={toolConfig.group_id.toString()}
                            onValueChange={(value) =>
                              setToolConfig({
                                ...toolConfig,
                                group_id: Number.parseInt(value),
                              })
                            }
                          >
                            <SelectTrigger id='group_id'>
                              <SelectValue placeholder='选择分组' />
                            </SelectTrigger>
                            <SelectContent>
                              {toolGroups.map((group) => (
                                <SelectItem
                                  key={group.id}
                                  value={group.id.toString()}
                                >
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className='flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4'>
                          <div className='flex items-center space-x-2'>
                            <Checkbox
                              id='mkdir_output'
                              checked={toolConfig.mkdir_output}
                              onCheckedChange={(checked) =>
                                setToolConfig({
                                  ...toolConfig,
                                  mkdir_output: checked as boolean,
                                })
                              }
                            />
                            <Label htmlFor='mkdir_output'>创建输出目录</Label>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <Checkbox
                              id='use_temp_dir'
                              checked={toolConfig.use_temp_dir}
                              onCheckedChange={(checked) =>
                                setToolConfig({
                                  ...toolConfig,
                                  use_temp_dir: checked as boolean,
                                })
                              }
                            />
                            <Label htmlFor='use_temp_dir'>使用临时目录</Label>
                          </div>
                        </div>

                        {/* AI生成按钮占位 */}
                        <div className='flex justify-end pt-4 border-t'>
                          <Button variant='outline' disabled>
                            <Sparkles className='h-4 w-4 mr-2' />
                            AI智能生成配置
                            <Badge variant='secondary' className='ml-2'>
                              即将推出
                            </Badge>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* 参数配置 */}
                  <TabsContent value='params'>
                    <Card>
                      <CardContent className='space-y-6 pt-6'>
                        <div className='space-y-2'>
                          <Label>动态参数</Label>
                          {toolConfig.dynamic_params.length === 0 ? (
                            <div className='text-center py-6 text-muted-foreground border rounded-md bg-muted/30'>
                              暂无动态参数
                            </div>
                          ) : (
                            <div className='space-y-4'>
                              {toolConfig.dynamic_params.map((param, index) => (
                                <ToolParamCard
                                  key={`param-${index}-${param.command}`}
                                  param={param}
                                  index={index}
                                  onRemove={removeDynamicParam}
                                  onUpdate={updateDynamicParam}
                                />
                              ))}
                            </div>
                          )}
                          <Button
                            type='button'
                            onClick={addDynamicParam}
                            variant='outline'
                            className='w-full'
                          >
                            添加动态参数
                          </Button>
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='static_params'>固定参数</Label>
                          <Textarea
                            id='static_params'
                            value={toolConfig.static_params}
                            onChange={(e) =>
                              setToolConfig({
                                ...toolConfig,
                                static_params: e.target.value,
                              })
                            }
                            placeholder='--threads 4 --output /output'
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* 文件挂载 */}
                  <TabsContent value='files'>
                    <Card>
                      <CardContent className='space-y-6 pt-6'>
                        <div className='space-y-2'>
                          <Label>文件挂载</Label>
                          {toolConfig.file_mounts.length === 0 ? (
                            <div className='text-center py-6 text-muted-foreground border rounded-md bg-muted/30'>
                              暂无文件挂载
                            </div>
                          ) : (
                            <div className='space-y-4'>
                              {toolConfig.file_mounts.map((file, index) => (
                                <ToolFileCard
                                  key={`file-${index}-${file.name}`}
                                  file={file}
                                  index={index}
                                  onUpdate={updateFileMount}
                                  onRemove={removeFileMount}
                                />
                              ))}
                            </div>
                          )}
                          <Button
                            type='button'
                            onClick={addFileMount}
                            variant='outline'
                            className='w-full'
                          >
                            添加文件挂载
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
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
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
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
                            {toolConfig.mkdir_output ? '是' : '否'}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            创建输出目录
                          </div>
                        </div>
                        <div className='text-center'>
                          <div className='text-2xl font-bold text-primary'>
                            {toolConfig.use_temp_dir ? '是' : '否'}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            使用临时目录
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
