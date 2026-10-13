'use client'

import { ChevronLeft, ChevronRight, Dna, SearchX, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import {
  getRunVcfPreviewDetail,
  getRunVcfPreviewMeta,
  getRunVcfPreviewPage,
} from '@/app/actions/run'
import {
  PreviewEmpty,
  PreviewError,
  PreviewFooter,
  PreviewLoading,
  PreviewProgress,
  PreviewSearch,
  PreviewStat,
  PreviewToolbar,
} from '@/components/project/run/preview-chrome'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type {
  VcfFilterStatus,
  VcfPreviewContig,
  VcfPreviewDetail,
  VcfPreviewMeta,
  VcfPreviewPage,
  VcfPreviewRow,
  VcfVariantType,
} from '@/types/run'

const PAGE_SIZE = 50
const SKELETON_ROWS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const VARIANT_TYPES: VcfVariantType[] = [
  'snp',
  'mnv',
  'indel',
  'sv',
  'mixed',
  'other',
]
const FILTER_STATUSES: VcfFilterStatus[] = ['pass', 'filtered', 'unfiltered']

type ActiveQuery = {
  contig: string
  variantType: VcfVariantType | 'all'
  filterStatus: VcfFilterStatus | 'all'
  search: string
  minQual: number | null
}

const INITIAL_QUERY: ActiveQuery = {
  contig: 'all',
  variantType: 'all',
  filterStatus: 'all',
  search: '',
  minQual: null,
}

function requestError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function formatPosition(value: number): string {
  return value.toLocaleString()
}

function formatQuality(value: number | null): string {
  return value === null
    ? '—'
    : Number.isInteger(value)
      ? String(value)
      : value.toFixed(2)
}

function variantTone(type: VcfVariantType): string {
  switch (type) {
    case 'snp':
      return 'bg-sky-500/12 text-sky-700 dark:text-sky-300'
    case 'indel':
      return 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
    case 'sv':
      return 'bg-violet-500/12 text-violet-700 dark:text-violet-300'
    case 'mnv':
      return 'bg-teal-500/12 text-teal-700 dark:text-teal-300'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function FilterValue({ value }: { value: string }) {
  if (value === 'PASS')
    return (
      <Badge
        variant='outline'
        className='border-success/30 bg-success/10 px-1.5 py-0 text-[10px] text-success'
      >
        PASS
      </Badge>
    )
  if (value === '.' || value === '')
    return <span className='text-muted-foreground'>.</span>
  return (
    <Badge
      variant='outline'
      className='max-w-40 border-warning/30 bg-warning/10 px-1.5 py-0 text-[10px] text-warning'
    >
      <span className='truncate'>{value}</span>
    </Badge>
  )
}

function DensityChart({
  contig,
  label,
}: {
  contig: VcfPreviewContig
  label: string
}) {
  const maximum = Math.max(...contig.bins, 1)
  return (
    <figure className='min-w-64 flex-1' aria-label={label}>
      <div className='flex h-12 items-end gap-px overflow-hidden rounded-md bg-muted/40 px-1 pt-1'>
        {contig.bins.map((count, index) => (
          <div
            // Density bins have stable positions and can legitimately share counts.
            key={`${contig.name}-${index}`}
            className='min-h-px flex-1 rounded-t-sm bg-primary/65 transition-colors hover:bg-primary'
            style={{ height: `${Math.max(2, (count / maximum) * 100)}%` }}
            title={`${formatPosition(Math.floor((index / contig.bins.length) * contig.length) + 1)}–${formatPosition(Math.floor(((index + 1) / contig.bins.length) * contig.length))}: ${count.toLocaleString()}`}
          />
        ))}
      </div>
      <div className='mt-1 flex justify-between text-[10px] text-muted-foreground'>
        <span>1</span>
        <span>{formatPosition(contig.length)} bp</span>
      </div>
    </figure>
  )
}

function VariantBadge({
  type,
  children,
}: {
  type: VcfVariantType
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
        variantTone(type),
      )}
    >
      {children}
    </span>
  )
}

function Summary({
  meta,
  densityContig,
  onDensityContigChange,
}: {
  meta: VcfPreviewMeta
  densityContig: string
  onDensityContigChange: (value: string) => void
}) {
  const t = useTranslations('Project.runDetail.vcfPreview')
  const contig =
    meta.contigs.find((candidate) => candidate.name === densityContig) ??
    meta.contigs[0]
  return (
    <div className='shrink-0 space-y-3 border-b px-4 py-3'>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-xs'>
        <div className='flex items-center gap-2 text-sm font-medium'>
          <Dna className='size-4 text-primary' />
          <span>{meta.version}</span>
          <Badge variant='secondary' className='font-normal'>
            {meta.kind.toUpperCase()}
          </Badge>
        </div>
        <PreviewStat
          label={t('variants')}
          value={meta.record_count.toLocaleString()}
        />
        <PreviewStat
          label={t('samples')}
          value={meta.sample_count.toLocaleString()}
        />
        <PreviewStat
          label={t('contigs')}
          value={meta.contigs.length.toLocaleString()}
        />
        <PreviewStat
          label='Ts/Tv'
          value={meta.ts_tv_ratio === null ? '—' : meta.ts_tv_ratio.toFixed(2)}
        />
        <div className='flex flex-wrap gap-1.5'>
          {VARIANT_TYPES.map((type) =>
            meta.type_counts[type] > 0 ? (
              <VariantBadge key={type} type={type}>
                {t(`types.${type}`)} {meta.type_counts[type].toLocaleString()}
              </VariantBadge>
            ) : null,
          )}
        </div>
      </div>
      {contig && (
        <div className='flex items-center gap-3'>
          <Select value={contig.name} onValueChange={onDensityContigChange}>
            <SelectTrigger
              size='sm'
              aria-label={t('densityContig')}
              className='w-44 shrink-0'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meta.contigs.map((candidate) => (
                <SelectItem key={candidate.name} value={candidate.name}>
                  {candidate.name} · {candidate.count.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DensityChart
            contig={contig}
            label={t('densityLabel', { contig: contig.name })}
          />
        </div>
      )}
    </div>
  )
}

function RecordDetail({
  detail,
  loading,
  onClose,
}: {
  detail: VcfPreviewDetail | null
  loading: boolean
  onClose: () => void
}) {
  const t = useTranslations('Project.runDetail.vcfPreview')
  if (loading && !detail) {
    return (
      <aside
        aria-busy='true'
        className='flex w-105 max-w-[48%] shrink-0 flex-col gap-3 border-l bg-muted/10 p-3'
      >
        <Skeleton className='h-10 w-2/3' />
        <Skeleton className='h-20' />
        <Skeleton className='h-40' />
      </aside>
    )
  }
  if (!detail) return null
  return (
    <aside className='flex w-105 max-w-[48%] shrink-0 flex-col border-l bg-muted/10'>
      <div className='flex items-start justify-between border-b px-3 py-2'>
        <div>
          <div className='flex items-center gap-2'>
            <h3 className='text-sm font-semibold'>{t('recordDetail')}</h3>
            <VariantBadge type={detail.type}>
              {t(`types.${detail.type}`)}
            </VariantBadge>
          </div>
          <p className='mt-1 font-mono text-xs text-muted-foreground'>
            {detail.chrom}:{formatPosition(detail.pos)} {detail.ref} →{' '}
            {detail.alts.join(', ')}
          </p>
        </div>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          onClick={onClose}
          aria-label={t('closeDetail')}
        >
          <X className='size-4' />
        </Button>
      </div>
      <div className='min-h-0 flex-1 space-y-4 overflow-auto p-3 text-xs'>
        <dl className='grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5'>
          <dt className='text-muted-foreground'>{t('id')}</dt>
          <dd className='font-mono'>{detail.id}</dd>
          <dt className='text-muted-foreground'>{t('quality')}</dt>
          <dd>{formatQuality(detail.qual)}</dd>
          <dt className='text-muted-foreground'>{t('filter')}</dt>
          <dd className='flex flex-wrap gap-1'>
            {detail.filters.map((filter) => (
              <span key={filter.id} title={filter.description ?? undefined}>
                <FilterValue value={filter.id} />
              </span>
            ))}
          </dd>
        </dl>

        <section>
          <h4 className='mb-2 text-xs font-semibold'>{t('info')}</h4>
          {detail.info.length === 0 ? (
            <p className='text-muted-foreground'>{t('noInfo')}</p>
          ) : (
            <dl className='space-y-2'>
              {detail.info.map((item) => (
                <div
                  key={item.key}
                  className='rounded-lg border bg-background p-2'
                >
                  <div className='flex gap-2'>
                    <dt className='font-mono font-semibold'>{item.key}</dt>
                    <dd className='min-w-0 break-all font-mono text-foreground/80'>
                      {typeof item.value === 'boolean' ? t('flag') : item.value}
                    </dd>
                  </div>
                  {item.description && (
                    <p className='mt-1 text-[11px] text-muted-foreground'>
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </dl>
          )}
        </section>

        {detail.samples.length > 0 && (
          <section>
            <h4 className='mb-2 text-xs font-semibold'>{t('genotypes')}</h4>
            <div className='mb-2 grid grid-cols-2 gap-1.5 text-[11px]'>
              {(['hom_ref', 'het', 'hom_alt', 'missing'] as const).map(
                (category) => (
                  <div
                    key={category}
                    className='flex items-center justify-between gap-2 rounded-md bg-muted px-2 py-1'
                  >
                    <span className='text-muted-foreground'>
                      {t(`genotypeLabels.${category}`)}
                    </span>
                    <span className='font-semibold tabular-nums'>
                      {detail.genotype_counts[category]}
                    </span>
                  </div>
                ),
              )}
            </div>
            <div className='overflow-auto rounded-lg border bg-background'>
              <table className='w-full border-collapse text-left'>
                <thead className='bg-muted/40 text-muted-foreground'>
                  <tr>
                    <th className='px-2 py-1.5 font-medium'>{t('sample')}</th>
                    {detail.format.map((field) => (
                      <th
                        key={field.key}
                        className='px-2 py-1.5 font-mono font-medium'
                        title={field.description ?? undefined}
                      >
                        {field.key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.samples.map((sample) => (
                    <tr key={sample.sample} className='border-t'>
                      <td className='max-w-40 truncate px-2 py-1.5 font-medium'>
                        {sample.sample}
                      </td>
                      {detail.format.map((field) => (
                        <td key={field.key} className='px-2 py-1.5 font-mono'>
                          {sample.values[field.key] ?? '.'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </aside>
  )
}

function RecordsTable({
  data,
  loading,
  selectedRecord,
  hasFilters,
  onSelect,
}: {
  data: VcfPreviewPage | null
  loading: boolean
  selectedRecord: number | null
  hasFilters: boolean
  onSelect: (row: VcfPreviewRow) => void
}) {
  const t = useTranslations('Project.runDetail.vcfPreview')
  if (loading && !data) {
    return (
      <div aria-busy='true' className='flex flex-1 flex-col gap-2 p-3'>
        <span className='sr-only'>{t('loading')}</span>
        {SKELETON_ROWS.map((row) => (
          <Skeleton key={row} className='h-7' />
        ))}
      </div>
    )
  }
  if (!data || data.rows.length === 0) {
    return (
      <PreviewEmpty
        className='flex-1'
        icon={<SearchX />}
        title={t('noMatches')}
        description={hasFilters ? t('noMatchesHint') : undefined}
      />
    )
  }
  return (
    <div className='relative min-h-0 flex-1 overflow-auto'>
      <PreviewProgress active={loading} />
      <table className='w-full min-w-212.5 border-collapse text-left text-xs'>
        <thead className='sticky top-0 z-10 bg-muted text-muted-foreground shadow-[0_1px_0_var(--border)]'>
          <tr>
            {(
              [
                'chrom',
                'pos',
                'id',
                'ref',
                'alt',
                'qual',
                'filter',
                'type',
              ] as const
            ).map((column) => (
              <th key={column} className='px-3 py-2 font-medium'>
                {t(`columns.${column}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn('transition-opacity', loading && 'opacity-55')}>
          {data.rows.map((row) => (
            <tr
              key={row.record_index}
              tabIndex={0}
              aria-selected={selectedRecord === row.record_index}
              className={cn(
                'cursor-pointer border-b outline-none hover:bg-muted/50 focus-visible:bg-muted/60',
                selectedRecord === row.record_index &&
                  'bg-primary/8 shadow-[inset_2px_0_0_var(--primary)] hover:bg-primary/10',
              )}
              onClick={() => onSelect(row)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect(row)
                }
              }}
            >
              <td className='px-3 py-2 font-medium'>{row.chrom}</td>
              <td className='px-3 py-2 font-mono tabular-nums'>
                {formatPosition(row.pos)}
              </td>
              <td className='max-w-36 truncate px-3 py-2 font-mono'>
                {row.id}
              </td>
              <td className='max-w-28 truncate px-3 py-2 font-mono'>
                {row.ref}
              </td>
              <td className='max-w-48 truncate px-3 py-2 font-mono'>
                {row.alt}
              </td>
              <td className='px-3 py-2 font-mono tabular-nums'>
                {formatQuality(row.qual)}
              </td>
              <td className='px-3 py-2'>
                <FilterValue value={row.filter} />
              </td>
              <td className='px-3 py-2'>
                <VariantBadge type={row.type}>
                  {t(`types.${row.type}`)}
                </VariantBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function hasActiveFilters(query: ActiveQuery): boolean {
  return (
    query.contig !== INITIAL_QUERY.contig ||
    query.variantType !== INITIAL_QUERY.variantType ||
    query.filterStatus !== INITIAL_QUERY.filterStatus ||
    query.search !== '' ||
    query.minQual !== null
  )
}

function parseMinQual(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

function VcfFilterBar({
  contigs,
  query,
  error,
  onChange,
  onClear,
}: {
  contigs: VcfPreviewContig[]
  query: ActiveQuery
  error: string
  onChange: (changes: Partial<ActiveQuery>) => void
  onClear: () => void
}) {
  const t = useTranslations('Project.runDetail.vcfPreview')
  // Drafts start empty: the bar mounts with the preview, before any query.
  const [search, setSearch] = useState('')
  const [minQual, setMinQual] = useState('')
  const hasFilters = hasActiveFilters(query)
  const textDirty =
    search.trim() !== query.search || parseMinQual(minQual) !== query.minQual

  const applyTextFilters = () => {
    const parsed = parseMinQual(minQual)
    if (parsed !== null && !Number.isFinite(parsed)) return
    onChange({ search: search.trim(), minQual: parsed })
  }

  const clear = () => {
    setSearch('')
    setMinQual('')
    onClear()
  }

  return (
    <PreviewToolbar>
      <Select
        value={query.contig}
        onValueChange={(value) => onChange({ contig: value })}
      >
        <SelectTrigger
          size='sm'
          aria-label={t('contig')}
          className='w-40 bg-background'
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>{t('allContigs')}</SelectItem>
          {contigs.map((contig) => (
            <SelectItem key={contig.name} value={contig.name}>
              {contig.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={query.variantType}
        onValueChange={(value) =>
          onChange({ variantType: value as ActiveQuery['variantType'] })
        }
      >
        <SelectTrigger
          size='sm'
          aria-label={t('variantType')}
          className='w-32 bg-background'
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>{t('allTypes')}</SelectItem>
          {VARIANT_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {t(`types.${type}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={query.filterStatus}
        onValueChange={(value) =>
          onChange({ filterStatus: value as ActiveQuery['filterStatus'] })
        }
      >
        <SelectTrigger
          size='sm'
          aria-label={t('filterStatus')}
          className='w-32 bg-background'
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>{t('allFilters')}</SelectItem>
          {FILTER_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {t(`statuses.${status}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <PreviewSearch
        value={search}
        onChange={setSearch}
        onSubmit={applyTextFilters}
        placeholder={t('search')}
      />
      <Input
        aria-label={t('minQual')}
        type='number'
        value={minQual}
        onChange={(event) => setMinQual(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') applyTextFilters()
        }}
        placeholder={t('minQual')}
        className='h-8 w-28 bg-background text-xs'
      />
      <Button
        type='button'
        size='sm'
        variant={textDirty ? 'default' : 'outline'}
        onClick={applyTextFilters}
      >
        {t('apply')}
      </Button>
      {hasFilters && (
        <Button type='button' size='sm' variant='ghost' onClick={clear}>
          <X />
          {t('clear')}
        </Button>
      )}
      {error && (
        <span role='alert' className='text-xs text-destructive'>
          {error}
        </span>
      )}
    </PreviewToolbar>
  )
}

function VcfPager({
  data,
  page,
  pageCount,
  loading,
  onPageChange,
}: {
  data: VcfPreviewPage | null
  page: number
  pageCount: number
  loading: boolean
  onPageChange: (page: number) => void
}) {
  const t = useTranslations('Project.runDetail.vcfPreview')
  const hasRows = data !== null && data.rows.length > 0
  return (
    <PreviewFooter>
      <span className='tabular-nums'>
        {t('rowRange', {
          start: hasRows ? data.offset + 1 : 0,
          end: hasRows ? data.offset + data.rows.length : 0,
          total: data?.total ?? 0,
        })}
      </span>
      <div className='flex items-center gap-2'>
        <Button
          type='button'
          size='icon-xs'
          variant='outline'
          disabled={page === 0 || loading}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          aria-label={t('previous')}
        >
          <ChevronLeft />
        </Button>
        <span className='tabular-nums'>
          {t('page', { page: page + 1, total: pageCount })}
        </span>
        <Button
          type='button'
          size='icon-xs'
          variant='outline'
          disabled={!data?.has_more || loading}
          onClick={() => onPageChange(page + 1)}
          aria-label={t('next')}
        >
          <ChevronRight />
        </Button>
      </div>
    </PreviewFooter>
  )
}

export function VcfPreview({
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
  const t = useTranslations('Project.runDetail.vcfPreview')
  const [meta, setMeta] = useState<VcfPreviewMeta | null>(null)
  const [data, setData] = useState<VcfPreviewPage | null>(null)
  const [detail, setDetail] = useState<VcfPreviewDetail | null>(null)
  const [query, setQuery] = useState<ActiveQuery>(INITIAL_QUERY)
  const [page, setPage] = useState(0)
  const [densityContig, setDensityContig] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<number | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!active || meta) return
    const controller = new AbortController()
    setMetaLoading(true)
    setError('')
    getRunVcfPreviewMeta(runUid, generation, path, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        setMeta(result)
        setDensityContig(result.default_contig ?? result.contigs[0]?.name ?? '')
        setMetaLoading(false)
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setError(requestError(cause))
        setMetaLoading(false)
      })
    return () => controller.abort()
  }, [active, generation, meta, path, runUid])

  useEffect(() => {
    if (!active || !meta) return
    const controller = new AbortController()
    setDataLoading(true)
    setError('')
    getRunVcfPreviewPage(
      runUid,
      generation,
      path,
      {
        offset: page * PAGE_SIZE,
        limit: PAGE_SIZE,
        contig: query.contig === 'all' ? null : query.contig,
        variant_type: query.variantType,
        filter_status: query.filterStatus,
        search: query.search,
        min_qual: query.minQual,
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
    return () => controller.abort()
  }, [active, generation, meta, page, path, query, runUid])

  useEffect(() => {
    if (!active || selectedRecord === null) return
    const controller = new AbortController()
    setDetailLoading(true)
    getRunVcfPreviewDetail(
      runUid,
      generation,
      path,
      selectedRecord,
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) return
        setDetail(result)
        setDetailLoading(false)
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setError(requestError(cause))
        setDetailLoading(false)
      })
    return () => controller.abort()
  }, [active, generation, path, runUid, selectedRecord])

  const pageCount = Math.max(
    1,
    Math.ceil((data?.total ?? meta?.record_count ?? 0) / PAGE_SIZE),
  )

  const changeQuery = (changes: Partial<ActiveQuery>) => {
    setQuery((current) => ({ ...current, ...changes }))
    setPage(0)
    setSelectedRecord(null)
    setDetail(null)
  }

  const clearFilters = () => {
    setQuery(INITIAL_QUERY)
    setPage(0)
    setSelectedRecord(null)
    setDetail(null)
  }

  if (metaLoading && !meta) return <PreviewLoading label={t('loading')} />
  if (error && !meta) return <PreviewError message={error} />
  if (!meta) return null
  const hasFilters = hasActiveFilters(query)

  return (
    <div className='flex size-full min-h-0 flex-col bg-background'>
      <Summary
        meta={meta}
        densityContig={densityContig}
        onDensityContigChange={setDensityContig}
      />
      <VcfFilterBar
        contigs={meta.contigs}
        query={query}
        error={error}
        onChange={changeQuery}
        onClear={clearFilters}
      />

      <div className='flex min-h-0 flex-1'>
        <div className='flex min-w-0 flex-1 flex-col'>
          <RecordsTable
            data={data}
            loading={dataLoading}
            selectedRecord={selectedRecord}
            hasFilters={hasFilters}
            onSelect={(row) => {
              setSelectedRecord(row.record_index)
              setDetail(null)
            }}
          />
          <VcfPager
            data={data}
            page={page}
            pageCount={pageCount}
            loading={dataLoading}
            onPageChange={setPage}
          />
        </div>
        <RecordDetail
          detail={detail}
          loading={detailLoading}
          onClose={() => {
            setSelectedRecord(null)
            setDetail(null)
          }}
        />
      </div>
    </div>
  )
}
