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


enum ProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
}

interface LLMModel {
  id: string
  provider_id: string
  name: string
  input_price: string
  output_price: string
  cache_read_price: string
  extra_body: Record<string, any>
  is_active: boolean
}

interface LLMProvider {
  id: string
  name: string
  provider_type: ProviderType
  base_url: string
  api_key: string
  use_proxy: boolean
  is_active: boolean
  models: LLMModel[]
  isOpen: boolean
}

const initialProviders: LLMProvider[] = [
  {
    id: '1',
    name: 'OpenAI',
    provider_type: ProviderType.OPENAI,
    base_url: 'https://api.openai.com/v1',
    api_key: 'sk-proj-...',
    use_proxy: false,
    is_active: true,
    isOpen: true,
    models: [
      {
        id: '1',
        provider_id: '1',
        name: 'gpt-4-turbo',
        input_price: '0.01',
        output_price: '0.03',
        cache_read_price: '0.001',
        extra_body: {},
        is_active: true,
      },
      {
        id: '1',
        provider_id: '1',
        name: 'gpt-3.5-turbo',
        input_price: '0.0005',
        output_price: '0.0015',
        cache_read_price: '0.00005',
        extra_body: {},
        is_active: true,
      },
    ],
  },
  {
    id: '2',
    name: 'Anthropic',
    provider_type: ProviderType.ANTHROPIC,
    base_url: 'https://api.anthropic.com/v1',
    api_key: 'sk-ant-...',
    use_proxy: true,
    is_active: true,
    isOpen: false,
    models: [
      {
        id: '3',
        provider_id: '3',
        name: 'claude-3-opus',
        input_price: '0.015',
        output_price: '0.075',
        cache_read_price: '0.0015',
        extra_body: {},
        is_active: true,
      },
    ],
  },
]

export default function LLMSettingPage() {
  const [providers, setProviders] = useState<LLMProvider[]>(initialProviders)
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [editingProvider, setEditingProvider] = useState<string | null>(null)
  const [editingModel, setEditingModel] = useState<string | null>(null)
  const [providerBackup, setProviderBackup] = useState<LLMProvider | null>(null)
  const [modelBackup, setModelBackup] = useState<LLMModel | null>(null)

  const [addProviderOpen, setAddProviderOpen] = useState(false)
  const [addModelProviderId, setAddModelProviderId] = useState<string | null>(
    null,
  )
  const [newProvider, setNewProvider] = useState({
    name: '',
    provider_type: ProviderType.OPENAI,
    base_url: '',
    api_key: '',
    use_proxy: false,
    is_active: true,
  })
  const [newModel, setNewModel] = useState({
    name: '',
    input_price: '0',
    output_price: '0',
    cache_read_price: '0',
    extra_body: {},
    is_active: true,
  })

  const toggleProvider = (providerId: string) => {
    setProviders(
      providers.map((p) =>
        p.id === providerId ? { ...p, isOpen: !p.isOpen } : p,
      ),
    )
  }

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys((prev) => ({
      ...prev,
      [providerId]: !prev[providerId],
    }))
  }

  const handleAddProvider = () => {
    const provider: LLMProvider = {
      id: Date.now().toString(),
      name: newProvider.name,
      provider_type: newProvider.provider_type,
      base_url: newProvider.base_url,
      api_key: newProvider.api_key,
      use_proxy: newProvider.use_proxy,
      is_active: newProvider.is_active,
      models: [],
      isOpen: true,
    }
    setProviders([...providers, provider])
    setAddProviderOpen(false)
    setNewProvider({
      name: '',
      provider_type: ProviderType.OPENAI,
      base_url: '',
      api_key: '',
      use_proxy: false,
      is_active: true,
    })
  }

  const deleteProvider = (providerId: string) => {
    setProviders(providers.filter((p) => p.id !== providerId))
    if (editingProvider === providerId) {
      setEditingProvider(null)
      setProviderBackup(null)
    }
  }

  const handleAddModel = () => {
    if (!addModelProviderId) return

    const model: LLMModel = {
      id: Date.now().toString(),
      provider_id: addModelProviderId,
      name: newModel.name,
      input_price: newModel.input_price,
      output_price: newModel.output_price,
      cache_read_price: newModel.cache_read_price,
      extra_body: newModel.extra_body,
      is_active: newModel.is_active,
    }

    setProviders(
      providers.map((p) =>
        p.id === addModelProviderId
          ? { ...p, models: [...p.models, model] }
          : p,
      ),
    )
    setAddModelProviderId(null)
    setNewModel({
      name: '',
      input_price: '0',
      output_price: '0',
      cache_read_price: '0',
      extra_body: {},
      is_active: true,
    })
  }

  const deleteModel = (providerId: string, modelId: string) => {
    setProviders(
      providers.map((p) =>
        p.id === providerId
          ? {
              ...p,
              models: p.models.filter((m) => m.id !== modelId),
            }
          : p,
      ),
    )
    if (editingModel === modelId) {
      setEditingModel(null)
      setModelBackup(null)
    }
  }

  const updateProvider = (
    providerId: string,
    field: keyof LLMProvider,
    value: string | boolean | ProviderType,
  ) => {
    setProviders(
      providers.map((p) =>
        p.id === providerId ? { ...p, [field]: value } : p,
      ),
    )
  }

  const updateModel = (
    providerId: string,
    modelId: string,
    field: keyof LLMModel,
    value: string | boolean | Record<string, any>,
  ) => {
    setProviders(
      providers.map((p) =>
        p.id === providerId
          ? {
              ...p,
              models: p.models.map((m) =>
                m.id === modelId ? { ...m, [field]: value } : m,
              ),
            }
          : p,
      ),
    )
  }

  const startEditingProvider = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId)
    if (provider) {
      setProviderBackup(JSON.parse(JSON.stringify(provider)))
      setEditingProvider(providerId)
    }
  }

  const saveProvider = () => {
    setEditingProvider(null)
    setProviderBackup(null)
  }

  const cancelEditProvider = () => {
    if (providerBackup) {
      setProviders(
        providers.map((p) => (p.id === providerBackup.id ? providerBackup : p)),
      )
    }
    setEditingProvider(null)
    setProviderBackup(null)
  }

  const startEditingModel = (providerId: string, modelId: string) => {
    const provider = providers.find((p) => p.id === providerId)
    const model = provider?.models.find((m) => m.id === modelId)
    if (model) {
      setModelBackup(JSON.parse(JSON.stringify(model)))
      setEditingModel(modelId)
    }
  }

  const saveModel = () => {
    setEditingModel(null)
    setModelBackup(null)
  }

  const cancelEditModel = (providerId: string) => {
    if (modelBackup) {
      setProviders(
        providers.map((p) =>
          p.id === providerId
            ? {
                ...p,
                models: p.models.map((m) =>
                  m.id === modelBackup.id ? modelBackup : m,
                ),
              }
            : p,
        ),
      )
    }
    setEditingModel(null)
    setModelBackup(null)
  }

  const isEditingProvider = (providerId: string) => {
    return editingProvider === providerId
  }

  const isEditingModel = (modelId: string) => {
    return editingModel === modelId
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
                          <SelectItem value={ProviderType.OPENAI}>
                            OpenAI
                          </SelectItem>
                          <SelectItem value={ProviderType.ANTHROPIC}>
                            Anthropic
                          </SelectItem>
                          <SelectItem value={ProviderType.GOOGLE}>
                            Google
                          </SelectItem>
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
                        value={newProvider.api_key}
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
            {providers.map((provider) => (
              <Card key={provider.id} className='border-border bg-card'>
                <Collapsible
                  open={provider.isOpen}
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
                            {provider.isOpen ? (
                              <ChevronDownIcon className='h-4 w-4' />
                            ) : (
                              <ChevronRightIcon className='h-4 w-4' />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        {isEditingProvider(provider.id) ? (
                          <Input
                            value={provider.name}
                            onChange={(e) =>
                              updateProvider(
                                provider.id,
                                'name',
                                e.target.value,
                              )
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
                        {!provider.is_active && (
                          <Badge variant='destructive' className='ml-1'>
                            未激活
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
                              updateProvider(provider.id, 'is_active', checked)
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
                                  value={provider.provider_type}
                                  onValueChange={(value) =>
                                    updateProvider(
                                      provider.id,
                                      'provider_type',
                                      value as ProviderType,
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    id={`provider-type-${provider.id}`}
                                    className='bg-background'
                                  >
                                    <SelectValue placeholder='选择类型' />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={ProviderType.OPENAI}>
                                      OpenAI
                                    </SelectItem>
                                    <SelectItem value={ProviderType.ANTHROPIC}>
                                      Anthropic
                                    </SelectItem>
                                    <SelectItem value={ProviderType.GOOGLE}>
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
                                  value={provider.base_url}
                                  onChange={(e) =>
                                    updateProvider(
                                      provider.id,
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
                                    value={provider.api_key}
                                    onChange={(e) =>
                                      updateProvider(
                                        provider.id,
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
                                checked={provider.use_proxy}
                                onCheckedChange={(checked) =>
                                  updateProvider(
                                    provider.id,
                                    'use_proxy',
                                    checked,
                                  )
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
                                checked={provider.is_active}
                                onCheckedChange={(checked) =>
                                  updateProvider(
                                    provider.id,
                                    'is_active',
                                    checked,
                                  )
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
                        <div className='flex items-center justify-between'>
                          <h3 className='text-lg font-semibold'>模型配置</h3>
                          <Dialog
                            open={addModelProviderId === provider.id}
                            onOpenChange={(open) =>
                              setAddModelProviderId(open ? provider.id : null)
                            }
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant='outline'
                                size='sm'
                                className='gap-2 bg-transparent'
                              >
                                <PlusIcon className='h-3 w-3' />
                                添加模型
                              </Button>
                            </DialogTrigger>
                            <DialogContent className='sm:max-w-[600px]'>
                              <DialogHeader>
                                <DialogTitle>添加新模型</DialogTitle>
                                <DialogDescription>
                                  为 {provider.name} 添加新的模型配置
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
                                    placeholder='gpt-4-turbo'
                                    className='font-mono text-sm'
                                  />
                                </div>
                                <div className='grid grid-cols-2 gap-4'>
                                  <div className='space-y-2'>
                                    <Label htmlFor='new-model-input-price'>
                                      Input Price ($/1K tokens)
                                    </Label>
                                    <Input
                                      id='new-model-input-price'
                                      type='number'
                                      step='0.0001'
                                      value={newModel.input_price}
                                      onChange={(e) =>
                                        setNewModel({
                                          ...newModel,
                                          input_price: e.target.value,
                                        })
                                      }
                                      placeholder='0.01'
                                    />
                                  </div>
                                  <div className='space-y-2'>
                                    <Label htmlFor='new-model-output-price'>
                                      Output Price ($/1K tokens)
                                    </Label>
                                    <Input
                                      id='new-model-output-price'
                                      type='number'
                                      step='0.0001'
                                      value={newModel.output_price}
                                      onChange={(e) =>
                                        setNewModel({
                                          ...newModel,
                                          output_price: e.target.value,
                                        })
                                      }
                                      placeholder='0.03'
                                    />
                                  </div>
                                  <div className='space-y-2'>
                                    <Label htmlFor='new-model-cache-read-price'>
                                      Cache Read Price ($/1K tokens)
                                    </Label>
                                    <Input
                                      id='new-model-cache-read-price'
                                      type='number'
                                      step='0.0001'
                                      value={newModel.cache_read_price}
                                      onChange={(e) =>
                                        setNewModel({
                                          ...newModel,
                                          cache_read_price: e.target.value,
                                        })
                                      }
                                      placeholder='0.001'
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
                                        value={model.name}
                                        onChange={(e) =>
                                          updateModel(
                                            provider.id,
                                            model.id,
                                            'name',
                                            e.target.value,
                                          )
                                        }
                                        className='font-mono text-sm max-w-xs bg-background'
                                        placeholder='模型名称'
                                      />
                                    ) : (
                                      <span className='font-mono text-sm font-medium'>
                                        {model.name}
                                      </span>
                                    )}
                                    {!model.is_active && (
                                      <Badge
                                        variant='destructive'
                                        className='text-xs'
                                      >
                                        未激活
                                      </Badge>
                                    )}
                                  </div>
                                  <div className='flex items-center gap-2'>
                                    <div className='flex items-center gap-2'>
                                      <span className='text-xs text-muted-foreground'>
                                        激活
                                      </span>
                                      <Switch
                                        checked={model.is_active}
                                        onCheckedChange={(checked) =>
                                          updateModel(
                                            provider.id,
                                            model.id,
                                            'is_active',
                                            checked,
                                          )
                                        }
                                      />
                                    </div>
                                    {isEditingModel(model.id) ? (
                                      <>
                                        <Button
                                          variant='outline'
                                          size='sm'
                                          onClick={saveModel}
                                          className='h-8 gap-2 bg-transparent'
                                        >
                                          <SaveIcon className='h-3 w-3' />
                                          保存
                                        </Button>
                                        <Button
                                          variant='outline'
                                          size='sm'
                                          onClick={() =>
                                            cancelEditModel(provider.id)
                                          }
                                          className='h-8 gap-2 bg-transparent'
                                        >
                                          <XIcon className='h-3 w-3' />
                                          取消
                                        </Button>
                                      </>
                                    ) : (
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
                                    )}
                                    <Button
                                      variant='ghost'
                                      size='sm'
                                      onClick={() =>
                                        deleteModel(provider.id, model.id)
                                      }
                                      className='h-8 text-destructive hover:text-destructive'
                                    >
                                      <Trash2Icon className='h-3 w-3' />
                                    </Button>
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
                                          Input Price
                                        </Label>
                                        <Input
                                          id={`input-price-${model.id}`}
                                          type='number'
                                          step='0.0001'
                                          value={model.input_price}
                                          onChange={(e) =>
                                            updateModel(
                                              provider.id,
                                              model.id,
                                              'input_price',
                                              e.target.value,
                                            )
                                          }
                                          className='h-9 text-sm bg-background'
                                        />
                                      </div>
                                      <div className='space-y-1'>
                                        <Label
                                          htmlFor={`output-price-${model.id}`}
                                          className='text-xs'
                                        >
                                          Output Price
                                        </Label>
                                        <Input
                                          id={`output-price-${model.id}`}
                                          type='number'
                                          step='0.0001'
                                          value={model.output_price}
                                          onChange={(e) =>
                                            updateModel(
                                              provider.id,
                                              model.id,
                                              'output_price',
                                              e.target.value,
                                            )
                                          }
                                          className='h-9 text-sm bg-background'
                                        />
                                      </div>
                                      <div className='space-y-1'>
                                        <Label
                                          htmlFor={`cache-read-price-${model.id}`}
                                          className='text-xs'
                                        >
                                          Cache Read Price
                                        </Label>
                                        <Input
                                          id={`cache-read-price-${model.id}`}
                                          type='number'
                                          step='0.0001'
                                          value={model.cache_read_price}
                                          onChange={(e) =>
                                            updateModel(
                                              provider.id,
                                              model.id,
                                              'cache_read_price',
                                              e.target.value,
                                            )
                                          }
                                          className='h-9 text-sm bg-background'
                                        />
                                      </div>
                                    </div>
                                    <div className='flex items-center justify-between pt-2'>
                                      <div className='space-y-0.5'>
                                        <Label
                                          htmlFor={`model-active-${model.id}`}
                                          className='text-xs'
                                        >
                                          启用模型
                                        </Label>
                                        <p className='text-xs text-muted-foreground'>
                                          是否激活此模型
                                        </p>
                                      </div>
                                      <Switch
                                        id={`model-active-${model.id}`}
                                        checked={model.is_active}
                                        onCheckedChange={(checked) =>
                                          updateModel(
                                            provider.id,
                                            model.id,
                                            'is_active',
                                            checked,
                                          )
                                        }
                                      />
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

            {providers.length === 0 && (
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
