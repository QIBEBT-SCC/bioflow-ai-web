'use client'

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
import type { PreviewMeta, PreviewRegion } from '@/types/run'

function isSignalKind(kind: PreviewMeta['kind'] | undefined): boolean {
  return kind === 'bigwig' || kind === 'bedgraph' || kind === 'wig'
}

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

function drawTrack(
  canvas: HTMLCanvasElement,
  region: PreviewRegion,
  width: number,
): void {
  const ratio = window.devicePixelRatio || 1
  const height = 280
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const context = canvas.getContext('2d')
  if (!context) return
  context.scale(ratio, ratio)
  context.clearRect(0, 0, width, height)
  const left = 48
  const right = width - 18
  const top = 22
  const bottom = height - 34
  context.strokeStyle = '#94a3b8'
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(left, top)
  context.lineTo(left, bottom)
  context.lineTo(right, bottom)
  context.stroke()
  context.fillStyle = '#64748b'
  context.font = '11px sans-serif'
  context.fillText(
    (region.start + 1).toLocaleString('en-US'),
    left,
    height - 12,
  )
  context.textAlign = 'right'
  context.fillText(region.end.toLocaleString('en-US'), right, height - 12)
  context.textAlign = 'left'

  if (region.kind === 'signal') {
    const finite = region.points.filter(
      (value): value is number => value !== null && Number.isFinite(value),
    )
    if (!finite.length) return
    const minimum = Math.min(0, ...finite)
    const maximum = Math.max(0, ...finite)
    const span = maximum - minimum || 1
    context.fillText(maximum.toPrecision(3), 3, top + 5)
    context.fillText(minimum.toPrecision(3), 3, bottom)
    context.strokeStyle = '#2563eb'
    context.lineWidth = 1.5
    context.beginPath()
    let penDown = false
    region.points.forEach((value, index) => {
      if (value === null || !Number.isFinite(value)) {
        penDown = false
        return
      }
      const x =
        left + (index / Math.max(1, region.points.length - 1)) * (right - left)
      const y = bottom - ((value - minimum) / span) * (bottom - top)
      if (penDown) context.lineTo(x, y)
      else context.moveTo(x, y)
      context.fillStyle = '#2563eb'
      context.fillRect(x - 1, y - 1, 2, 2)
      penDown = true
    })
    context.stroke()
    return
  }

  const laneEnds = Array<number>(8).fill(-Infinity)
  const span = region.end - region.start
  for (const item of region.items) {
    const x1 =
      left +
      ((Math.max(item.start, region.start) - region.start) / span) *
        (right - left)
    const x2 =
      left +
      ((Math.min(item.end, region.end) - region.start) / span) * (right - left)
    let lane = laneEnds.findIndex((last) => x1 > last + 3)
    if (lane === -1) lane = 7
    laneEnds[lane] = x2
    const y = top + lane * 27
    context.fillStyle = featureColor(item.feature_type)
    context.fillRect(x1, y, Math.max(2, x2 - x1), 12)
    if (item.name && x2 - x1 > 45) {
      context.fillStyle = '#334155'
      context.fillText(
        item.name.slice(0, 15),
        x1 + 2,
        y + 24,
        Math.max(0, x2 - x1),
      )
    }
  }
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
  const [loading, setLoading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [canvasWidth, setCanvasWidth] = useState(700)
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
    setLoading(true)
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
        if (!data.supported) {
          setError(data.reason ?? t('unsupported'))
          setLoading(false)
          return
        }
        if (!viewRef.current && data.default_chromosome) {
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
        setLoading(false)
      })
      .catch((cause) => {
        if (controller.signal.aborted && !timedOut) return
        setError(errorMessage(cause, timedOut, t('timeout')))
        setLoading(false)
      })
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [active, runUid, generation, path, searchTerm, t])

  useEffect(() => {
    if (!active || !view || !meta) return
    const key = `${generation}:${path}:${view.chrom}:${view.start}:${view.end}`
    const cached = cache.current.get(key)
    if (cached) {
      setRegion(cached)
      setError('')
      setLoading(false)
      return
    }
    const controller = new AbortController()
    let timedOut = false
    const timer = window.setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 2500)
    setRegion(null)
    setLoading(true)
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
        setLoading(false)
      })
      .catch((cause) => {
        if (controller.signal.aborted && !timedOut) return
        setError(errorMessage(cause, timedOut, t('timeout')))
        setLoading(false)
      })
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [active, runUid, generation, path, view, meta, t])

  useEffect(() => {
    if (!wrapperRef.current) return
    const observer = new ResizeObserver((entries) =>
      setCanvasWidth(Math.max(320, entries[0].contentRect.width)),
    )
    observer.observe(wrapperRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (region && canvasRef.current)
      drawTrack(canvasRef.current, region, canvasWidth)
  }, [region, canvasWidth])

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
  const maxSpan = isSignalKind(meta?.kind) ? 10_000_000 : 1_000_000
  const applyLocus = () => {
    const parsed = parseLocus(locus)
    if (!parsed || parsed.end - parsed.start > maxSpan) {
      setError(t('invalidLocus'))
      setRegion(null)
      return
    }
    setView(parsed)
    setError('')
  }
  const zoom = (factor: number) => {
    if (!view) return
    const length =
      meta?.chromosomes.find((item) => item.name === view.chrom)?.length ??
      Number.MAX_SAFE_INTEGER
    const span = Math.min(
      maxSpan,
      length,
      Math.max(1, Math.round((view.end - view.start) * factor)),
    )
    const midpoint = Math.floor((view.start + view.end) / 2)
    const start = Math.max(
      0,
      Math.min(length - span, midpoint - Math.floor(span / 2)),
    )
    const next = { ...view, start, end: start + span }
    setView(next)
    setLocus(formatLocus(next))
  }

  return (
    <div className='h-full overflow-auto p-4 space-y-3 text-sm'>
      <div className='flex flex-wrap items-center gap-2'>
        <input
          aria-label={t('searchChrom')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('searchChrom')}
          className='h-8 w-32 rounded border bg-background px-2'
        />
        <select
          aria-label={t('chromosome')}
          value={view?.chrom ?? ''}
          onChange={(event) => {
            const chromosome = meta?.chromosomes.find(
              (item) => item.name === event.target.value,
            )
            if (!chromosome) return
            const next = {
              chrom: chromosome.name,
              start: 0,
              end: Math.min(
                chromosome.length,
                isSignalKind(meta?.kind) ? 100000 : 10000,
              ),
            }
            setView(next)
            setLocus(formatLocus(next))
          }}
          className='h-8 max-w-40 rounded border bg-background px-2'
        >
          {view &&
            !meta?.chromosomes.some((item) => item.name === view.chrom) && (
              <option value={view.chrom}>{view.chrom}</option>
            )}
          {!view && <option value=''>{t('chromosome')}</option>}
          {meta?.chromosomes.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            applyLocus()
          }}
          className='flex gap-1'
        >
          <input
            aria-label={t('locus')}
            value={locus}
            onChange={(event) => setLocus(event.target.value)}
            placeholder='chr1:1-1000'
            className='h-8 w-52 rounded border bg-background px-2 font-mono'
          />
          <button
            type='submit'
            className='h-8 rounded border px-3 hover:bg-muted'
          >
            {t('show')}
          </button>
        </form>
        <button
          type='button'
          onClick={() => zoom(0.5)}
          disabled={!view}
          className='h-8 rounded border px-3 hover:bg-muted disabled:opacity-50'
        >
          {t('zoomIn')}
        </button>
        <button
          type='button'
          onClick={() => zoom(2)}
          disabled={!view}
          className='h-8 rounded border px-3 hover:bg-muted disabled:opacity-50'
        >
          {t('zoomOut')}
        </button>
      </div>
      <p className='text-xs text-muted-foreground'>{t('coordinates')}</p>
      {error && (
        <p
          role='alert'
          className='rounded border border-destructive/40 p-3 text-destructive'
        >
          {error}
        </p>
      )}
      {loading && <p className='text-muted-foreground'>{t('loading')}</p>}
      {meta?.supported && !meta.default_chromosome && <p>{t('emptyFile')}</p>}
      {meta?.has_more_chromosomes && (
        <p className='text-xs text-muted-foreground'>{t('searchHint')}</p>
      )}
      <div
        ref={wrapperRef}
        className='min-w-[320px] max-w-full overflow-x-auto rounded border bg-background p-2'
      >
        {region ? (
          <canvas ref={canvasRef} aria-label={t('track')} />
        ) : (
          !loading &&
          !error && (
            <p className='p-4 text-muted-foreground'>{t('emptyRegion')}</p>
          )
        )}
      </div>
      {emptyRegion && (
        <p className='text-muted-foreground'>{t('emptyRegion')}</p>
      )}
      {region?.kind === 'intervals' && (
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
          <span>{t('featureCount', { count: region.items.length })}</span>
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
      )}
    </div>
  )
}
