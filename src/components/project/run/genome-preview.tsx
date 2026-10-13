'use client'

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CornerDownLeft,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import {
  getRunFilePreviewMeta,
  getRunFilePreviewRegion,
} from '@/app/actions/run'
import {
  type GenomeViewport,
  parseLocus,
} from '@/components/project/run/genome-locus'
import {
  formatBasePairs,
  IconTooltipButton,
  PreviewEmpty,
  PreviewError,
  PreviewFooter,
  PreviewHint,
  PreviewHoverCard,
  PreviewLoading,
  PreviewProgress,
  PreviewSearch,
  PreviewToolbar,
  readCssColor,
  ZoomControls,
} from '@/components/project/run/preview-chrome'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { PreviewMeta, PreviewRegion } from '@/types/run'

type IntervalItem = Extract<PreviewRegion, { kind: 'intervals' }>['items'][0]
type Hit = { x1: number; x2: number; y: number; item: IntervalItem }
type Plot = { left: number; right: number; top: number; bottom: number }
type Hover = { x: number; y: number; content: React.ReactNode }

const LANE_HEIGHT = 28
const FEATURE_HEIGHT = 12
const MIN_PLOT_HEIGHT = 220
const MAX_PLOT_HEIGHT = 520

function isSignalKind(kind: PreviewMeta['kind'] | undefined): boolean {
  return kind === 'bigwig' || kind === 'bedgraph' || kind === 'wig'
}

/** Categorical feature palette (data colors, not semantic tokens). */
function featureColor(featureType: string | undefined): string {
  switch (featureType?.toLowerCase()) {
    case 'gene':
      return '#7c3aed'
    case 'mrna':
    case 'transcript':
      return '#2563eb'
    case 'exon':
      return '#0d9488'
    case 'cds':
      return '#ea580c'
    case 'utr':
    case 'five_prime_utr':
    case 'three_prime_utr':
      return '#64748b'
    default:
      return '#0f766e'
  }
}

function formatLocus(view: GenomeViewport): string {
  return `${view.chrom}:${(view.start + 1).toLocaleString('en-US')}-${view.end.toLocaleString('en-US')}`
}

function errorMessage(
  error: unknown,
  timeout: boolean,
  timedOutText: string,
): string {
  if (timeout || (error instanceof DOMException && error.name === 'AbortError'))
    return timedOutText
  return error instanceof Error ? error.message : String(error)
}

function niceTicks(start: number, end: number, target: number): number[] {
  const span = end - start
  if (span <= 0) return []
  const raw = span / Math.max(1, target)
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step =
    [1, 2, 5, 10].map((factor) => factor * magnitude).find((s) => s >= raw) ??
    magnitude * 10
  const ticks: number[] = []
  for (let tick = Math.ceil(start / step) * step; tick <= end; tick += step)
    ticks.push(tick)
  return ticks
}

function plotFor(width: number, height: number): Plot {
  return { left: 56, right: width - 16, top: 14, bottom: height - 30 }
}

function drawTrack(
  canvas: HTMLCanvasElement,
  region: PreviewRegion,
  width: number,
  height: number,
): Hit[] {
  const ratio = window.devicePixelRatio || 1
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const context = canvas.getContext('2d')
  if (!context) return []
  const colors = {
    primary: readCssColor(canvas, '--primary', '#175b97'),
    muted: readCssColor(canvas, '--muted-foreground', '#64748b'),
    border: readCssColor(canvas, '--border', '#e2e8f0'),
    foreground: readCssColor(canvas, '--foreground', '#0f172a'),
  }
  context.scale(ratio, ratio)
  context.clearRect(0, 0, width, height)
  const { left, right, top, bottom } = plotFor(width, height)
  const span = Math.max(1, region.end - region.start)
  const toX = (position: number) =>
    left + ((position - region.start) / span) * (right - left)

  // Position axis with gridlines.
  context.font = '11px ui-sans-serif, system-ui, sans-serif'
  context.textBaseline = 'top'
  context.textAlign = 'center'
  const ticks = niceTicks(
    region.start,
    region.end,
    Math.max(2, Math.floor((right - left) / 110)),
  )
  for (const tick of ticks) {
    const x = Math.round(toX(tick)) + 0.5
    context.strokeStyle = colors.border
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(x, top)
    context.lineTo(x, bottom)
    context.stroke()
    context.fillStyle = colors.muted
    context.fillText(tick.toLocaleString('en-US'), x, bottom + 8)
  }
  context.strokeStyle = colors.muted
  context.beginPath()
  context.moveTo(left, bottom + 0.5)
  context.lineTo(right, bottom + 0.5)
  context.stroke()

  if (region.kind === 'signal') {
    const finite = region.points.filter(
      (value): value is number => value !== null && Number.isFinite(value),
    )
    if (!finite.length) return []
    const minimum = Math.min(0, ...finite)
    const maximum = Math.max(0, ...finite)
    const range = maximum - minimum || 1
    const toY = (value: number) =>
      bottom - ((value - minimum) / range) * (bottom - top)
    const xAt = (index: number) =>
      left + (index / Math.max(1, region.points.length - 1)) * (right - left)

    context.textAlign = 'right'
    context.textBaseline = 'middle'
    context.fillStyle = colors.muted
    context.fillText(maximum.toPrecision(3), left - 8, top + 4)
    context.fillText(minimum.toPrecision(3), left - 8, bottom - 4)
    if (minimum < 0) {
      context.strokeStyle = colors.border
      context.beginPath()
      context.moveTo(left, toY(0))
      context.lineTo(right, toY(0))
      context.stroke()
    }

    // Filled area per contiguous run of finite values, then the outline.
    const baseline = toY(Math.max(minimum, Math.min(0, maximum)))
    const runs: number[][] = []
    let current: number[] = []
    region.points.forEach((value, index) => {
      if (value === null || !Number.isFinite(value)) {
        if (current.length) runs.push(current)
        current = []
        return
      }
      current.push(index)
    })
    if (current.length) runs.push(current)

    context.fillStyle = colors.primary
    context.strokeStyle = colors.primary
    context.lineWidth = 1.5
    context.lineJoin = 'round'
    for (const run of runs) {
      context.beginPath()
      context.moveTo(xAt(run[0]), baseline)
      for (const index of run)
        context.lineTo(xAt(index), toY(region.points[index] as number))
      context.lineTo(xAt(run[run.length - 1]), baseline)
      context.closePath()
      context.globalAlpha = 0.16
      context.fill()
      context.globalAlpha = 1
      context.beginPath()
      run.forEach((index, position) => {
        const y = toY(region.points[index] as number)
        if (position === 0) context.moveTo(xAt(index), y)
        else context.lineTo(xAt(index), y)
      })
      if (run.length === 1) {
        context.fillRect(
          xAt(run[0]) - 1.5,
          toY(region.points[run[0]] as number) - 1.5,
          3,
          3,
        )
      }
      context.stroke()
    }
    return []
  }

  const laneCount = Math.max(1, Math.floor((bottom - top) / LANE_HEIGHT))
  const laneEnds = Array<number>(laneCount).fill(-Infinity)
  const hits: Hit[] = []
  context.textAlign = 'left'
  context.textBaseline = 'top'
  for (const item of region.items) {
    const x1 = toX(Math.max(item.start, region.start))
    const x2 = toX(Math.min(item.end, region.end))
    let lane = laneEnds.findIndex((last) => x1 > last + 4)
    if (lane === -1) lane = laneCount - 1
    const labelWidth = item.name
      ? Math.min(context.measureText(item.name).width, 140)
      : 0
    laneEnds[lane] = Math.max(x2, x1 + labelWidth)
    const y = top + 4 + lane * LANE_HEIGHT
    const featureWidth = Math.max(2, x2 - x1)
    context.fillStyle = featureColor(item.feature_type)
    context.beginPath()
    context.roundRect(x1, y, featureWidth, FEATURE_HEIGHT, 2)
    context.fill()
    if ((item.strand === '+' || item.strand === '-') && featureWidth > 24) {
      context.strokeStyle = 'rgba(255,255,255,0.85)'
      context.lineWidth = 1
      const direction = item.strand === '+' ? 1 : -1
      for (let x = x1 + 10; x < x1 + featureWidth - 6; x += 14) {
        context.beginPath()
        context.moveTo(x - 2 * direction, y + 3)
        context.lineTo(x + 2 * direction, y + FEATURE_HEIGHT / 2)
        context.lineTo(x - 2 * direction, y + FEATURE_HEIGHT - 3)
        context.stroke()
      }
    }
    if (item.name && labelWidth > 0) {
      context.fillStyle = colors.foreground
      context.fillText(item.name, x1, y + FEATURE_HEIGHT + 2, 140)
    }
    hits.push({ x1, x2: x1 + featureWidth, y, item })
  }
  return hits
}

export function GenomePreview({
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
  const t = useTranslations('Project.runDetail.preview')
  const [meta, setMeta] = useState<PreviewMeta | null>(null)
  const [view, setView] = useState<GenomeViewport | null>(null)
  const [locus, setLocus] = useState('')
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [region, setRegion] = useState<PreviewRegion | null>(null)
  const [error, setError] = useState('')
  const [metaLoading, setMetaLoading] = useState(false)
  const [regionLoading, setRegionLoading] = useState(false)
  const [hover, setHover] = useState<Hover | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const hitsRef = useRef<Hit[]>([])
  const dragRef = useRef<{ x: number; moved: boolean } | null>(null)
  const [size, setSize] = useState({ width: 700, height: 280 })
  const cache = useRef(new Map<string, PreviewRegion>())
  const viewRef = useRef(view)
  viewRef.current = view

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchTerm(search), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!active) return
    const controller = new AbortController()
    let timedOut = false
    const timer = window.setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 2500)
    setMetaLoading(true)
    setError('')
    getRunFilePreviewMeta(
      runUid,
      generation,
      path,
      searchTerm,
      controller.signal,
    )
      .then((data) => {
        if (controller.signal.aborted) return
        setMeta(data)
        if (data.supported && !viewRef.current && data.default_chromosome) {
          const chromosome = data.chromosomes.find(
            (c) => c.name === data.default_chromosome,
          )
          const initial = {
            chrom: data.default_chromosome,
            start: 0,
            end: Math.min(
              chromosome?.length ?? 10000,
              isSignalKind(data.kind) ? 100000 : 10000,
            ),
          }
          if (initial.end > 0) {
            setView(initial)
            setLocus(formatLocus(initial))
          }
        }
        setMetaLoading(false)
      })
      .catch((cause) => {
        if (controller.signal.aborted && !timedOut) return
        setError(errorMessage(cause, timedOut, t('timeout')))
        setMetaLoading(false)
      })
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [active, runUid, generation, path, searchTerm, t])

  useEffect(() => {
    if (!active || !view || !meta?.supported) return
    const key = `${generation}:${path}:${view.chrom}:${view.start}:${view.end}`
    const cached = cache.current.get(key)
    if (cached) {
      setRegion(cached)
      setError('')
      setRegionLoading(false)
      return
    }
    const controller = new AbortController()
    let timedOut = false
    const timer = window.setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 2500)
    setRegionLoading(true)
    setError('')
    getRunFilePreviewRegion(runUid, generation, path, view, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        cache.current.set(key, data)
        if (cache.current.size > 8) {
          const oldest = cache.current.keys().next().value
          if (oldest !== undefined) cache.current.delete(oldest)
        }
        setRegion(data)
        setRegionLoading(false)
      })
      .catch((cause) => {
        if (controller.signal.aborted && !timedOut) return
        setError(errorMessage(cause, timedOut, t('timeout')))
        setRegionLoading(false)
      })
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [active, runUid, generation, path, view, meta, t])

  const hasRegion = region !== null
  useEffect(() => {
    if (!hasRegion || !wrapperRef.current) return
    const observer = new ResizeObserver((entries) => {
      const bounds = entries[0].contentRect
      setSize({
        width: Math.max(320, Math.floor(bounds.width)),
        height: Math.min(
          MAX_PLOT_HEIGHT,
          Math.max(MIN_PLOT_HEIGHT, Math.floor(bounds.height)),
        ),
      })
    })
    observer.observe(wrapperRef.current)
    return () => observer.disconnect()
  }, [hasRegion])

  useEffect(() => {
    if (region && canvasRef.current)
      hitsRef.current = drawTrack(
        canvasRef.current,
        region,
        size.width,
        size.height,
      )
  }, [region, size])

  const chromosomeLength = (chrom: string) =>
    meta?.chromosomes.find((item) => item.name === chrom)?.length ??
    Number.MAX_SAFE_INTEGER
  const maxSpan = isSignalKind(meta?.kind) ? 10_000_000 : 1_000_000

  const moveTo = (next: GenomeViewport) => {
    setView(next)
    setLocus(formatLocus(next))
    setError('')
  }

  const applyLocus = () => {
    const parsed = parseLocus(locus)
    if (!parsed || parsed.end - parsed.start > maxSpan) {
      setError(t('invalidLocus'))
      return
    }
    moveTo(parsed)
  }

  const zoom = (factor: number, anchor?: number) => {
    if (!view) return
    const length = chromosomeLength(view.chrom)
    const span = Math.min(
      maxSpan,
      length,
      Math.max(10, Math.round((view.end - view.start) * factor)),
    )
    const center = anchor ?? Math.floor((view.start + view.end) / 2)
    const start = Math.max(
      0,
      Math.min(length - span, center - Math.floor(span / 2)),
    )
    moveTo({ ...view, start, end: start + span })
  }

  const pan = (fraction: number) => {
    if (!view) return
    const span = view.end - view.start
    const length = chromosomeLength(view.chrom)
    const start = Math.max(
      0,
      Math.min(length - span, view.start + Math.round(span * fraction)),
    )
    if (start !== view.start) moveTo({ ...view, start, end: start + span })
  }

  const selectChromosome = (name: string) => {
    const chromosome = meta?.chromosomes.find((item) => item.name === name)
    if (!chromosome) return
    moveTo({
      chrom: chromosome.name,
      start: 0,
      end: Math.min(
        chromosome.length,
        isSignalKind(meta?.kind) ? 100000 : 10000,
      ),
    })
  }

  const plot = plotFor(size.width, size.height)
  const positionAt = (x: number) =>
    region
      ? region.start +
        ((x - plot.left) / (plot.right - plot.left)) *
          (region.end - region.start)
      : 0

  const describeHover = (x: number, y: number): React.ReactNode | null => {
    if (!region || x < plot.left || x > plot.right) return null
    if (region.kind === 'signal') {
      const count = region.points.length
      if (!count) return null
      const index = Math.round(
        ((x - plot.left) / (plot.right - plot.left)) * Math.max(0, count - 1),
      )
      const value = region.points[index]
      return (
        <>
          <div className='font-mono text-muted-foreground'>
            {region.chrom}:
            {Math.round(positionAt(x) + 1).toLocaleString('en-US')}
          </div>
          <div className='font-medium tabular-nums'>
            {value === null || value === undefined || !Number.isFinite(value)
              ? t('noValue')
              : value.toPrecision(4)}
          </div>
        </>
      )
    }
    const hit = hitsRef.current.find(
      (candidate) =>
        x >= candidate.x1 - 1 &&
        x <= candidate.x2 + 1 &&
        y >= candidate.y - 2 &&
        y <= candidate.y + FEATURE_HEIGHT + 2,
    )
    if (!hit) return null
    return (
      <>
        <div className='flex items-center gap-1.5 font-medium'>
          <span
            className='size-2 shrink-0 rounded-sm'
            style={{ backgroundColor: featureColor(hit.item.feature_type) }}
          />
          <span className='truncate'>{hit.item.name || t('unnamed')}</span>
        </div>
        <div className='font-mono text-muted-foreground'>
          {region.chrom}:{(hit.item.start + 1).toLocaleString('en-US')}-
          {hit.item.end.toLocaleString('en-US')}
          {hit.item.strand && hit.item.strand !== '.'
            ? ` (${hit.item.strand})`
            : ''}
        </div>
        <div className='text-muted-foreground'>
          {[
            hit.item.feature_type,
            formatBasePairs(hit.item.end - hit.item.start),
          ]
            .filter(Boolean)
            .join(' · ')}
        </div>
      </>
    )
  }

  if (!meta && metaLoading) return <PreviewLoading label={t('loadingMeta')} />
  if (!meta && error) return <PreviewError message={error} />
  if (!meta) return null
  if (!meta.supported) {
    return (
      <PreviewEmpty
        title={t('unsupported')}
        description={meta.reason ?? undefined}
      />
    )
  }
  if (!meta.default_chromosome && !searchTerm && !view) {
    return <PreviewEmpty title={t('emptyFile')} />
  }

  const emptyRegion =
    region?.kind === 'signal'
      ? region.points.every((point) => point === null)
      : region?.kind === 'intervals' && region.items.length === 0
  const visibleFeatureTypes =
    region?.kind === 'intervals'
      ? [
          ...new Set(region.items.flatMap((item) => item.feature_type ?? [])),
        ].slice(0, 8)
      : []
  const atStart = !view || view.start <= 0
  const atEnd = !view || view.end >= chromosomeLength(view.chrom)
  const span = view ? view.end - view.start : 0

  return (
    <div className='flex size-full min-h-0 flex-col bg-background text-sm'>
      <PreviewToolbar>
        <PreviewSearch
          value={search}
          onChange={setSearch}
          placeholder={t('searchChrom')}
          className='w-40'
        />
        <Select value={view?.chrom ?? ''} onValueChange={selectChromosome}>
          <SelectTrigger
            size='sm'
            aria-label={t('chromosome')}
            className='w-40 bg-background'
          >
            <SelectValue placeholder={t('chromosome')} />
          </SelectTrigger>
          <SelectContent>
            {view &&
              !meta.chromosomes.some((item) => item.name === view.chrom) && (
                <SelectItem value={view.chrom}>{view.chrom}</SelectItem>
              )}
            {meta.chromosomes.map((item) => (
              <SelectItem key={item.name} value={item.name}>
                <span className='flex-1'>{item.name}</span>
                <span className='text-xs text-muted-foreground tabular-nums'>
                  {formatBasePairs(item.length)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            applyLocus()
          }}
        >
          <InputGroup className='h-8 w-60 bg-background'>
            <InputGroupInput
              aria-label={t('locus')}
              value={locus}
              onChange={(event) => setLocus(event.target.value)}
              placeholder='chr1:1-1000'
              className='font-mono text-xs'
            />
            <InputGroupAddon align='inline-end'>
              <InputGroupButton type='submit' size='xs'>
                {t('show')}
                <CornerDownLeft />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
        <ButtonGroup>
          <IconTooltipButton
            label={t('panLeft')}
            onClick={() => pan(-0.5)}
            disabled={atStart}
          >
            <ChevronLeft />
          </IconTooltipButton>
          <IconTooltipButton
            label={t('panRight')}
            onClick={() => pan(0.5)}
            disabled={atEnd}
          >
            <ChevronRight />
          </IconTooltipButton>
        </ButtonGroup>
        <ZoomControls
          onZoomIn={() => zoom(0.5)}
          onZoomOut={() => zoom(2)}
          zoomInLabel={t('zoomIn')}
          zoomOutLabel={t('zoomOut')}
          disabled={!view}
          canZoomIn={span > 10}
          canZoomOut={
            !!view && span < Math.min(maxSpan, chromosomeLength(view.chrom))
          }
        />
        <PreviewHint>{t('coordinates')}</PreviewHint>
      </PreviewToolbar>

      {meta.has_more_chromosomes && !search && (
        <div className='shrink-0 border-b bg-info/5 px-3 py-1.5 text-xs text-info'>
          {t('searchHint')}
        </div>
      )}

      <div className='relative min-h-0 flex-1 overflow-hidden p-3'>
        <PreviewProgress active={regionLoading || metaLoading} />
        {error && (
          <Alert variant='destructive' className='mb-3'>
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {region ? (
          <div
            ref={wrapperRef}
            role='application'
            aria-label={t('track')}
            aria-roledescription={t('trackRole')}
            className='relative h-full max-h-130 min-h-55 cursor-grab touch-none overflow-hidden rounded-xl border bg-card select-none active:cursor-grabbing'
            onPointerDown={(event) => {
              if (event.button !== 0) return
              event.currentTarget.setPointerCapture(event.pointerId)
              dragRef.current = { x: event.clientX, moved: false }
              setHover(null)
            }}
            onPointerMove={(event) => {
              const drag = dragRef.current
              if (drag) {
                const delta = event.clientX - drag.x
                if (Math.abs(delta) > 3) drag.moved = true
                setDragOffset(delta)
                return
              }
              const rect = event.currentTarget.getBoundingClientRect()
              const x = event.clientX - rect.left
              const y = event.clientY - rect.top
              const content = describeHover(x, y)
              setHover(content ? { x, y, content } : null)
            }}
            onPointerUp={(event) => {
              const drag = dragRef.current
              dragRef.current = null
              event.currentTarget.releasePointerCapture(event.pointerId)
              setDragOffset(0)
              if (!drag?.moved || !view) return
              const delta = event.clientX - drag.x
              pan(-delta / (plot.right - plot.left))
            }}
            onPointerCancel={() => {
              dragRef.current = null
              setDragOffset(0)
            }}
            onLostPointerCapture={() => {
              if (!dragRef.current) return
              dragRef.current = null
              setDragOffset(0)
            }}
            onPointerLeave={() => setHover(null)}
            onDoubleClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              zoom(0.5, Math.round(positionAt(event.clientX - rect.left)))
            }}
          >
            <canvas
              ref={canvasRef}
              className={cn(
                'block transition-opacity',
                regionLoading && 'opacity-60',
              )}
              style={{ transform: `translateX(${dragOffset}px)` }}
            />
            {emptyRegion && !regionLoading && (
              <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
                <span className='rounded-md border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm'>
                  {t('emptyRegion')}
                </span>
              </div>
            )}
            {hover && (
              <PreviewHoverCard x={hover.x} y={hover.y} bounds={size}>
                {hover.content}
              </PreviewHoverCard>
            )}
          </div>
        ) : (
          !error && (
            <div
              aria-busy='true'
              className='h-full max-h-130 min-h-55 animate-pulse rounded-xl border bg-muted/40'
            >
              <span className='sr-only'>{t('loading')}</span>
            </div>
          )
        )}
      </div>

      <PreviewFooter>
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
          {view && (
            <span className='font-mono text-foreground'>
              {formatLocus(view)}
            </span>
          )}
          {view && (
            <span className='tabular-nums'>{formatBasePairs(span)}</span>
          )}
          {region?.kind === 'intervals' && (
            <span className='tabular-nums'>
              {t('featureCount', { count: region.items.length })}
            </span>
          )}
          {visibleFeatureTypes.map((featureType) => (
            <span key={featureType} className='inline-flex items-center gap-1'>
              <span
                className='size-2 rounded-sm'
                style={{ backgroundColor: featureColor(featureType) }}
              />
              {featureType}
            </span>
          ))}
        </div>
        <span className='hidden lg:inline'>{t('interactionHint')}</span>
      </PreviewFooter>
    </div>
  )
}
