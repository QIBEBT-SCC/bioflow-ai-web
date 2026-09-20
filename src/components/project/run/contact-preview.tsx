'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getRunContactPreviewRegion,
  getRunFilePreviewMeta,
} from '@/app/actions/run'
import { parseLocus } from '@/components/project/run/genome-locus'
import type { ContactRegion, PreviewMeta } from '@/types/run'

type Locus = { chrom: string; start: number; end: number }

function formatLocus(locus: Locus): string {
  return `${locus.chrom}:${(locus.start + 1).toLocaleString('en-US')}-${locus.end.toLocaleString('en-US')}`
}

function drawHeatmap(
  canvas: HTMLCanvasElement,
  region: ContactRegion,
  size: number,
): void {
  const ratio = window.devicePixelRatio || 1
  canvas.width = Math.round(size * ratio)
  canvas.height = Math.round(size * ratio)
  canvas.style.width = `${size}px`
  canvas.style.height = `${size}px`
  const context = canvas.getContext('2d')
  if (!context) return
  context.scale(ratio, ratio)
  context.clearRect(0, 0, size, size)
  const left = 54
  const top = 20
  const extent = size - 84
  const cellWidth = extent / region.width
  const cellHeight = extent / region.height
  const max = Math.max(0, ...region.values)
  const denominator = Math.log1p(max) || 1
  region.values.forEach((value, index) => {
    const x = index % region.width
    const y = Math.floor(index / region.width)
    const strength = Math.log1p(Math.max(0, value)) / denominator
    context.fillStyle =
      value > 0
        ? `hsl(${29 - strength * 25} 95% ${94 - strength * 57}%)`
        : '#f8fafc'
    context.fillRect(
      left + x * cellWidth,
      top + y * cellHeight,
      Math.ceil(cellWidth + 0.3),
      Math.ceil(cellHeight + 0.3),
    )
  })
  context.strokeStyle = '#94a3b8'
  context.strokeRect(left, top, extent, extent)
  context.fillStyle = '#475569'
  context.font = '11px sans-serif'
  context.fillText(
    `${region.chrom}:${(region.start + 1).toLocaleString('en-US')}`,
    left,
    size - 15,
  )
  context.textAlign = 'right'
  context.fillText(region.end.toLocaleString('en-US'), left + extent, size - 15)
  context.save()
  context.translate(13, top + extent)
  context.rotate(-Math.PI / 2)
  context.textAlign = 'left'
  context.fillText(
    `${region.chrom2}:${(region.start2 + 1).toLocaleString('en-US')}`,
    0,
    0,
  )
  context.restore()
}

export function ContactPreview({
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
  const t = useTranslations('Project.runDetail.contactPreview')
  const [meta, setMeta] = useState<PreviewMeta | null>(null)
  const [first, setFirst] = useState<Locus | null>(null)
  const [second, setSecond] = useState<Locus | null>(null)
  const [firstText, setFirstText] = useState('')
  const [secondText, setSecondText] = useState('')
  const [resolution, setResolution] = useState<number | null>(null)
  const [region, setRegion] = useState<ContactRegion | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [size, setSize] = useState(520)
  const [hover, setHover] = useState<string>('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const cache = useRef(new Map<string, ContactRegion>())
  const firstRef = useRef(first)
  firstRef.current = first

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
    getRunFilePreviewMeta(runUid, generation, path, '', controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setMeta(data)
        if (!data.supported) {
          setError(data.reason ?? t('unsupported'))
        } else if (!firstRef.current && data.default_chromosome) {
          const chrom = data.chromosomes.find(
            (item) => item.name === data.default_chromosome,
          )
          const end = Math.min(
            chrom?.length ?? 1,
            10_000_000,
            (data.resolutions?.[0] ?? 10_000) * 32,
          )
          if (end > 0) {
            const initial = { chrom: data.default_chromosome, start: 0, end }
            setFirst(initial)
            setSecond(initial)
            setFirstText(formatLocus(initial))
            setSecondText(formatLocus(initial))
          }
        }
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted && !timedOut) return
        setError(
          timedOut
            ? t('timeout')
            : cause instanceof Error
              ? cause.message
              : String(cause),
        )
        setLoading(false)
      })
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [active, runUid, generation, path, t])

  useEffect(() => {
    if (!active || !meta?.supported || !first || !second) return
    const key = `${generation}:${path}:${first.chrom}:${first.start}:${first.end}:${second.chrom}:${second.start}:${second.end}:${resolution ?? 'auto'}`
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
    getRunContactPreviewRegion(
      runUid,
      generation,
      path,
      first,
      second,
      resolution,
      controller.signal,
    )
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
      .catch((cause: unknown) => {
        if (controller.signal.aborted && !timedOut) return
        setError(
          timedOut
            ? t('timeout')
            : cause instanceof Error
              ? cause.message
              : String(cause),
        )
        setLoading(false)
      })
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [active, runUid, generation, path, meta, first, second, resolution, t])

  useEffect(() => {
    if (!wrapperRef.current) return
    const observer = new ResizeObserver((entries) =>
      setSize(Math.max(320, Math.min(600, entries[0].contentRect.width - 16))),
    )
    observer.observe(wrapperRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (region && canvasRef.current)
      drawHeatmap(canvasRef.current, region, size)
  }, [region, size])

  const submit = () => {
    const nextFirst = parseLocus(firstText)
    const nextSecond = parseLocus(secondText || firstText)
    if (
      !nextFirst ||
      !nextSecond ||
      nextFirst.end - nextFirst.start > 10_000_000 ||
      nextSecond.end - nextSecond.start > 10_000_000
    ) {
      setError(t('invalidLocus'))
      setRegion(null)
      return
    }
    setFirst(nextFirst)
    setSecond(nextSecond)
    setError('')
  }

  const zoom = (factor: number) => {
    if (!first || !second) return
    const next = (locus: Locus): Locus => {
      const length =
        meta?.chromosomes.find((item) => item.name === locus.chrom)?.length ??
        Number.MAX_SAFE_INTEGER
      const span = Math.min(
        length,
        10_000_000,
        Math.max(1, Math.round((locus.end - locus.start) * factor)),
      )
      const midpoint = Math.floor((locus.start + locus.end) / 2)
      const start = Math.max(
        0,
        Math.min(length - span, midpoint - Math.floor(span / 2)),
      )
      return { ...locus, start, end: start + span }
    }
    const newFirst = next(first)
    const newSecond = next(second)
    setFirst(newFirst)
    setSecond(newSecond)
    setFirstText(formatLocus(newFirst))
    setSecondText(formatLocus(newSecond))
  }

  const { positive, maximum } = useMemo(
    () => ({
      positive: region?.values.filter((value) => value > 0).length ?? 0,
      maximum: region ? Math.max(0, ...region.values) : 0,
    }),
    [region],
  )

  return (
    <div className='h-full space-y-3 overflow-auto p-4 text-sm'>
      <form
        className='flex flex-wrap items-end gap-2'
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <label className='flex flex-col gap-1'>
          <span>{t('firstLocus')}</span>
          <input
            aria-label={t('firstLocus')}
            value={firstText}
            onChange={(event) => setFirstText(event.target.value)}
            placeholder='chr1:1-100000'
            className='h-8 w-52 rounded border bg-background px-2 font-mono'
          />
        </label>
        <label className='flex flex-col gap-1'>
          <span>{t('secondLocus')}</span>
          <input
            aria-label={t('secondLocus')}
            value={secondText}
            onChange={(event) => setSecondText(event.target.value)}
            placeholder='chr1:1-100000'
            className='h-8 w-52 rounded border bg-background px-2 font-mono'
          />
        </label>
        <label className='flex flex-col gap-1'>
          <span>{t('resolution')}</span>
          <select
            aria-label={t('resolution')}
            value={resolution ?? ''}
            onChange={(event) =>
              setResolution(
                event.target.value ? Number(event.target.value) : null,
              )
            }
            className='h-8 rounded border bg-background px-2'
          >
            <option value=''>{t('autoResolution')}</option>
            {meta?.resolutions?.map((value) => (
              <option key={value} value={value}>
                {value.toLocaleString('en-US')} bp
              </option>
            ))}
          </select>
        </label>
        <button
          type='submit'
          className='h-8 rounded border px-3 hover:bg-muted'
        >
          {t('show')}
        </button>
        <button
          type='button'
          onClick={() => zoom(0.5)}
          disabled={!first}
          className='h-8 rounded border px-3 hover:bg-muted disabled:opacity-50'
        >
          {t('zoomIn')}
        </button>
        <button
          type='button'
          onClick={() => zoom(2)}
          disabled={!first}
          className='h-8 rounded border px-3 hover:bg-muted disabled:opacity-50'
        >
          {t('zoomOut')}
        </button>
      </form>
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
      {region && (
        <p className='text-xs text-muted-foreground'>
          {t('details', {
            resolution: region.resolution.toLocaleString('en-US'),
            count: positive,
            max: maximum.toLocaleString('en-US'),
          })}
        </p>
      )}
      <div
        ref={wrapperRef}
        className='min-w-[320px] overflow-x-auto rounded border bg-background p-2'
      >
        {region ? (
          <canvas
            ref={canvasRef}
            aria-label={t('heatmap')}
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              const extent = size - 84
              const x = Math.floor(
                ((event.clientX - rect.left - 54) / extent) * region.width,
              )
              const y = Math.floor(
                ((event.clientY - rect.top - 20) / extent) * region.height,
              )
              const nextHover =
                x >= 0 && x < region.width && y >= 0 && y < region.height
                  ? `${region.chrom}:${(Math.floor(region.start / region.resolution) + x) * region.resolution + 1} × ${region.chrom2}:${(Math.floor(region.start2 / region.resolution) + y) * region.resolution + 1} = ${region.values[y * region.width + x].toLocaleString('en-US')}`
                  : ''
              setHover((current) =>
                current === nextHover ? current : nextHover,
              )
            }}
            onMouseLeave={() => setHover('')}
          />
        ) : (
          !loading &&
          !error && (
            <p className='p-4 text-muted-foreground'>{t('emptyRegion')}</p>
          )
        )}
      </div>
      {hover && (
        <p className='font-mono text-xs text-muted-foreground'>{hover}</p>
      )}
      {region && positive === 0 && (
        <p className='text-muted-foreground'>{t('emptyRegion')}</p>
      )}
    </div>
  )
}
