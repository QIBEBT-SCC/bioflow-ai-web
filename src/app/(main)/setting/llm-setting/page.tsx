'use client'

import {
  ChevronDownIcon,
  ChevronRightIcon,
  Edit2Icon,
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  SaveIcon,
  SettingsIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Switch } from '@/components/ui/switch'
import {
  useCreateLLMModel,
  useCreateLLMProvider,
  useDeleteLLMModel,
  useDeleteLLMProvider,
  useLLMProviders,
  useUpdateLLMModel,
  useUpdateLLMProvider,
} from '@/hooks/use-setting'
import type {
  LLMModelCreate,
  LLMModelUpdate,
  LLMProviderCreate,
  LLMProviderUpdate, ProviderType,
} from '@/types/setting'

export default function LLMSettingPage() {
  const { data: serverProviders = [], isLoading } = useLLMProviders()
  const createProviderMutation = useCreateLLMProvider()
  const updateProviderMutation = useUpdateLLMProvider()
  const deleteProviderMutation = useDeleteLLMProvider()
  const createModelMutation = useCreateLLMModel()
  const updateModelMutation = useUpdateLLMModel()
  const deleteModelMutation = useDeleteLLMModel()

  // UI State
  const [openProviderIds, setOpenProviderIds] = useState<
    Record<number, boolean>
  >({})
  const [showApiKeys, setShowApiKeys] = useState<Record<number, boolean>>({})

  // Edit State
  const [editingProviderId, setEditingProviderId] = useState<number | null>(
    null,
  )
  const [draftProvider, setDraftProvider] = useState<LLMProviderUpdate | null>(
    null,
  )

  const [editingModelId, setEditingModelId] = useState<number | null>(null)
  const [draftModel, setDraftModel] = useState<LLMModelUpdate | null>(null)

  const [addProviderOpen, setAddProviderOpen] = useState(false)
  const [addModelProviderId, setAddModelProviderId] = useState<number | null>(
    null,
  )
  const [newProvider, setNewProvider] = useState<LLMProviderCreate>({
    name: '',
    provider_type: 'openai',
    base_url: '',
    api_key: '',
    use_proxy: false,
    is_active: true,
  })
  const [newModel, setNewModel] = useState<Omit<LLMModelCreate, 'provider_id'>>(
    {
      name: '',
      input_price: 0,
      output_price: 0,
      cache_read_price: 0,
      extra_body: {},
      is_active: true,
    },
  )

  const toggleProvider = (providerId: number) => {
    setOpenProviderIds((prev) => ({
      ...prev,
      [providerId]: !prev[providerId],
    }))
  }

  const toggleApiKeyVisibility = (providerId: number) => {
    setShowApiKeys((prev) => ({
      ...prev,
      [providerId]: !prev[providerId],
    }))
  }

  const handleAddProvider = async () => {
    if (!newProvider.name) return
    await createProviderMutation.mutateAsync(newProvider)
    setAddProviderOpen(false)
    setNewProvider({
      name: '',
      provider_type: 'openai',
      base_url: '',
      api_key: '',
      use_proxy: false,
      is_active: true,
    })
  }

  const deleteProvider = async (providerId: number) => {
    await deleteProviderMutation.mutateAsync(providerId)
    if (editingProviderId === providerId) {
      setEditingProviderId(null)
      setDraftProvider(null)
    }
  }

  const handleAddModel = async () => {
    if (!addModelProviderId) return

    const modelCreate: LLMModelCreate = {
      provider_id: addModelProviderId,
      name: newModel.name,
      input_price: Number(newModel.input_price),
      output_price: Number(newModel.output_price),
      cache_read_price: Number(newModel.cache_read_price),
      extra_body: newModel.extra_body,
      is_active: newModel.is_active,
    }

    await createModelMutation.mutateAsync(modelCreate)
    setAddModelProviderId(null)
    setNewModel({
      name: '',
      input_price: 0,
      output_price: 0,
      cache_read_price: 0,
      extra_body: {},
      is_active: true,
    })
  }

  const deleteModel = async (modelId: number) => {
    await deleteModelMutation.mutateAsync(modelId)
    if (editingModelId === modelId) {
      setEditingModelId(null)
      setDraftModel(null)
    }
  }

  // Provider Actions
  const startEditingProvider = (providerId: number) => {
    const provider = serverProviders.find(
      (p) => p.id.toString() === providerId.toString(),
    )
    if (provider) {
      setEditingProviderId(providerId)
      setDraftProvider({
        name: provider.name,
        provider_type: provider.provider_type,
        base_url: provider.base_url,
        api_key: provider.api_key,
        use_proxy: provider.use_proxy,
        is_active: provider.is_active,
      })
    }
  }

  const saveProvider = async () => {
    if (editingProviderId && draftProvider) {
      await updateProviderMutation.mutateAsync({
        id: editingProviderId,
        data: draftProvider,
      })
      setEditingProviderId(null)
      setDraftProvider(null)
    }
  }

  const cancelEditProvider = () => {
    setEditingProviderId(null)
    setDraftProvider(null)
  }

  const toggleProviderActive = async (providerId: string, checked: boolean) => {
    await updateProviderMutation.mutateAsync({
      id: parseInt(providerId),
      data: { is_active: checked },
    })
  }

  // Model Actions
  const startEditingModel = (providerId: number, modelId: number) => {
    const provider = serverProviders.find((p) => p.id === providerId)
    const model = provider?.models.find((m) => m.id === modelId)

    if (model) {
      setEditingModelId(modelId)
      setDraftModel({
        name: model.name,
        input_price: model.input_price,
        output_price: model.output_price,
        cache_read_price: model.cache_read_price,
        extra_body: model.extra_body,
        is_active: model.is_active,
      })
    }
  }

  const saveModel = async () => {
    if (editingModelId && draftModel) {
      await updateModelMutation.mutateAsync({
        id: editingModelId,
        data: draftModel,
      })
      setEditingModelId(null)
      setDraftModel(null)
    }
  }

  const cancelEditModel = () => {
    setEditingModelId(null)
    setDraftModel(null)
  }

  const toggleModelActive = async (modelId: number, checked: boolean) => {
    await updateModelMutation.mutateAsync({
      id: modelId,
      data: { is_active: checked },
    })
  }

  const updateDraftProvider = (field: keyof LLMProviderUpdate, value: any) => {
    setDraftProvider((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  const updateDraftModel = (field: keyof LLMModelUpdate, value: any) => {
    setDraftModel((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  const isEditingProvider = (providerId: number) => {
    return editingProviderId === providerId
  }

  const isEditingModel = (modelId: number) => {
    return editingModelId === modelId
  }
  return (
    <SidebarInset className='h-screen flex flex-col'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center justify-between px-4 h-12 bg-background'>
          <div className='flex items-center gap-2'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='!mr-2 !h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbPage>模型统计</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </header>
      <main className='flex-1 overflow-y-auto'>
        <div className='container mx-auto px-6 py-8 max-w-7xl space-y-8'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-2'>
              <SettingsIcon className='h-8 w-8 text-primary' />
              <h1 className='text-4xl font-bold text-balance'>模型设置</h1>
            </div>
            <p className='text-muted-foreground text-pretty'>
              管理 AI 模型提供商和定价配置
            </p>
          </div>

          {/* Main Content */}
          <div className='space-y-4'>
            <div className='flex justify-end'>
              <Dialog open={addProviderOpen} onOpenChange={setAddProviderOpen}>
                <DialogTrigger asChild>
                  <Button className='gap-2'>
                    <PlusIcon className='h-4 w-4' />
                    添加 Provider
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-[500px]'>
                  <DialogHeader>
                    <DialogTitle>添加新 Provider</DialogTitle>
                    <DialogDescription>
                      配置新的 AI 模型提供商
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='new-provider-name'>Provider 名称</Label>
                      <Input
                        id='new-provider-name'
                        value={newProvider.name}
                        onChange={(e) =>
                          setNewProvider({
                            ...newProvider,
                            name: e.target.value,
                          })
                        }
                        placeholder='OpenAI, Anthropic, etc.'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='new-provider-type'>Provider 类型</Label>
                      <Select
                        value={newProvider.provider_type}
                        onValueChange={(value) =>
                          setNewProvider({
                            ...newProvider,
                            provider_type: value as ProviderType,
                          })
                        }
                      >
                        <SelectTrigger id='new-provider-type'>
                          <SelectValue placeholder='选择类型' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={'openai'}>OpenAI</SelectItem>
                          <SelectItem value={'anthropic'}>Anthropic</SelectItem>
                          <SelectItem value={'google'}>Google</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='new-provider-baseurl'>Base URL</Label>
                      <Input
                        id='new-provider-baseurl'
                        value={newProvider.base_url}
                        onChange={(e) =>
                          setNewProvider({
                            ...newProvider,
                            base_url: e.target.value,
                          })
                        }
                        placeholder='https://api.provider.com/v1'
                        className='font-mono text-sm'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='new-provider-apikey'>API Key</Label>
                      <Input
                        id='new-provider-apikey'
                        type='password'
                        value={newProvider.api_key || ''}
                        onChange={(e) =>
                          setNewProvider({
                            ...newProvider,
                            api_key: e.target.value,
                          })
                        }
                        placeholder='sk-...'
                        className='font-mono text-sm'
                      />
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label htmlFor='new-provider-proxy'>使用网络代理</Label>
                        <p className='text-xs text-muted-foreground'>
                          通过代理服务器访问 API
                        </p>
                      </div>
                      <Switch
                        id='new-provider-proxy'
                        checked={newProvider.use_proxy}
                        onCheckedChange={(checked) =>
                          setNewProvider({ ...newProvider, use_proxy: checked })
                        }
                      />
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label htmlFor='new-provider-active'>
                          启用 Provider
                        </Label>
                        <p className='text-xs text-muted-foreground'>
                          是否激活此 Provider
                        </p>
                      </div>
                      <Switch
                        id='new-provider-active'
                        checked={newProvider.is_active}
                        onCheckedChange={(checked) =>
                          setNewProvider({ ...newProvider, is_active: checked })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => setAddProviderOpen(false)}
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleAddProvider}
                      disabled={!newProvider.name}
                    >
                      添加
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Providers List */}
            {serverProviders.map((provider) => (
              <Card key={provider.id} className='border-border bg-card py-0'>
                <Collapsible
                  open={openProviderIds[provider.id]}
                  onOpenChange={() => toggleProvider(provider.id)}
                >
                  <div className='p-6'>
                    {/* Provider Header */}
                    <div className='flex items-center justify-between mb-4'>
                      <div className='flex items-center gap-3 flex-1'>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 w-8 p-0'
                          >
                            {openProviderIds[provider.id] ? (
                              <ChevronDownIcon className='h-4 w-4' />
                            ) : (
                              <ChevronRightIcon className='h-4 w-4' />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        {isEditingProvider(provider.id) ? (
                          <Input
                            value={draftProvider?.name || ''}
                            onChange={(e) =>
                              updateDraftProvider('name', e.target.value)
                            }
                            className='max-w-xs font-semibold text-lg bg-background'
                            placeholder='Provider 名称'
                          />
                        ) : (
                          <h2 className='font-semibold text-lg'>
                            {provider.name}
                          </h2>
                        )}
                        <Badge variant='secondary' className='ml-2'>
                          {provider.models.length} 个模型
                        </Badge>
                        <Badge variant='outline' className='ml-1 capitalize'>
                          {provider.provider_type}
                        </Badge>
                        {provider.use_proxy && (
                          <Badge variant='outline' className='ml-1'>
                            使用代理
                          </Badge>
                        )}
                        {provider.is_active && (
                          <Badge variant='destructive' className='ml-1 bg-green-500 text-white'>
                            激活
                          </Badge>
                        )}
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm text-muted-foreground'>
                            激活
                          </span>
                          <Switch
                            checked={provider.is_active}
                            onCheckedChange={(checked) =>
                              toggleProviderActive(
                                provider.id.toString(),
                                checked,
                              )
                            }
                          />
                        </div>
                        {isEditingProvider(provider.id) ? (
                          <>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={saveProvider}
                              className='gap-2 bg-transparent'
                            >
                              <SaveIcon className='h-4 w-4' />
                              保存
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={cancelEditProvider}
                              className='gap-2 bg-transparent'
                            >
                              <XIcon className='h-4 w-4' />
                              取消
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => startEditingProvider(provider.id)}
                            className='gap-2'
                          >
                            <Edit2Icon className='h-4 w-4' />
                            编辑
                          </Button>
                        )}
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => deleteProvider(provider.id)}
                          className='text-destructive hover:text-destructive'
                        >
                          <Trash2Icon className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>

                    <CollapsibleContent>
                      {/* Provider Settings */}
                      <div className='space-y-4 mb-6 pl-11'>
                        {isEditingProvider(provider.id) ? (
                          // Edit Mode
                          <>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                              <div className='space-y-2'>
                                <Label htmlFor={`provider-type-${provider.id}`}>
                                  Provider 类型
                                </Label>
                                <Select
                                  value={draftProvider?.provider_type}
                                  onValueChange={(value) =>
                                    updateDraftProvider('provider_type', value)
                                  }
                                >
                                  <SelectTrigger
                                    id={`provider-type-${provider.id}`}
                                    className='bg-background'
                                  >
                                    <SelectValue placeholder='选择类型' />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={'openai'}>
                                      OpenAI
                                    </SelectItem>
                                    <SelectItem value={'anthropic'}>
                                      Anthropic
                                    </SelectItem>
                                    <SelectItem value={'google'}>
                                      Google
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className='space-y-2'>
                                <Label htmlFor={`baseurl-${provider.id}`}>
                                  Base URL
                                </Label>
                                <Input
                                  id={`baseurl-${provider.id}`}
                                  value={draftProvider?.base_url || ''}
                                  onChange={(e) =>
                                    updateDraftProvider(
                                      'base_url',
                                      e.target.value,
                                    )
                                  }
                                  placeholder='https://api.provider.com/v1'
                                  className='font-mono text-sm bg-background'
                                />
                              </div>
                              <div className='space-y-2'>
                                <Label htmlFor={`apikey-${provider.id}`}>
                                  API Key
                                </Label>
                                <div className='relative'>
                                  <Input
                                    id={`apikey-${provider.id}`}
                                    type={
                                      showApiKeys[provider.id]
                                        ? 'text'
                                        : 'password'
                                    }
                                    value={draftProvider?.api_key || ''}
                                    onChange={(e) =>
                                      updateDraftProvider(
                                        'api_key',
                                        e.target.value,
                                      )
                                    }
                                    placeholder='sk-...'
                                    className='font-mono text-sm pr-10 bg-background'
                                  />
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    className='absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0'
                                    onClick={() =>
                                      toggleApiKeyVisibility(provider.id)
                                    }
                                  >
                                    {showApiKeys[provider.id] ? (
                                      <EyeOffIcon className='h-4 w-4' />
                                    ) : (
                                      <EyeIcon className='h-4 w-4' />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className='flex items-center justify-between max-w-md'>
                              <div className='space-y-0.5'>
                                <Label htmlFor={`proxy-${provider.id}`}>
                                  使用网络代理
                                </Label>
                                <p className='text-xs text-muted-foreground'>
                                  通过代理服务器访问 API
                                </p>
                              </div>
                              <Switch
                                id={`proxy-${provider.id}`}
                                checked={draftProvider?.use_proxy}
                                onCheckedChange={(checked) =>
                                  updateDraftProvider('use_proxy', checked)
                                }
                              />
                            </div>
                            <div className='flex items-center justify-between max-w-md'>
                              <div className='space-y-0.5'>
                                <Label htmlFor={`active-${provider.id}`}>
                                  启用 Provider
                                </Label>
                                <p className='text-xs text-muted-foreground'>
                                  是否激活此 Provider
                                </p>
                              </div>
                              <Switch
                                id={`active-${provider.id}`}
                                checked={draftProvider?.is_active}
                                onCheckedChange={(checked) =>
                                  updateDraftProvider('is_active', checked)
                                }
                              />
                            </div>
                          </>
                        ) : (
                          // View Mode
                          <div className='space-y-3 text-sm'>
                            <div className='flex items-start gap-8'>
                              <div className='space-y-1 min-w-[120px]'>
                                <p className='text-muted-foreground'>
                                  Provider 类型
                                </p>
                                <p className='capitalize'>
                                  {provider.provider_type}
                                </p>
                              </div>
                              <div className='space-y-1 min-w-[120px]'>
                                <p className='text-muted-foreground'>
                                  Base URL
                                </p>
                                <p className='font-mono'>
                                  {provider.base_url || '未设置'}
                                </p>
                              </div>
                              <div className='space-y-1 min-w-[120px]'>
                                <p className='text-muted-foreground'>API Key</p>
                                <p className='font-mono'>
                                  {provider.api_key
                                    ? '••••••••' + provider.api_key.slice(-4)
                                    : '未设置'}
                                </p>
                              </div>
                              <div className='space-y-1 min-w-[120px]'>
                                <p className='text-muted-foreground'>
                                  网络代理
                                </p>
                                <p>
                                  {provider.use_proxy ? '已启用' : '未启用'}
                                </p>
                              </div>
                              <div className='space-y-1 min-w-[120px]'>
                                <p className='text-muted-foreground'>
                                  激活状态
                                </p>
                                <p>
                                  {provider.is_active ? '已激活' : '未激活'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Models Section */}
                      <div className='pl-11 space-y-4'>
                        <div className='flex justify-between items-center mb-4'>
                          <h4 className='text-sm font-medium'>模型列表</h4>
                          <Dialog
                            open={addModelProviderId === provider.id}
                            onOpenChange={(open) => {
                              if (!open) setAddModelProviderId(null)
                              else setAddModelProviderId(provider.id)
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant='outline'
                                size='sm'
                                className='gap-2'
                              >
                                <PlusIcon className='h-3 w-3' />
                                添加模型
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>添加新模型</DialogTitle>
                                <DialogDescription>
                                  为 {provider.name} 添加一个新的 LLM 模型
                                </DialogDescription>
                              </DialogHeader>
                              <div className='space-y-4 py-4'>
                                <div className='space-y-2'>
                                  <Label htmlFor='new-model-name'>
                                    模型名称
                                  </Label>
                                  <Input
                                    id='new-model-name'
                                    value={newModel.name}
                                    onChange={(e) =>
                                      setNewModel({
                                        ...newModel,
                                        name: e.target.value,
                                      })
                                    }
                                    placeholder='gpt-4, claude-3-opus, etc.'
                                  />
                                </div>
                                <div className='grid grid-cols-2 gap-4'>
                                  <div className='space-y-2'>
                                    <Label htmlFor='new-model-input'>
                                      输入价格 ($/1k tokens)
                                    </Label>
                                    <Input
                                      id='new-model-input'
                                      type='number'
                                      step='0.0001'
                                      value={newModel.input_price}
                                      onChange={(e) =>
                                        setNewModel({
                                          ...newModel,
                                          input_price: Number(e.target.value),
                                        })
                                      }
                                    />
                                  </div>
                                  <div className='space-y-2'>
                                    <Label htmlFor='new-model-output'>
                                      输出价格 ($/1k tokens)
                                    </Label>
                                    <Input
                                      id='new-model-output'
                                      type='number'
                                      step='0.0001'
                                      value={newModel.output_price}
                                      onChange={(e) =>
                                        setNewModel({
                                          ...newModel,
                                          output_price: Number(e.target.value),
                                        })
                                      }
                                    />
                                  </div>
                                  <div className='space-y-2'>
                                    <Label htmlFor='new-model-cache'>
                                      缓存价格 ($/1k tokens)
                                    </Label>
                                    <Input
                                      id='new-model-cache'
                                      type='number'
                                      step='0.0001'
                                      value={newModel.cache_read_price}
                                      onChange={(e) =>
                                        setNewModel({
                                          ...newModel,
                                          cache_read_price: Number(
                                            e.target.value,
                                          ),
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                                <div className='flex items-center justify-between'>
                                  <div className='space-y-0.5'>
                                    <Label htmlFor='new-model-active'>
                                      启用模型
                                    </Label>
                                    <p className='text-xs text-muted-foreground'>
                                      是否激活此模型
                                    </p>
                                  </div>
                                  <Switch
                                    id='new-model-active'
                                    checked={newModel.is_active}
                                    onCheckedChange={(checked) =>
                                      setNewModel({
                                        ...newModel,
                                        is_active: checked,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant='outline'
                                  onClick={() => setAddModelProviderId(null)}
                                >
                                  取消
                                </Button>
                                <Button
                                  onClick={handleAddModel}
                                  disabled={!newModel.name}
                                >
                                  添加
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {/* Models List */}
                        <div className='space-y-3'>
                          {provider.models.map((model) => (
                            <Card key={model.id} className='border bg-muted/30'>
                              <div className='p-4'>
                                <div className='flex items-center justify-between mb-3'>
                                  <div className='flex items-center gap-3'>
                                    {isEditingModel(model.id) ? (
                                      <Input
                                        value={draftModel?.name || ''}
                                        onChange={(e) =>
                                          updateDraftModel(
                                            'name',
                                            e.target.value,
                                          )
                                        }
                                        className='h-8 w-[180px] font-mono text-sm bg-background'
                                      />
                                    ) : (
                                      <Badge
                                        variant='secondary'
                                        className='font-mono text-sm'
                                      >
                                        {model.name}
                                      </Badge>
                                    )}

                                    <div className='flex items-center gap-2'>
                                      <span className='text-xs text-muted-foreground'>
                                        激活
                                      </span>
                                      <Switch
                                        checked={model.is_active}
                                        onCheckedChange={(checked) =>
                                          toggleModelActive(model.id, checked)
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className='flex items-center gap-1'>
                                    {isEditingModel(model.id) ? (
                                      <>
                                        <Button
                                          variant='outline'
                                          size='sm'
                                          onClick={saveModel}
                                          className='h-8 gap-2 bg-transparent'
                                        >
                                          <SaveIcon className='h-3 w-3' />
                                        </Button>
                                        <Button
                                          variant='outline'
                                          size='sm'
                                          onClick={() => cancelEditModel()}
                                          className='h-8 gap-2 bg-transparent'
                                        >
                                          <XIcon className='h-3 w-3' />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          variant='ghost'
                                          size='sm'
                                          onClick={() =>
                                            startEditingModel(
                                              provider.id,
                                              model.id,
                                            )
                                          }
                                          className='h-8'
                                        >
                                          <Edit2Icon className='h-3 w-3' />
                                        </Button>
                                        <Button
                                          variant='ghost'
                                          size='sm'
                                          onClick={() => deleteModel(model.id)}
                                          className='h-8 text-destructive hover:text-destructive'
                                        >
                                          <Trash2Icon className='h-3 w-3' />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {isEditingModel(model.id) ? (
                                  // Edit Mode
                                  <div className='space-y-3'>
                                    <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                                      <div className='space-y-1'>
                                        <Label
                                          htmlFor={`input-price-${model.id}`}
                                          className='text-xs'
                                        >
                                          Input ($/1k)
                                        </Label>
                                        <Input
                                          id={`input-price-${model.id}`}
                                          type='number'
                                          step='0.0001'
                                          value={draftModel?.input_price ?? 0}
                                          onChange={(e) =>
                                            updateDraftModel(
                                              'input_price',
                                              Number(e.target.value),
                                            )
                                          }
                                          className='h-8 text-xs bg-background'
                                        />
                                      </div>
                                      <div className='space-y-1'>
                                        <Label
                                          htmlFor={`output-price-${model.id}`}
                                          className='text-xs'
                                        >
                                          Output ($/1k)
                                        </Label>
                                        <Input
                                          id={`output-price-${model.id}`}
                                          type='number'
                                          step='0.0001'
                                          value={draftModel?.output_price ?? 0}
                                          onChange={(e) =>
                                            updateDraftModel(
                                              'output_price',
                                              Number(e.target.value),
                                            )
                                          }
                                          className='h-8 text-xs bg-background'
                                        />
                                      </div>
                                      <div className='space-y-1'>
                                        <Label
                                          htmlFor={`cache-read-price-${model.id}`}
                                          className='text-xs'
                                        >
                                          Cache Read ($/1k)
                                        </Label>
                                        <Input
                                          id={`cache-read-price-${model.id}`}
                                          type='number'
                                          step='0.0001'
                                          value={
                                            draftModel?.cache_read_price ?? 0
                                          }
                                          onChange={(e) =>
                                            updateDraftModel(
                                              'cache_read_price',
                                              Number(e.target.value),
                                            )
                                          }
                                          className='h-8 text-xs bg-background'
                                        />
                                      </div>
                                      <div className='flex items-center gap-2 pt-4'>
                                        <Label
                                          htmlFor={`model-active-${model.id}`}
                                          className='text-xs'
                                        >
                                          激活
                                        </Label>
                                        <Switch
                                          id={`model-active-${model.id}`}
                                          checked={draftModel?.is_active}
                                          onCheckedChange={(checked) =>
                                            updateDraftModel(
                                              'is_active',
                                              checked,
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  // View Mode - Updated field names
                                  <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                                    <div className='space-y-1'>
                                      <p className='text-xs text-muted-foreground'>
                                        Input Price
                                      </p>
                                      <p className='font-medium'>
                                        ${model.input_price}/1K tokens
                                      </p>
                                    </div>
                                    <div className='space-y-1'>
                                      <p className='text-xs text-muted-foreground'>
                                        Output Price
                                      </p>
                                      <p className='font-medium'>
                                        ${model.output_price}/1K tokens
                                      </p>
                                    </div>
                                    <div className='space-y-1'>
                                      <p className='text-xs text-muted-foreground'>
                                        Cache Read Price
                                      </p>
                                      <p className='font-medium'>
                                        ${model.cache_read_price}/1K tokens
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}

                          {provider.models.length === 0 && (
                            <div className='text-center py-8 text-muted-foreground text-sm'>
                              暂无模型配置，点击上方按钮添加模型
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </Card>
            ))}

            {serverProviders.length === 0 && (
              <Card className='p-12 text-center'>
                <SettingsIcon className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
                <h3 className='text-lg font-semibold mb-2'>
                  暂无 Provider 配置
                </h3>
                <p className='text-muted-foreground mb-4'>
                  开始添加您的第一个 AI 模型提供商
                </p>
                <Dialog
                  open={addProviderOpen}
                  onOpenChange={setAddProviderOpen}
                >
                  <DialogTrigger asChild>
                    <Button className='gap-2'>
                      <PlusIcon className='h-4 w-4' />
                      添加 Provider
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </Card>
            )}
          </div>
        </div>
      </main>
    </SidebarInset>
  )
}
