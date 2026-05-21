'use client'

import { format } from 'date-fns'
import { enUS, zhCN } from 'date-fns/locale'
import {
  BarChart3Icon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CpuIcon,
  DownloadIcon,
  LayersIcon,
  SettingsIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useDownloadLLMStatisticsDetails,
  useLLMStatisticsDetails,
  useLLMStatisticsOverview,
} from '@/hooks/use-setting'
import { cn } from '@/lib/utils'
import type { LLMStatisticDetail, LLMStatisticOverview } from '@/types/setting'

interface StatsBreakdownItem {
  name: string
  count: number
  total_price: number
  total_input_tokens: number
  total_output_tokens: number
  total_cache_read: number
}

interface StatsBreakdownListProps {
  items: StatsBreakdownItem[]
  totalPrice: number
  barColor: string
  t: ReturnType<typeof useTranslations>
}

function StatsBreakdownList({
  items,
  totalPrice,
  barColor,
  t,
}: StatsBreakdownListProps) {
  return (
    <div className='space-y-4'>
      {items.map((item) => {
        const percentage = (item.total_price / totalPrice) * 100
        return (
          <div key={item.name} className='space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                {item.name}
                <Badge variant='secondary' className='text-xs'>
                  {t('call_count', { count: item.count })}
                </Badge>
              </div>
              <div className='text-sm font-semibold'>
                ${item.total_price.toLocaleString()}
              </div>
            </div>
            <div className='w-full bg-muted rounded-full h-2'>
              <div
                className={`${barColor} h-2 rounded-full transition-all`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className='grid grid-cols-3 gap-4 text-xs text-muted-foreground'>
              <div>
                <span>{t('input_label')}</span>
                <span className='font-medium text-foreground'>
                  {item.total_input_tokens.toLocaleString()}
                </span>
              </div>
              <div>
                <span>{t('output_label')}</span>
                <span className='font-medium text-foreground'>
                  {item.total_output_tokens.toLocaleString()}
                </span>
              </div>
              <div>
                <span>{t('cache_label')}</span>
                <span className='font-medium text-foreground'>
                  {item.total_cache_read.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface UsageDetailTableProps {
  records: LLMStatisticDetail[]
  modelTypeLabels: Record<string, string>
  t: ReturnType<typeof useTranslations>
}

function UsageDetailTable({
  records,
  modelTypeLabels,
  t,
}: UsageDetailTableProps) {
  return (
    <div className='border border-border rounded-lg overflow-hidden'>
      <Table>
        <TableHeader>
          <TableRow className='bg-muted/50'>
            <TableHead className='font-semibold'>{t('col_module')}</TableHead>
            <TableHead className='font-semibold'>{t('col_model')}</TableHead>
            <TableHead className='font-semibold'>{t('col_type')}</TableHead>
            <TableHead className='text-right font-semibold'>
              {t('col_input_tokens')}
            </TableHead>
            <TableHead className='text-right font-semibold'>
              {t('col_output_tokens')}
            </TableHead>
            <TableHead className='text-right font-semibold'>
              {t('col_cache_read')}
            </TableHead>
            <TableHead className='text-right font-semibold'>
              {t('col_cost')}
            </TableHead>
            <TableHead className='font-semibold'>{t('col_time')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id} className='hover:bg-muted/30'>
              <TableCell>
                <Badge variant='outline' className='font-mono text-xs'>
                  {record.agent_name}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant='secondary' className='font-mono text-xs'>
                  {record.model_name || '-'}
                </Badge>
              </TableCell>
              <TableCell>
                {record.setting_key ? (
                  <span className='text-xs text-muted-foreground'>
                    {modelTypeLabels[record.setting_key as string] ||
                      record.setting_key}
                  </span>
                ) : (
                  <span className='text-xs text-muted-foreground'>-</span>
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
              <TableCell
                className='text-sm text-muted-foreground'
                suppressHydrationWarning
              >
                {format(new Date(record.time), 'yyyy-MM-dd HH:mm:ss')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

const defaultStats: LLMStatisticOverview = {
  total: {
    total_input_tokens: 0,
    total_output_tokens: 0,
    total_cache_read: 0,
    total_price: 0,
  },
  by_agent: [],
  by_model: [],
  by_type: [],
  by_user: [],
}

export function StatisticsTab() {
  const t = useTranslations('setting.llm_statistic')
  const locale = useLocale()
  const dateFnsLocale = locale === 'zh' ? zhCN : enUS

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({ from: undefined, to: undefined })

  useEffect(() => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 7)
    setDateRange({ from, to })
  }, [])

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { mutateAsync: downloadStatistics, isPending: isExporting } =
    useDownloadLLMStatisticsDetails()

  const handleExport = async () => {
    const { content, filename } = await downloadStatistics({
      start_date: dateRange.from?.toISOString(),
      end_date: dateRange.to?.toISOString(),
    })
    const blob = new Blob([content], { type: 'text/csv' })
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    a.click()
    URL.revokeObjectURL(objectUrl)
  }

  const { data: statsData = defaultStats } = useLLMStatisticsOverview({
    start_date: dateRange.from?.toISOString(),
    end_date: dateRange.to?.toISOString(),
  })

  const { data: usageRecordsRes } = useLLMStatisticsDetails({
    start_date: dateRange.from?.toISOString(),
    end_date: dateRange.to?.toISOString(),
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  })

  const modelTypeLabels: Record<string, string> = {
    chat_model: t('model_type_chat'),
    vision_model: t('model_type_vision'),
    agent_model: t('model_type_agent'),
    coding_model: t('model_type_coding'),
    long_context_model: t('model_type_long_context'),
    high_performance_model: t('model_type_high_performance'),
    simple_model: t('model_type_simple'),
  }

  const totalPages = Math.ceil((usageRecordsRes?.total || 0) / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentRecords = usageRecordsRes?.items || []

  return (
    <div className='space-y-6'>
      {/* Date Range Picker */}
      <Card className='border-border bg-card p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <CalendarIcon className='size-4 text-muted-foreground' />
            <span className='text-sm font-medium'>{t('date_range_label')}</span>
          </div>
          <div className='flex items-center gap-3'>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className={cn(
                    'justify-start text-left font-normal min-w-[280px]',
                    !dateRange.from && !dateRange.to && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className='mr-2 size-4' />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'PPP', {
                          locale: dateFnsLocale,
                        })}{' '}
                        -{' '}
                        {format(dateRange.to, 'PPP', { locale: dateFnsLocale })}
                      </>
                    ) : (
                      format(dateRange.from, 'PPP', { locale: dateFnsLocale })
                    )
                  ) : (
                    <span>{t('select_date_range')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='end'>
                <Calendar
                  mode='range'
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    setDateRange({ from: range?.from, to: range?.to })
                  }}
                  numberOfMonths={2}
                  locale={dateFnsLocale}
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
                    {t('last_7_days')}
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
                    {t('last_30_days')}
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setDateRange({ from: undefined, to: undefined })
                    }}
                  >
                    {t('all')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='border-border bg-card p-6'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='p-2 bg-primary/10 rounded-lg'>
              <TrendingUpIcon className='size-5 text-primary' />
            </div>
            <p className='text-sm text-muted-foreground'>{t('total_cost')}</p>
          </div>
          <p className='text-3xl font-bold text-primary'>
            ${statsData.total.total_price.toLocaleString()}
          </p>
        </Card>

        <Card className='border-border bg-card p-6'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='p-2 bg-chart-2/10 rounded-lg'>
              <BarChart3Icon className='size-5 text-chart-2' />
            </div>
            <p className='text-sm text-muted-foreground'>{t('input_tokens')}</p>
          </div>
          <p className='text-3xl font-bold'>
            {statsData.total.total_input_tokens.toLocaleString()}
          </p>
        </Card>

        <Card className='border-border bg-card p-6'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='p-2 bg-chart-3/10 rounded-lg'>
              <BarChart3Icon className='size-5 text-chart-3' />
            </div>
            <p className='text-sm text-muted-foreground'>
              {t('output_tokens')}
            </p>
          </div>
          <p className='text-3xl font-bold'>
            {statsData.total.total_output_tokens.toLocaleString()}
          </p>
        </Card>

        <Card className='border-border bg-card p-6'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='p-2 bg-chart-4/10 rounded-lg'>
              <BarChart3Icon className='size-5 text-chart-4' />
            </div>
            <p className='text-sm text-muted-foreground'>{t('cache_read')}</p>
          </div>
          <p className='text-3xl font-bold'>
            {statsData.total.total_cache_read.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Detail Stats */}
      <Card className='border-border bg-card p-6'>
        <h3 className='text-lg font-semibold mb-4'>
          {t('detail_stats_title')}
        </h3>
        <Tabs defaultValue='by_agent' className='space-y-4'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='by_agent' className='gap-2'>
              <LayersIcon className='size-4' />
              {t('by_module')}
            </TabsTrigger>
            <TabsTrigger value='by_model' className='gap-2'>
              <CpuIcon className='size-4' />
              {t('by_model')}
            </TabsTrigger>
            <TabsTrigger value='by_type' className='gap-2'>
              <SettingsIcon className='size-4' />
              {t('by_type')}
            </TabsTrigger>
            <TabsTrigger value='by_user' className='gap-2'>
              <UsersIcon className='size-4' />
              {t('by_user')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='by_agent'>
            <StatsBreakdownList
              items={statsData.by_agent.map((s) => ({
                name: s.agent_name,
                count: s.count,
                total_price: s.total_price,
                total_input_tokens: s.total_input_tokens,
                total_output_tokens: s.total_output_tokens,
                total_cache_read: s.total_cache_read,
              }))}
              totalPrice={statsData.total.total_price}
              barColor='bg-chart-1'
              t={t}
            />
          </TabsContent>

          <TabsContent value='by_model'>
            <StatsBreakdownList
              items={statsData.by_model.map((s) => ({
                name: s.model_name,
                count: s.count,
                total_price: s.total_price,
                total_input_tokens: s.total_input_tokens,
                total_output_tokens: s.total_output_tokens,
                total_cache_read: s.total_cache_read,
              }))}
              totalPrice={statsData.total.total_price}
              barColor='bg-chart-2'
              t={t}
            />
          </TabsContent>

          <TabsContent value='by_type'>
            <StatsBreakdownList
              items={statsData.by_type.map((s) => ({
                name: modelTypeLabels[s.setting_key as string] || s.setting_key,
                count: s.count,
                total_price: s.total_price,
                total_input_tokens: s.total_input_tokens,
                total_output_tokens: s.total_output_tokens,
                total_cache_read: s.total_cache_read,
              }))}
              totalPrice={statsData.total.total_price}
              barColor='bg-chart-3'
              t={t}
            />
          </TabsContent>

          <TabsContent value='by_user'>
            <StatsBreakdownList
              items={statsData.by_user.map((s) => ({
                name: s.user_name,
                count: s.count,
                total_price: s.total_price,
                total_input_tokens: s.total_input_tokens,
                total_output_tokens: s.total_output_tokens,
                total_cache_read: s.total_cache_read,
              }))}
              totalPrice={statsData.total.total_price}
              barColor='bg-chart-4'
              t={t}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Usage Detail Table */}
      <Card className='border-border bg-card p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold'>{t('usage_detail_title')}</h3>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <Label className='text-sm text-muted-foreground'>
                {t('per_page')}
              </Label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number.parseInt(value, -1))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className='w-[100px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='10'>{t('items_per_page_10')}</SelectItem>
                  <SelectItem value='20'>{t('items_per_page_20')}</SelectItem>
                  <SelectItem value='50'>{t('items_per_page_50')}</SelectItem>
                  <SelectItem value='100'>{t('items_per_page_100')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant='secondary'>
              {t('total_records', { total: usageRecordsRes?.total || 0 })}
            </Badge>
            <Button
              variant='outline'
              size='sm'
              onClick={handleExport}
              disabled={isExporting}
              className='gap-2'
            >
              <DownloadIcon className='size-4' />
              {isExporting ? t('exporting') : t('export_csv')}
            </Button>
          </div>
        </div>

        <UsageDetailTable
          records={currentRecords}
          modelTypeLabels={modelTypeLabels}
          t={t}
        />

        <div className='flex items-center justify-between mt-4'>
          <div className='text-sm text-muted-foreground'>
            {t('pagination_info', {
              start: startIndex + 1,
              end: Math.min(endIndex, usageRecordsRes?.total || 0),
              total: usageRecordsRes?.total || 0,
            })}
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage((prev) => prev - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className='size-4' />
              {t('prev_page')}
            </Button>
            <div className='flex items-center gap-1'>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setCurrentPage(pageNum)}
                    className='w-9'
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage === totalPages}
            >
              {t('next_page')}
              <ChevronRightIcon className='size-4' />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
