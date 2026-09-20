'use client'

import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Filter,
  Loader2,
  X,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import {
  getRunTablePreviewMeta,
  getRunTablePreviewPage,
  getRunTablePreviewProfile,
} from '@/app/actions/run'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type {
  TableDataKind,
  TableFilterOperator,
  TablePreviewFilter,
  TablePreviewMeta,
  TablePreviewPage,
  TablePreviewProfile,
  TablePreviewSort,
} from '@/types/run'

const PAGE_SIZE = 50
const INITIAL_COLUMNS = 12

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MiB`
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

function defaultOperator(kind: TableDataKind): TableFilterOperator {
  if (kind === 'integer' || kind === 'number' || kind === 'temporal')
    return 'equals'
  if (kind === 'boolean') return 'equals'
  return 'contains'
}

function operatorsFor(kind: TableDataKind): TableFilterOperator[] {
  const nullOperators: TableFilterOperator[] = ['is_null', 'is_not_null']
  if (kind === 'integer' || kind === 'number' || kind === 'temporal')
    return ['equals', 'not_equals', 'gt', 'gte', 'lt', 'lte', ...nullOperators]
  if (kind === 'boolean') return ['equals', 'not_equals', ...nullOperators]
  return ['contains', 'equals', 'not_equals', ...nullOperators]
}

function requestError(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

export function TablePreview({
  runUid,
  generation,
  path,
  active,
}: {
  runUid: string
  generation: number
  path: string
  active: boolean
}) {
  const t = useTranslations('Project.runDetail.tablePreview')
  const [meta, setMeta] = useState<TablePreviewMeta | null>(null)
  const [visibleColumns, setVisibleColumns] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<TablePreviewSort | null>(null)
  const [filters, setFilters] = useState<TablePreviewFilter[]>([])
  const [filterColumn, setFilterColumn] = useState('')
  const [filterOperator, setFilterOperator] =
    useState<TableFilterOperator>('contains')
  const [filterValue, setFilterValue] = useState('')
  const [selectedColumn, setSelectedColumn] = useState('')
  const [data, setData] = useState<TablePreviewPage | null>(null)
  const [profile, setProfile] = useState<TablePreviewProfile | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [error, setError] = useState('')

  const columnsByName = useMemo(
    () => new Map(meta?.columns.map((column) => [column.name, column])),
    [meta],
  )
  const currentFilterColumn = columnsByName.get(filterColumn)
  const filterNeedsValue = !['is_null', 'is_not_null'].includes(filterOperator)

  useEffect(() => {
    if (!active || meta) return
    const controller = new AbortController()
    setMetaLoading(true)
    setError('')
    getRunTablePreviewMeta(runUid, generation, path, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        const initial = result.columns
          .slice(0, INITIAL_COLUMNS)
          .map((column) => column.name)
        setMeta(result)
        setVisibleColumns(initial)
        setPage(0)
        setSort(null)
        setFilters([])
        setFilterColumn(initial[0] ?? '')
        setFilterOperator(defaultOperator(result.columns[0]?.kind ?? 'text'))
        setFilterValue('')
        setSelectedColumn(initial[0] ?? '')
        setMetaLoading(false)
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setError(requestError(cause))
        setMetaLoading(false)
      })
    return () => {
      controller.abort()
    }
  }, [active, runUid, generation, path, meta])

  useEffect(() => {
    if (!active || !meta || visibleColumns.length === 0) return
    const controller = new AbortController()
    setDataLoading(true)
    setError('')
    getRunTablePreviewPage(
      runUid,
      generation,
      path,
      {
        offset: page * PAGE_SIZE,
        limit: PAGE_SIZE,
        columns: visibleColumns,
        sort,
        filters,
      },
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) return
        setData(result)
        setDataLoading(false)
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setData(null)
        setError(requestError(cause))
        setDataLoading(false)
      })
    return () => {
      controller.abort()
    }
  }, [
    active,
    runUid,
    generation,
    path,
    meta,
    visibleColumns,
    page,
    sort,
    filters,
  ])

  useEffect(() => {
    if (!active || !meta || !selectedColumn) return
    const controller = new AbortController()
    setProfileLoading(true)
    setProfile(null)
    getRunTablePreviewProfile(
      runUid,
      generation,
      path,
      selectedColumn,
      filters,
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) return
        setProfile(result)
        setProfileLoading(false)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setProfileLoading(false)
      })
    return () => {
      controller.abort()
    }
  }, [active, runUid, generation, path, meta, selectedColumn, filters])

  const changeFilterColumn = (name: string) => {
    setFilterColumn(name)
    setFilterOperator(defaultOperator(columnsByName.get(name)?.kind ?? 'text'))
    setFilterValue('')
  }

  const applyFilter = () => {
    if (!filterColumn || (filterNeedsValue && filterValue === '')) return
    setFilters([
      {
        column: filterColumn,
        operator: filterOperator,
        ...(filterNeedsValue ? { value: filterValue } : {}),
      },
    ])
    setPage(0)
  }

  const clearFilter = () => {
    setFilters([])
    setFilterValue('')
    setPage(0)
  }

  const cycleSort = (column: string) => {
    setSelectedColumn(column)
    setSort((current) => {
      if (current?.column !== column) return { column, direction: 'asc' }
      if (current.direction === 'asc') return { column, direction: 'desc' }
      return null
    })
    setPage(0)
  }

  const toggleColumn = (name: string, checked: boolean) => {
    if (checked) {
      if (visibleColumns.includes(name)) return
      setVisibleColumns([...visibleColumns, name])
      return
    }
    if (visibleColumns.length === 1) return
    const next = visibleColumns.filter((column) => column !== name)
    setVisibleColumns(next)
    if (selectedColumn === name) setSelectedColumn(next[0] ?? '')
  }

  if (metaLoading && !meta) {
    return (
      <div className='flex size-full items-center justify-center text-muted-foreground'>
        <Loader2 className='mr-2 size-4 animate-spin' />
        <span className='text-sm'>{t('loading')}</span>
      </div>
    )
  }

  if (error && !meta) {
    return (
      <div className='flex size-full flex-col items-center justify-center gap-2 p-6 text-destructive'>
        <AlertCircle className='size-8' />
        <p className='max-w-lg text-center text-sm'>{error}</p>
      </div>
    )
  }

  if (!meta || meta.columns.length === 0) {
    return (
      <div className='flex size-full items-center justify-center text-sm text-muted-foreground'>
        {t('empty')}
      </div>
    )
  }

  const rowStart = data && data.rows.length > 0 ? data.offset + 1 : 0
  const rowEnd = data ? data.offset + data.rows.length : 0
  const pageCount = Math.max(
    1,
    Math.ceil((data?.total ?? meta.row_count) / PAGE_SIZE),
  )
  const displayRows =
    data?.rows.map((cells, index) => ({
      cells,
      resultPosition: data.offset + index,
    })) ?? []

  return (
    <div className='flex size-full min-h-0 flex-col bg-background'>
      <div className='shrink-0 space-y-2 border-b bg-muted/20 px-3 py-2'>
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
          <span className='font-medium text-foreground'>
            {meta.kind.toUpperCase()}
          </span>
          <span>{formatBytes(meta.file_size)}</span>
          <span>{t('rowCount', { count: meta.row_count })}</span>
          <span>{t('columnCount', { count: meta.columns.length })}</span>
          <span>
            {t(meta.kind === 'csv' ? 'commaDelimiter' : 'tabDelimiter')}
          </span>
          {filters.length > 0 && (
            <span className='rounded bg-primary/10 px-1.5 py-0.5 text-primary'>
              {t('filterActive')}
            </span>
          )}
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Filter className='size-3.5 text-muted-foreground' />
          <Select value={filterColumn} onValueChange={changeFilterColumn}>
            <SelectTrigger size='sm' className='max-w-48'>
              <SelectValue placeholder={t('filterColumn')} />
            </SelectTrigger>
            <SelectContent>
              {meta.columns.map((column) => (
                <SelectItem key={column.name} value={column.name}>
                  {column.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filterOperator}
            onValueChange={(value) =>
              setFilterOperator(value as TableFilterOperator)
            }
          >
            <SelectTrigger size='sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operatorsFor(currentFilterColumn?.kind ?? 'text').map(
                (operator) => (
                  <SelectItem key={operator} value={operator}>
                    {t(`operators.${operator}`)}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          {filterNeedsValue && (
            <Input
              value={filterValue}
              onChange={(event) => setFilterValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') applyFilter()
              }}
              placeholder={t('filterValue')}
              className='h-8 w-44 text-xs'
            />
          )}
          <Button
            type='button'
            size='sm'
            onClick={applyFilter}
            disabled={!filterColumn || (filterNeedsValue && filterValue === '')}
          >
            {t('apply')}
          </Button>
          {filters.length > 0 && (
            <Button
              type='button'
              size='sm'
              variant='ghost'
              onClick={clearFilter}
            >
              <X />
              {t('clear')}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type='button'
                size='sm'
                variant='outline'
                className='ml-auto'
              >
                <Columns3 />
                {t('visibleColumns', {
                  visible: visibleColumns.length,
                  total: meta.columns.length,
                })}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='max-h-80 w-64'>
              <DropdownMenuLabel>{t('chooseColumns')}</DropdownMenuLabel>
              {meta.columns.map((column) => {
                const checked = visibleColumns.includes(column.name)
                return (
                  <DropdownMenuCheckboxItem
                    key={column.name}
                    checked={checked}
                    disabled={checked && visibleColumns.length === 1}
                    onCheckedChange={(value) =>
                      toggleColumn(column.name, value === true)
                    }
                  >
                    <span className='min-w-0 flex-1 truncate'>
                      {column.name}
                    </span>
                    <span className='text-[10px] text-muted-foreground'>
                      {column.dtype}
                    </span>
                  </DropdownMenuCheckboxItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className='flex min-h-6 flex-wrap items-center gap-x-4 gap-y-1 text-xs'>
          <span className='font-medium'>{selectedColumn}</span>
          {profileLoading && (
            <Loader2 className='size-3 animate-spin text-muted-foreground' />
          )}
          {profile && profile.column === selectedColumn && (
            <>
              <span className='rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground'>
                {profile.dtype}
              </span>
              <span>{t('count', { count: profile.count })}</span>
              <span>{t('nullCount', { count: profile.null_count })}</span>
              <span>{t('uniqueCount', { count: profile.unique_count })}</span>
              {profile.minimum !== undefined && (
                <span>
                  {t('minimum', { value: formatCell(profile.minimum) })}
                </span>
              )}
              {profile.maximum !== undefined && (
                <span>
                  {t('maximum', { value: formatCell(profile.maximum) })}
                </span>
              )}
              {profile.mean !== undefined && profile.mean !== null && (
                <span>{t('mean', { value: profile.mean.toPrecision(5) })}</span>
              )}
            </>
          )}
        </div>
      </div>

      <div className='relative min-h-0 flex-1 overflow-auto'>
        {dataLoading && (
          <div className='absolute inset-x-0 top-0 z-30 flex h-1 overflow-hidden bg-muted'>
            <div className='h-full w-1/3 animate-pulse bg-primary' />
          </div>
        )}
        {error && (
          <div className='m-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive'>
            <AlertCircle className='size-4 shrink-0' />
            {error}
          </div>
        )}
        {data && data.rows.length > 0 ? (
          <table className='w-max min-w-full border-separate border-spacing-0 text-xs'>
            <thead>
              <tr>
                <th className='sticky top-0 left-0 z-20 w-14 border-r border-b bg-muted px-2 py-2 text-right font-medium text-muted-foreground'>
                  #
                </th>
                {data.columns.map((name) => {
                  const column = columnsByName.get(name)
                  const isSelected = selectedColumn === name
                  return (
                    <th
                      key={name}
                      className={cn(
                        'sticky top-0 z-10 min-w-36 max-w-80 border-r border-b bg-muted px-2 py-1.5 text-left font-medium',
                        isSelected && 'bg-primary/10',
                      )}
                    >
                      <button
                        type='button'
                        onClick={() => cycleSort(name)}
                        className='flex w-full items-center gap-1.5 text-left'
                        title={t('sortColumn', { column: name })}
                      >
                        <span className='min-w-0 flex-1 truncate'>{name}</span>
                        <span className='font-mono text-[9px] font-normal text-muted-foreground'>
                          {column?.dtype}
                        </span>
                        {sort?.column === name ? (
                          sort.direction === 'asc' ? (
                            <ArrowUp className='size-3' />
                          ) : (
                            <ArrowDown className='size-3' />
                          )
                        ) : (
                          <ArrowUpDown className='size-3 text-muted-foreground/60' />
                        )}
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {displayRows.map(({ cells, resultPosition }) => (
                <tr key={resultPosition} className='hover:bg-muted/30'>
                  <td className='sticky left-0 z-10 border-r border-b bg-background px-2 py-1.5 text-right font-mono text-muted-foreground'>
                    {resultPosition + 1}
                  </td>
                  {cells.map((value, columnIndex) => (
                    <td
                      key={data.columns[columnIndex]}
                      className={cn(
                        'max-w-80 border-r border-b px-2 py-1.5 font-mono whitespace-nowrap',
                        value === null && 'italic text-muted-foreground',
                        selectedColumn === data.columns[columnIndex] &&
                          'bg-primary/[0.035]',
                      )}
                      title={formatCell(value)}
                    >
                      <span className='block max-w-80 truncate'>
                        {formatCell(value)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !dataLoading && (
            <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
              {t(filters.length > 0 ? 'noMatches' : 'empty')}
            </div>
          )
        )}
      </div>

      <div className='flex h-10 shrink-0 items-center justify-between border-t px-3 text-xs text-muted-foreground'>
        <span>
          {t('rowRange', {
            start: rowStart,
            end: rowEnd,
            total: data?.total ?? meta.row_count,
          })}
        </span>
        <div className='flex items-center gap-2'>
          <Button
            type='button'
            size='icon-xs'
            variant='outline'
            aria-label={t('previous')}
            disabled={page === 0 || dataLoading}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
          >
            <ChevronLeft />
          </Button>
          <span>{t('page', { page: page + 1, total: pageCount })}</span>
          <Button
            type='button'
            size='icon-xs'
            variant='outline'
            aria-label={t('next')}
            disabled={!data?.has_more || dataLoading}
            onClick={() => setPage((value) => value + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}
