'use client'

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Dna,
  Loader2,
  Search,
  X,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import {
  getRunVcfPreviewDetail,
  getRunVcfPreviewMeta,
  getRunVcfPreviewPage,
} from '@/app/actions/run'
import { Button } from '@/components/ui/button'
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
  VcfFilterStatus,
  VcfPreviewContig,
  VcfPreviewDetail,
  VcfPreviewMeta,
  VcfPreviewPage,
  VcfPreviewRow,
  VcfVariantType,
} from '@/types/run'

const PAGE_SIZE = 50
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
      <div className='flex h-12 items-end gap-px overflow-hidden rounded-sm bg-muted/40 px-1 pt-1'>
        {contig.bins.map((count, index) => (
          <div
            // Density bins have stable positions and can legitimately share counts.
            key={`${contig.name}-${index}`}
            className='min-h-px flex-1 rounded-t-sm bg-primary/65'
            style={{ height: `${Math.max(2, (count / maximum) * 100)}%` }}
            title={`${count}`}
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
    <div className='shrink-0 space-y-3 border-b bg-muted/15 px-4 py-3'>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
        <div className='flex items-center gap-2 font-medium'>
          <Dna className='size-4 text-primary' />
          <span>{meta.version}</span>
          <span className='text-xs font-normal text-muted-foreground'>
            {meta.kind.toUpperCase()}
          </span>
        </div>
        <span className='text-xs text-muted-foreground'>
          {t('variantCount', { count: meta.record_count })}
        </span>
        <span className='text-xs text-muted-foreground'>
          {t('sampleCount', { count: meta.sample_count })}
        </span>
        <span className='text-xs text-muted-foreground'>
          {t('contigCount', { count: meta.contigs.length })}
        </span>
        <span className='text-xs text-muted-foreground'>
          {t('tsTv', {
            value:
              meta.ts_tv_ratio === null ? '—' : meta.ts_tv_ratio.toFixed(2),
          })}
        </span>
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
            <SelectTrigger size='sm' className='w-44 shrink-0'>
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
      <aside className='flex w-105 shrink-0 items-center justify-center border-l text-muted-foreground'>
        <Loader2 className='size-4 animate-spin' />
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
          <dd>
            {detail.filters.map((filter) => (
              <span key={filter.id} title={filter.description ?? undefined}>
                {filter.id}{' '}
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
                  className='rounded border bg-background p-2'
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
            <div className='mb-2 grid grid-cols-2 gap-1 text-[11px]'>
              {(['hom_ref', 'het', 'hom_alt', 'missing'] as const).map(
                (category) => (
                  <div key={category} className='rounded bg-muted px-2 py-1'>
                    {t(`genotypeLabels.${category}`)}{' '}
                    <span className='font-semibold'>
                      {detail.genotype_counts[category]}
                    </span>
                  </div>
                ),
              )}
            </div>
            <div className='overflow-auto rounded border bg-background'>
              <table className='w-full border-collapse text-left'>
                <thead className='bg-muted/70'>
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
  onSelect,
}: {
  data: VcfPreviewPage | null
  loading: boolean
  selectedRecord: number | null
  onSelect: (row: VcfPreviewRow) => void
}) {
  const t = useTranslations('Project.runDetail.vcfPreview')
  if (loading && !data) {
    return (
      <div className='flex flex-1 items-center justify-center text-muted-foreground'>
        <Loader2 className='size-4 animate-spin' />
      </div>
    )
  }
  if (!data || data.rows.length === 0) {
    return (
      <div className='flex flex-1 items-center justify-center text-sm text-muted-foreground'>
        {t('noMatches')}
      </div>
    )
  }
  return (
    <div className='min-h-0 flex-1 overflow-auto'>
      <table className='w-full min-w-212.5 border-collapse text-left text-xs'>
        <thead className='sticky top-0 z-10 bg-muted/95 shadow-[0_1px_0_hsl(var(--border))]'>
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
        <tbody className={cn(loading && 'opacity-55')}>
          {data.rows.map((row) => (
            <tr
              key={row.record_index}
              className={cn(
                'cursor-pointer border-b hover:bg-muted/50',
                selectedRecord === row.record_index && 'bg-primary/8',
              )}
              onClick={() => onSelect(row)}
            >
              <td className='px-3 py-2 font-medium'>{row.chrom}</td>
              <td className='px-3 py-2 font-mono'>{formatPosition(row.pos)}</td>
              <td className='max-w-36 truncate px-3 py-2 font-mono'>
                {row.id}
              </td>
              <td className='max-w-28 truncate px-3 py-2 font-mono'>
                {row.ref}
              </td>
              <td className='max-w-48 truncate px-3 py-2 font-mono'>
                {row.alt}
              </td>
              <td className='px-3 py-2 font-mono'>{formatQuality(row.qual)}</td>
              <td className='px-3 py-2'>{row.filter}</td>
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
  const [search, setSearch] = useState('')
  const [minQual, setMinQual] = useState('')
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
  const range = useMemo(() => {
    if (!data || data.rows.length === 0) return { start: 0, end: 0 }
    return { start: data.offset + 1, end: data.offset + data.rows.length }
  }, [data])

  const changeQuery = (changes: Partial<ActiveQuery>) => {
    setQuery((current) => ({ ...current, ...changes }))
    setPage(0)
    setSelectedRecord(null)
    setDetail(null)
  }

  const applyTextFilters = () => {
    const parsed = minQual.trim() === '' ? null : Number(minQual)
    if (parsed !== null && !Number.isFinite(parsed)) return
    changeQuery({ search: search.trim(), minQual: parsed })
  }

  const clearFilters = () => {
    setSearch('')
    setMinQual('')
    setQuery(INITIAL_QUERY)
    setPage(0)
    setSelectedRecord(null)
    setDetail(null)
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
  if (!meta) return null

  return (
    <div className='flex size-full min-h-0 flex-col bg-background'>
      <Summary
        meta={meta}
        densityContig={densityContig}
        onDensityContigChange={setDensityContig}
      />
      <div className='flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2'>
        <Select
          value={query.contig}
          onValueChange={(value) => changeQuery({ contig: value })}
        >
          <SelectTrigger size='sm' className='w-40'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t('allContigs')}</SelectItem>
            {meta.contigs.map((contig) => (
              <SelectItem key={contig.name} value={contig.name}>
                {contig.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={query.variantType}
          onValueChange={(value) =>
            changeQuery({ variantType: value as ActiveQuery['variantType'] })
          }
        >
          <SelectTrigger size='sm' className='w-32'>
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
            changeQuery({ filterStatus: value as ActiveQuery['filterStatus'] })
          }
        >
          <SelectTrigger size='sm' className='w-32'>
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
        <div className='relative w-48'>
          <Search className='absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') applyTextFilters()
            }}
            placeholder={t('search')}
            className='h-8 pl-8 text-xs'
          />
        </div>
        <Input
          type='number'
          value={minQual}
          onChange={(event) => setMinQual(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') applyTextFilters()
          }}
          placeholder={t('minQual')}
          className='h-8 w-28 text-xs'
        />
        <Button type='button' size='sm' onClick={applyTextFilters}>
          {t('apply')}
        </Button>
        <Button type='button' size='sm' variant='ghost' onClick={clearFilters}>
          {t('clear')}
        </Button>
        {error && <span className='text-xs text-destructive'>{error}</span>}
      </div>

      <div className='flex min-h-0 flex-1'>
        <div className='flex min-w-0 flex-1 flex-col'>
          <RecordsTable
            data={data}
            loading={dataLoading}
            selectedRecord={selectedRecord}
            onSelect={(row) => {
              setSelectedRecord(row.record_index)
              setDetail(null)
            }}
          />
          <div className='flex shrink-0 items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground'>
            <span>
              {t('rowRange', {
                start: range.start,
                end: range.end,
                total: data?.total ?? 0,
              })}
            </span>
            <div className='flex items-center gap-2'>
              <span>{t('page', { page: page + 1, total: pageCount })}</span>
              <Button
                type='button'
                size='icon-sm'
                variant='outline'
                disabled={page === 0 || dataLoading}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                aria-label={t('previous')}
              >
                <ChevronLeft className='size-4' />
              </Button>
              <Button
                type='button'
                size='icon-sm'
                variant='outline'
                disabled={!data?.has_more || dataLoading}
                onClick={() => setPage((current) => current + 1)}
                aria-label={t('next')}
              >
                <ChevronRight className='size-4' />
              </Button>
            </div>
          </div>
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
