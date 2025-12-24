'use client'

import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  BarChart3Icon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CpuIcon,
  LayersIcon,
  SettingsIcon,
  TrendingUpIcon,
  UsersIcon,
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
import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface Model {
  id: string
  name: string
  provider_name: string
}

interface ModelConfig {
  chat_model: string
  vision_model: string
  agent_model: string
  coding_model: string
  long_context_model: string
  high_performance_model: string
  simple_model: string
}

interface StatsSummary {
  total_input_tokens: number
  total_output_tokens: number
  total_cache_read: number
  total_price: string
  count: number
}

interface StatsByAgent extends StatsSummary {
  agent_name: string
}

interface StatsByModel extends StatsSummary {
  model_name: string
}

interface StatsByType extends StatsSummary {
  setting_key: string
}

interface StatsByUser extends StatsSummary {
  user_name: string
}

interface UsageRecord {
  id: number
  agent_name: string
  model_name: string | null
  setting_key: string | null
  input_tokens: number
  output_tokens: number
  cache_read: number
  price: string
  time: string
}

interface UsageRecordsResponse {
  total: number
  items: UsageRecord[]
}

export default function LLMStatisticPage() {
  // Mock data for available models
  const [availableModels] = useState<Model[]>([
    { id: '1', name: 'gpt-4-turbo', provider_name: 'OpenAI' },
    { id: '2', name: 'gpt-4o', provider_name: 'OpenAI' },
    { id: '3', name: 'gpt-4o-mini', provider_name: 'OpenAI' },
    { id: '4', name: 'claude-3-5-sonnet', provider_name: 'Anthropic' },
    { id: '5', name: 'claude-3-5-haiku', provider_name: 'Anthropic' },
    { id: '6', name: 'gemini-1.5-pro', provider_name: 'Google' },
  ])

  // Model configuration
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    chat_model: 'gpt-4o',
    vision_model: 'gpt-4o',
    agent_model: 'claude-3-5-sonnet',
    coding_model: 'gpt-4-turbo',
    long_context_model: 'claude-3-5-sonnet',
    high_performance_model: 'gpt-4-turbo',
    simple_model: 'gpt-4o-mini',
  })

  const [mockStatsData] = useState({
    total: {
      total_input_tokens: 3480036,
      total_output_tokens: 78425,
      total_cache_read: 3177088,
      total_price: '0.397567136',
    },
    by_agent: [
      {
        total_input_tokens: 43510,
        total_output_tokens: 9789,
        total_cache_read: 20736,
        total_price: '0.17329980',
        count: 13,
        agent_name: 'tool_generator',
      },
      {
        total_input_tokens: 3409434,
        total_output_tokens: 50831,
        total_cache_read: 3156352,
        total_price: '0.180589836',
        count: 304,
        agent_name: 'test_run',
      },
      {
        total_input_tokens: 11248,
        total_output_tokens: 7584,
        total_cache_read: 0,
        total_price: '0.01811575',
        count: 14,
        agent_name: 'search_exist_node',
      },
      {
        total_input_tokens: 10644,
        total_output_tokens: 2260,
        total_cache_read: 0,
        total_price: '0.00718100',
        count: 15,
        agent_name: 'select_group',
      },
      {
        total_input_tokens: 4915,
        total_output_tokens: 7457,
        total_cache_read: 0,
        total_price: '0.01614275',
        count: 6,
        agent_name: 'check_report',
      },
      {
        total_input_tokens: 285,
        total_output_tokens: 504,
        total_cache_read: 0,
        total_price: '0.0022380',
        count: 11,
        agent_name: 'test',
      },
    ] as StatsByAgent[],
    by_model: [
      {
        total_input_tokens: 3409434,
        total_output_tokens: 50831,
        total_cache_read: 3156352,
        total_price: '0.180589836',
        count: 304,
        model_name: 'deepseek-reasoner',
      },
      {
        total_input_tokens: 40164,
        total_output_tokens: 5756,
        total_cache_read: 20736,
        total_price: '0.11821180',
        count: 12,
        model_name: 'openai/gpt-5.2',
      },
      {
        total_input_tokens: 3369,
        total_output_tokens: 4094,
        total_cache_read: 0,
        total_price: '0.055866',
        count: 2,
        model_name: 'gemini-3-pro-preview',
      },
      {
        total_input_tokens: 153,
        total_output_tokens: 403,
        total_cache_read: 0,
        total_price: '0.0012855',
        count: 7,
        model_name: 'gemini-3-flash-preview',
      },
      {
        total_input_tokens: 560,
        total_output_tokens: 63,
        total_cache_read: 0,
        total_price: '0.0004690',
        count: 4,
        model_name: 'google/gemini-3-flash-preview',
      },
      {
        total_input_tokens: 26356,
        total_output_tokens: 17278,
        total_cache_read: 0,
        total_price: '0.04114500',
        count: 34,
        model_name: 'openai/gpt-5-mini',
      },
    ] as StatsByModel[],
    by_type: [
      {
        total_input_tokens: 4915,
        total_output_tokens: 7457,
        total_cache_read: 0,
        total_price: '0.01614275',
        count: 6,
        setting_key: 'simple_model',
      },
      {
        total_input_tokens: 3409434,
        total_output_tokens: 50831,
        total_cache_read: 3156352,
        total_price: '0.180589836',
        count: 304,
        setting_key: 'long_context_model',
      },
      {
        total_input_tokens: 22154,
        total_output_tokens: 10287,
        total_cache_read: 0,
        total_price: '0.02675675',
        count: 39,
        setting_key: 'agent_model',
      },
      {
        total_input_tokens: 43533,
        total_output_tokens: 9850,
        total_cache_read: 20736,
        total_price: '0.17407780',
        count: 14,
        setting_key: 'high_performance_model',
      },
    ] as StatsByType[],
    by_user: [
      {
        total_input_tokens: 3480036,
        total_output_tokens: 78425,
        total_cache_read: 3177088,
        total_price: '0.397567136',
        count: 363,
        user_name: 'YeYu',
      },
    ] as StatsByUser[],
  })

  const updateModelConfig = (key: keyof ModelConfig, value: string) => {
    setModelConfig({ ...modelConfig, [key]: value })
  }

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  })

  const modelTypeLabels: Record<keyof ModelConfig, string> = {
    chat_model: '对话模型',
    vision_model: '视觉模型',
    agent_model: '智能体模型',
    coding_model: '代码模型',
    long_context_model: '长上下文模型',
    high_performance_model: '高性能模型',
    simple_model: '轻量模型',
  }

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [usageRecords] = useState<UsageRecordsResponse>({
    total: 391,
    items: [
      {
        id: 391,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 11677,
        output_tokens: 76,
        cache_read: 11456,
        price: '0.000414568',
        time: '2025-12-24T15:32:44.413938',
      },
      {
        id: 390,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 11546,
        output_tokens: 81,
        cache_read: 11264,
        price: '0.000428372',
        time: '2025-12-24T15:32:40.091006',
      },
      {
        id: 389,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 11335,
        output_tokens: 187,
        cache_read: 10944,
        price: '0.000494452',
        time: '2025-12-24T15:32:32.943761',
      },
      {
        id: 388,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 11040,
        output_tokens: 257,
        cache_read: 10816,
        price: '0.000473508',
        time: '2025-12-24T15:32:24.409661',
      },
      {
        id: 387,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 10898,
        output_tokens: 118,
        cache_read: 10688,
        price: '0.000407624',
        time: '2025-12-24T15:32:13.792710',
      },
      {
        id: 386,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 10748,
        output_tokens: 104,
        cache_read: 10432,
        price: '0.000424256',
        time: '2025-12-24T15:32:07.543074',
      },
      {
        id: 385,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 10518,
        output_tokens: 207,
        cache_read: 10304,
        price: '0.000435372',
        time: '2025-12-24T15:32:02.327613',
      },
      {
        id: 384,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 10412,
        output_tokens: 82,
        cache_read: 10240,
        price: '0.00036932',
        time: '2025-12-24T15:31:53.526006',
      },
      {
        id: 383,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 10308,
        output_tokens: 80,
        cache_read: 10112,
        price: '0.000371616',
        time: '2025-12-24T15:31:49.107468',
      },
      {
        id: 382,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 10190,
        output_tokens: 94,
        cache_read: 9984,
        price: '0.000376712',
        time: '2025-12-24T15:31:44.500852',
      },
      {
        id: 381,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 10079,
        output_tokens: 87,
        cache_read: 9856,
        price: '0.000374948',
        time: '2025-12-24T15:31:39.661068',
      },
      {
        id: 380,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 9904,
        output_tokens: 151,
        cache_read: 9152,
        price: '0.000530236',
        time: '2025-12-24T15:31:35.420714',
      },
      {
        id: 379,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 9247,
        output_tokens: 633,
        cache_read: 8704,
        price: '0.000661612',
        time: '2025-12-24T15:31:28.070340',
      },
      {
        id: 378,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 8753,
        output_tokens: 220,
        cache_read: 8128,
        price: '0.000494984',
        time: '2025-12-24T15:31:02.576480',
      },
      {
        id: 377,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 8219,
        output_tokens: 217,
        cache_read: 7616,
        price: '0.000473228',
        time: '2025-12-24T15:30:52.448029',
      },
      {
        id: 376,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 7719,
        output_tokens: 445,
        cache_read: 7296,
        price: '0.000509628',
        time: '2025-12-24T15:30:42.868907',
      },
      {
        id: 375,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 7372,
        output_tokens: 71,
        cache_read: 7040,
        price: '0.0003199',
        time: '2025-12-24T15:30:25.102887',
      },
      {
        id: 374,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 7125,
        output_tokens: 68,
        cache_read: 6656,
        price: '0.000346248',
        time: '2025-12-24T15:30:21.397625',
      },
      {
        id: 373,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 6763,
        output_tokens: 222,
        cache_read: 6144,
        price: '0.000438592',
        time: '2025-12-24T15:30:17.648171',
      },
      {
        id: 372,
        agent_name: 'test_run',
        model_name: 'deepseek-reasoner',
        setting_key: 'long_context_model',
        input_tokens: 6215,
        output_tokens: 82,
        cache_read: 5632,
        price: '0.000355376',
        time: '2025-12-24T15:30:06.724169',
      },
    ],
  })

  const totalPages = Math.ceil(usageRecords.total / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentRecords = usageRecords.items.slice(startIndex, endIndex)

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
                  <BreadcrumbPage>任务监控</BreadcrumbPage>
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
              <BarChart3Icon className='h-8 w-8 text-primary' />
              <h1 className='text-4xl font-bold text-balance'>
                模型使用与统计
              </h1>
            </div>
            <p className='text-muted-foreground text-pretty'>
              配置项目模块所使用的模型并查看使用统计
            </p>
          </div>

          <Tabs defaultValue='config' className='space-y-6'>
            <TabsList>
              <TabsTrigger value='config' className='gap-2'>
                <SettingsIcon className='h-4 w-4' />
                模型配置
              </TabsTrigger>
              <TabsTrigger value='statistics' className='gap-2'>
                <TrendingUpIcon className='h-4 w-4' />
                使用统计
              </TabsTrigger>
            </TabsList>

            {/* Model Configuration Tab */}
            <TabsContent value='config' className='space-y-4'>
              <Card className='border-border bg-card p-6'>
                <h2 className='text-xl font-semibold mb-6'>模块模型配置</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {(Object.keys(modelConfig) as Array<keyof ModelConfig>).map(
                    (key) => (
                      <div key={key} className='space-y-2'>
                        <Label htmlFor={key} className='text-sm font-medium'>
                          {modelTypeLabels[key]}
                        </Label>
                        <Select
                          value={modelConfig[key]}
                          onValueChange={(value) =>
                            updateModelConfig(key, value)
                          }
                        >
                          <SelectTrigger id={key} className='bg-background'>
                            <SelectValue placeholder='选择模型' />
                          </SelectTrigger>
                          <SelectContent>
                            {availableModels.map((model) => (
                              <SelectItem key={model.id} value={model.name}>
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
                    ),
                  )}
                </div>
                <div className='mt-6 flex justify-end'>
                  <Button>保存配置</Button>
                </div>
              </Card>

              {/* Current Configuration Summary */}
              <Card className='border-border bg-card p-6'>
                <h3 className='text-lg font-semibold mb-4'>当前配置概览</h3>
                <div className='space-y-3'>
                  {(Object.keys(modelConfig) as Array<keyof ModelConfig>).map(
                    (key) => {
                      const model = availableModels.find(
                        (m) => m.name === modelConfig[key],
                      )
                      return (
                        <div
                          key={key}
                          className='flex items-center justify-between py-2 border-b border-border last:border-0'
                        >
                          <div className='space-y-1'>
                            <p className='text-sm font-medium'>
                              {modelTypeLabels[key]}
                            </p>
                            <p className='text-xs text-muted-foreground'>
                              {key}
                            </p>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Badge
                              variant='secondary'
                              className='font-mono text-xs'
                            >
                              {modelConfig[key]}
                            </Badge>
                            {model && (
                              <Badge variant='outline' className='text-xs'>
                                {model.provider_name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    },
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value='statistics' className='space-y-6'>
              <Card className='border-border bg-card p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <CalendarIcon className='h-4 w-4 text-muted-foreground' />
                    <span className='text-sm font-medium'>统计时间范围</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant='outline'
                          className={cn(
                            'justify-start text-left font-normal min-w-[280px]',
                            !dateRange.from &&
                              !dateRange.to &&
                              'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className='mr-2 h-4 w-4' />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, 'PPP', {
                                  locale: zhCN,
                                })}{' '}
                                -{' '}
                                {format(dateRange.to, 'PPP', { locale: zhCN })}
                              </>
                            ) : (
                              format(dateRange.from, 'PPP', { locale: zhCN })
                            )
                          ) : (
                            <span>选择日期范围</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='end'>
                        <Calendar
                          mode='range'
                          selected={{ from: dateRange.from, to: dateRange.to }}
                          onSelect={(range) => {
                            setDateRange({
                              from: range?.from,
                              to: range?.to,
                            })
                          }}
                          numberOfMonths={2}
                          locale={zhCN}
                        />
                        <div className='flex items-center justify-between gap-2 p-3 border-t'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              setDateRange({
                                from: new Date(
                                  new Date().setDate(new Date().getDate() - 7),
                                ),
                                to: new Date(),
                              })
                            }}
                          >
                            最近7天
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              setDateRange({
                                from: new Date(
                                  new Date().setDate(new Date().getDate() - 30),
                                ),
                                to: new Date(),
                              })
                            }}
                          >
                            最近30天
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              setDateRange({ from: undefined, to: undefined })
                            }}
                          >
                            全部
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </Card>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <Card className='border-border bg-card p-6'>
                  <div className='flex items-center gap-3 mb-2'>
                    <div className='p-2 bg-primary/10 rounded-lg'>
                      <TrendingUpIcon className='h-5 w-5 text-primary' />
                    </div>
                    <p className='text-sm text-muted-foreground'>总花费</p>
                  </div>
                  <p className='text-3xl font-bold text-primary'>
                    ${mockStatsData.total.total_price}
                  </p>
                </Card>

                <Card className='border-border bg-card p-6'>
                  <div className='flex items-center gap-3 mb-2'>
                    <div className='p-2 bg-chart-2/10 rounded-lg'>
                      <BarChart3Icon className='h-5 w-5 text-chart-2' />
                    </div>
                    <p className='text-sm text-muted-foreground'>输入 Tokens</p>
                  </div>
                  <p className='text-3xl font-bold'>
                    {mockStatsData.total.total_input_tokens.toLocaleString()}
                  </p>
                </Card>

                <Card className='border-border bg-card p-6'>
                  <div className='flex items-center gap-3 mb-2'>
                    <div className='p-2 bg-chart-3/10 rounded-lg'>
                      <BarChart3Icon className='h-5 w-5 text-chart-3' />
                    </div>
                    <p className='text-sm text-muted-foreground'>输出 Tokens</p>
                  </div>
                  <p className='text-3xl font-bold'>
                    {mockStatsData.total.total_output_tokens.toLocaleString()}
                  </p>
                </Card>

                <Card className='border-border bg-card p-6'>
                  <div className='flex items-center gap-3 mb-2'>
                    <div className='p-2 bg-chart-4/10 rounded-lg'>
                      <BarChart3Icon className='h-5 w-5 text-chart-4' />
                    </div>
                    <p className='text-sm text-muted-foreground'>缓存读取</p>
                  </div>
                  <p className='text-3xl font-bold'>
                    {mockStatsData.total.total_cache_read.toLocaleString()}
                  </p>
                </Card>
              </div>

              <Card className='border-border bg-card p-6'>
                <h3 className='text-lg font-semibold mb-4'>详细统计</h3>
                <Tabs defaultValue='by_agent' className='space-y-4'>
                  <TabsList className='grid w-full grid-cols-4'>
                    <TabsTrigger value='by_agent' className='gap-2'>
                      <LayersIcon className='h-4 w-4' />
                      按模块
                    </TabsTrigger>
                    <TabsTrigger value='by_model' className='gap-2'>
                      <CpuIcon className='h-4 w-4' />
                      按模型
                    </TabsTrigger>
                    <TabsTrigger value='by_type' className='gap-2'>
                      <SettingsIcon className='h-4 w-4' />
                      按类型
                    </TabsTrigger>
                    <TabsTrigger value='by_user' className='gap-2'>
                      <UsersIcon className='h-4 w-4' />
                      按用户
                    </TabsTrigger>
                  </TabsList>

                  {/* 按模块统计 */}
                  <TabsContent value='by_agent' className='space-y-4'>
                    {mockStatsData.by_agent.map((stats) => {
                      const percentage =
                        (Number.parseFloat(stats.total_price) /
                          Number.parseFloat(mockStatsData.total.total_price)) *
                        100
                      return (
                        <div key={stats.agent_name} className='space-y-2'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <span className='font-mono text-sm font-medium'>
                                {stats.agent_name}
                              </span>
                              <Badge variant='secondary' className='text-xs'>
                                {stats.count} 次调用
                              </Badge>
                            </div>
                            <div className='text-sm font-semibold'>
                              ${stats.total_price}
                            </div>
                          </div>
                          <div className='w-full bg-muted rounded-full h-2'>
                            <div
                              className='bg-chart-1 h-2 rounded-full transition-all'
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className='grid grid-cols-3 gap-4 text-xs text-muted-foreground'>
                            <div>
                              <span>输入: </span>
                              <span className='font-medium text-foreground'>
                                {stats.total_input_tokens.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span>输出: </span>
                              <span className='font-medium text-foreground'>
                                {stats.total_output_tokens.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span>缓存: </span>
                              <span className='font-medium text-foreground'>
                                {stats.total_cache_read.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </TabsContent>

                  {/* 按模型统计 */}
                  <TabsContent value='by_model' className='space-y-4'>
                    {mockStatsData.by_model.map((stats) => {
                      const percentage =
                        (Number.parseFloat(stats.total_price) /
                          Number.parseFloat(mockStatsData.total.total_price)) *
                        100
                      return (
                        <div key={stats.model_name} className='space-y-2'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <Badge
                                variant='outline'
                                className='font-mono text-xs'
                              >
                                {stats.model_name}
                              </Badge>
                              <Badge variant='secondary' className='text-xs'>
                                {stats.count} 次调用
                              </Badge>
                            </div>
                            <div className='text-sm font-semibold'>
                              ${stats.total_price}
                            </div>
                          </div>
                          <div className='w-full bg-muted rounded-full h-2'>
                            <div
                              className='bg-chart-2 h-2 rounded-full transition-all'
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className='grid grid-cols-3 gap-4 text-xs text-muted-foreground'>
                            <div>
                              <span>输入: </span>
                              <span className='font-medium text-foreground'>
                                {stats.total_input_tokens.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span>输出: </span>
                              <span className='font-medium text-foreground'>
                                {stats.total_output_tokens.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span>缓存: </span>
                              <span className='font-medium text-foreground'>
                                {stats.total_cache_read.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </TabsContent>

                  {/* 按类型统计 */}
                  <TabsContent value='by_type' className='space-y-4'>
                    {mockStatsData.by_type.map((stats) => {
                      const label =
                        modelTypeLabels[
                          stats.setting_key as keyof ModelConfig
                        ] || stats.setting_key
                      const percentage =
                        (Number.parseFloat(stats.total_price) /
                          Number.parseFloat(mockStatsData.total.total_price)) *
                        100
                      return (
                        <div key={stats.setting_key} className='space-y-2'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <Badge variant='secondary' className='text-xs'>
                                {label}
                              </Badge>
                              <span className='text-xs text-muted-foreground font-mono'>
                                {stats.setting_key}
                              </span>
                              <Badge variant='secondary' className='text-xs'>
                                {stats.count} 次调用
                              </Badge>
                            </div>
                            <div className='text-sm font-semibold'>
                              ${stats.total_price}
                            </div>
                          </div>
                          <div className='w-full bg-muted rounded-full h-2'>
                            <div
                              className='bg-chart-3 h-2 rounded-full transition-all'
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className='grid grid-cols-3 gap-4 text-xs text-muted-foreground'>
                            <div>
                              <span>输入: </span>
                              <span className='font-medium text-foreground'>
                                {stats.total_input_tokens.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span>输出: </span>
                              <span className='font-medium text-foreground'>
                                {stats.total_output_tokens.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span>缓存: </span>
                              <span className='font-medium text-foreground'>
                                {stats.total_cache_read.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </TabsContent>

                  {/* 按用户统计 */}
                  <TabsContent value='by_user' className='space-y-4'>
                    {mockStatsData.by_user.map((stats) => {
                      const percentage =
                        (Number.parseFloat(stats.total_price) /
                          Number.parseFloat(mockStatsData.total.total_price)) *
                        100
                      return (
                        <div key={stats.user_name} className='space-y-2'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <div className='flex items-center gap-2'>
                                <div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center'>
                                  <UsersIcon className='h-4 w-4 text-primary' />
                                </div>
                                <span className='font-medium'>
                                  {stats.user_name}
                                </span>
                              </div>
                              <Badge variant='secondary' className='text-xs'>
                                {stats.count} 次调用
                              </Badge>
                            </div>
                            <div className='text-sm font-semibold'>
                              ${stats.total_price}
                            </div>
                          </div>
                          <div className='w-full bg-muted rounded-full h-2'>
                            <div
                              className='bg-chart-4 h-2 rounded-full transition-all'
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className='grid grid-cols-3 gap-4 text-xs text-muted-foreground'>
                            <div>
                              <span>输入: </span>
                              <span className='font-medium text-foreground'>
                                {stats.total_input_tokens.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span>输出: </span>
                              <span className='font-medium text-foreground'>
                                {stats.total_output_tokens.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span>缓存: </span>
                              <span className='font-medium text-foreground'>
                                {stats.total_cache_read.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </TabsContent>
                </Tabs>
              </Card>

              <Card className='border-border bg-card p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold'>使用详情</h3>
                  <div className='flex items-center gap-4'>
                    <div className='flex items-center gap-2'>
                      <Label className='text-sm text-muted-foreground'>
                        每页显示
                      </Label>
                      <Select
                        value={pageSize.toString()}
                        onValueChange={(value) => {
                          setPageSize(Number.parseInt(value))
                          setCurrentPage(1)
                        }}
                      >
                        <SelectTrigger className='w-[100px]'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='10'>10 条</SelectItem>
                          <SelectItem value='20'>20 条</SelectItem>
                          <SelectItem value='50'>50 条</SelectItem>
                          <SelectItem value='100'>100 条</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Badge variant='secondary'>
                      共 {usageRecords.total} 条记录
                    </Badge>
                  </div>
                </div>

                <div className='border border-border rounded-lg overflow-hidden'>
                  <Table>
                    <TableHeader>
                      <TableRow className='bg-muted/50'>
                        <TableHead className='font-semibold'>ID</TableHead>
                        <TableHead className='font-semibold'>模块</TableHead>
                        <TableHead className='font-semibold'>模型</TableHead>
                        <TableHead className='font-semibold'>类型</TableHead>
                        <TableHead className='text-right font-semibold'>
                          输入 Tokens
                        </TableHead>
                        <TableHead className='text-right font-semibold'>
                          输出 Tokens
                        </TableHead>
                        <TableHead className='text-right font-semibold'>
                          缓存读取
                        </TableHead>
                        <TableHead className='text-right font-semibold'>
                          花费
                        </TableHead>
                        <TableHead className='font-semibold'>时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentRecords.map((record) => (
                        <TableRow key={record.id} className='hover:bg-muted/30'>
                          <TableCell className='font-mono text-sm'>
                            {record.id}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant='outline'
                              className='font-mono text-xs'
                            >
                              {record.agent_name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant='secondary'
                              className='font-mono text-xs'
                            >
                              {record.model_name || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {record.setting_key ? (
                              <span className='text-xs text-muted-foreground'>
                                {modelTypeLabels[
                                  record.setting_key as keyof ModelConfig
                                ] || record.setting_key}
                              </span>
                            ) : (
                              <span className='text-xs text-muted-foreground'>
                                -
                              </span>
                            )}
                          </TableCell>
                          <TableCell className='text-right font-mono text-sm'>
                            {record.input_tokens.toLocaleString()}
                          </TableCell>
                          <TableCell className='text-right font-mono text-sm'>
                            {record.output_tokens.toLocaleString()}
                          </TableCell>
                          <TableCell className='text-right font-mono text-sm'>
                            {record.cache_read.toLocaleString()}
                          </TableCell>
                          <TableCell className='text-right font-mono text-sm font-medium text-primary'>
                            ${record.price}
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground'>
                            {format(
                              new Date(record.time),
                              'yyyy-MM-dd HH:mm:ss',
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className='flex items-center justify-between mt-4'>
                  <div className='text-sm text-muted-foreground'>
                    显示第 {startIndex + 1} -{' '}
                    {Math.min(endIndex, usageRecords.total)} 条，共{' '}
                    {usageRecords.total} 条
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeftIcon className='h-4 w-4' />
                      上一页
                    </Button>
                    <div className='flex items-center gap-1'>
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum: number
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? 'default' : 'outline'
                              }
                              size='sm'
                              onClick={() => setCurrentPage(pageNum)}
                              className='w-9'
                            >
                              {pageNum}
                            </Button>
                          )
                        },
                      )}
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      下一页
                      <ChevronRightIcon className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </SidebarInset>
  )
}
