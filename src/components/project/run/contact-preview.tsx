'use client'

import { AlertCircle, CornerDownLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getRunContactPreviewRegion,
  getRunFilePreviewMeta,
} from '@/app/actions/run'
import { parseLocus } from '@/components/project/run/genome-locus'
import {
  formatBasePairs,
  PreviewEmpty,
  PreviewError,
  PreviewFooter,
  PreviewHint,
  PreviewHoverCard,
  PreviewLoading,
  PreviewProgress,
  PreviewStat,
  PreviewToolbar,
  readCssColor,
  ZoomControls,
} from '@/components/project/run/preview-chrome'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { ContactRegion, PreviewMeta } from '@/types/run'

type Locus = { chrom: string; start: number; end: number }
type Hover = {
  x: number
  y: number
  first: string
  second: string
  value: number
}

const MARGIN_LEFT = 54
const MARGIN_TOP = 12
const AUTO_RESOLUTION = 'auto'

function formatLocus(locus: Locus): string {
  return `${locus.chrom}:${(locus.start + 1).toLocaleString('en-US')}-${locus.end.toLocaleString('en-US')}`
}

/** Sequential warm colormap on log(1 + count); data colors, not tokens. */
function heatColor(strength: number): string {
  return `hsl(${29 - strength * 25} 95% ${94 - strength * 57}%)`
}

const LEGEND_GRADIENT = `linear-gradient(to top, ${[0, 0.25, 0.5, 0.75, 1]
  .map(heatColor)
  .join(', ')})`

function extentFor(size: number): number {
  return size - MARGIN_LEFT - 8
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
  const muted = readCssColor(canvas, '--muted-foreground', '#64748b')
  const border = readCssColor(canvas, '--border', '#e2e8f0')
  const empty = readCssColor(canvas, '--muted', '#f8fafc')
  context.scale(ratio, ratio)
  context.clearRect(0, 0, size, size)
  const extent = extentFor(size)
  const cellWidth = extent / region.width
  const cellHeight = extent / region.height
  const max = Math.max(0, ...region.values)
  const denominator = Math.log1p(max) || 1
  region.values.forEach((value, index) => {
    const x = index % region.width
    const y = Math.floor(index / region.width)
    const strength = Math.log1p(Math.max(0, value)) / denominator
    context.fillStyle = value > 0 ? heatColor(strength) : empty
    context.fillRect(
      MARGIN_LEFT + x * cellWidth,
      MARGIN_TOP + y * cellHeight,
      Math.ceil(cellWidth + 0.3),
      Math.ceil(cellHeight + 0.3),
    )
  })
  context.strokeStyle = border
  context.strokeRect(MARGIN_LEFT + 0.5, MARGIN_TOP + 0.5, extent, extent)
  context.fillStyle = muted
  context.font = '11px ui-sans-serif, system-ui, sans-serif'
  context.textBaseline = 'top'
  context.fillText(
    `${region.chrom}:${(region.start + 1).toLocaleString('en-US')}`,
    MARGIN_LEFT,
    MARGIN_TOP + extent + 10,
  )
  context.textAlign = 'right'
  context.fillText(
    region.end.toLocaleString('en-US'),
    MARGIN_LEFT + extent,
    MARGIN_TOP + extent + 10,
  )
  context.save()
  context.translate(MARGIN_LEFT - 12, MARGIN_TOP + extent)
  context.rotate(-Math.PI / 2)
  context.textAlign = 'left'
  context.textBaseline = 'bottom'
  context.fillText(
    `${region.chrom2}:${(region.start2 + 1).toLocaleString('en-US')}`,
    0,
    0,
  )
  context.textAlign = 'right'
  context.fillText(region.end2.toLocaleString('en-US'), extent, 0)
  context.restore()
}

function ContactHeatmap({
  region,
  loading,
  positive,
  maximum,
}: {
  region: ContactRegion
  loading: boolean
  positive: number
  maximum: number
}) {
  const t = useTranslations('Project.runDetail.contactPreview')
  const [size, setSize] = useState(520)
  const [hover, setHover] = useState<Hover | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!wrapperRef.current) return
    const observer = new ResizeObserver((entries) => {
      const bounds = entries[0].contentRect
      setSize(
        Math.max(
          280,
          Math.min(720, Math.floor(Math.min(bounds.width, bounds.height))),
        ),
      )
    })
    observer.observe(wrapperRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (canvasRef.current) drawHeatmap(canvasRef.current, region, size)
  }, [region, size])

  const extent = extentFor(size)
  const updateHover = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = event.clientX - rect.left
    const py = event.clientY - rect.top
    const x = Math.floor(((px - MARGIN_LEFT) / extent) * region.width)
    const y = Math.floor(((py - MARGIN_TOP) / extent) * region.height)
    if (x < 0 || x >= region.width || y < 0 || y >= region.height) {
      setHover(null)
      return
    }
    const firstBin =
      (Math.floor(region.start / region.resolution) + x) * region.resolution
    const secondBin =
      (Math.floor(region.start2 / region.resolution) + y) * region.resolution
    setHover({
      x: px,
      y: py,
      first: `${region.chrom}:${(firstBin + 1).toLocaleString('en-US')}`,
      second: `${region.chrom2}:${(secondBin + 1).toLocaleString('en-US')}`,
      value: region.values[y * region.width + x],
    })
  }

  return (
    <div className='flex min-h-0 flex-1 items-start justify-center gap-4'>
      <div
        ref={wrapperRef}
        className='flex h-full max-w-180 min-w-0 flex-1 items-start justify-center'
      >
        <div className='relative' style={{ width: size, height: size }}>
          <canvas
            ref={canvasRef}
            aria-label={t('heatmap')}
            className={cn(
              'block cursor-crosshair transition-opacity',
              loading && 'opacity-60',
            )}
            onMouseMove={updateHover}
            onMouseLeave={() => setHover(null)}
          />
          {positive === 0 && !loading && (
            <div
              className='pointer-events-none absolute flex items-center justify-center'
              style={{
                left: MARGIN_LEFT,
                top: MARGIN_TOP,
                width: extent,
                height: extent,
              }}
            >
              <span className='rounded-md border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm'>
                {t('emptyRegion')}
              </span>
            </div>
          )}
          {hover && (
            <PreviewHoverCard
              x={hover.x}
              y={hover.y}
              bounds={{ width: size, height: size }}
            >
              <div className='font-mono text-muted-foreground'>
                X {hover.first}
              </div>
              <div className='font-mono text-muted-foreground'>
                Y {hover.second}
              </div>
              <div className='mt-0.5 font-medium tabular-nums'>
                {t('contacts', { count: hover.value })}
              </div>
            </PreviewHoverCard>
          )}
        </div>
      </div>
      <figure
        className='flex shrink-0 flex-col items-center gap-1.5 text-xs text-muted-foreground'
        style={{ height: extent, marginTop: MARGIN_TOP }}
      >
        <span className='tabular-nums'>{maximum.toLocaleString('en-US')}</span>
        <div
          className='w-3 flex-1 rounded-sm border'
          style={{ backgroundImage: LEGEND_GRADIENT }}
        />
        <span className='tabular-nums'>0</span>
        <figcaption className='sr-only'>{t('legend')}</figcaption>
      </figure>
    </div>
  )
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
  const [metaLoading, setMetaLoading] = useState(false)
  const [regionLoading, setRegionLoading] = useState(false)
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
    setMetaLoading(true)
    setError('')
    getRunFilePreviewMeta(runUid, generation, path, '', controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setMeta(data)
        if (data.supported && !firstRef.current && data.default_chromosome) {
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
        setMetaLoading(false)
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
        setMetaLoading(false)
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
        setRegionLoading(false)
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
        setRegionLoading(false)
      })
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [active, runUid, generation, path, meta, first, second, resolution, t])

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
      return
    }
    setFirst(nextFirst)
    setSecond(nextSecond)
    setSecondText(formatLocus(nextSecond))
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
  if (!meta.default_chromosome) return <PreviewEmpty title={t('emptyFile')} />

  return (
    <div className='flex size-full min-h-0 flex-col bg-background text-sm'>
      <PreviewToolbar>
        <form
          className='flex flex-wrap items-center gap-2'
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <InputGroup className='h-8 w-64 bg-background'>
            <InputGroupAddon>
              <InputGroupText className='text-xs'>X</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              aria-label={t('firstLocus')}
              title={t('firstLocus')}
              value={firstText}
              onChange={(event) => setFirstText(event.target.value)}
              placeholder='chr1:1-100000'
              className='font-mono text-xs'
            />
          </InputGroup>
          <InputGroup className='h-8 w-64 bg-background'>
            <InputGroupAddon>
              <InputGroupText className='text-xs'>Y</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              aria-label={t('secondLocus')}
              title={t('secondLocus')}
              value={secondText}
              onChange={(event) => setSecondText(event.target.value)}
              placeholder={t('sameAsX')}
              className='font-mono text-xs'
            />
          </InputGroup>
          <Button type='submit' size='sm'>
            {t('show')}
            <CornerDownLeft />
          </Button>
        </form>
        <Select
          value={resolution === null ? AUTO_RESOLUTION : String(resolution)}
          onValueChange={(value) =>
            setResolution(value === AUTO_RESOLUTION ? null : Number(value))
          }
        >
          <SelectTrigger
            size='sm'
            aria-label={t('resolution')}
            className='w-36 bg-background'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AUTO_RESOLUTION}>
              {t('autoResolution')}
            </SelectItem>
            {meta.resolutions?.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {formatBasePairs(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ZoomControls
          onZoomIn={() => zoom(0.5)}
          onZoomOut={() => zoom(2)}
          zoomInLabel={t('zoomIn')}
          zoomOutLabel={t('zoomOut')}
          disabled={!first}
        />
        <PreviewHint>{t('coordinates')}</PreviewHint>
      </PreviewToolbar>

      <div className='relative flex min-h-0 flex-1 flex-col overflow-hidden p-3'>
        <PreviewProgress active={regionLoading || metaLoading} />
        {error && (
          <Alert variant='destructive' className='mb-3 shrink-0'>
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {region ? (
          <ContactHeatmap
            region={region}
            loading={regionLoading}
            positive={positive}
            maximum={maximum}
          />
        ) : (
          !error && (
            <div
              aria-busy='true'
              className='mx-auto aspect-square h-full max-h-130 animate-pulse rounded-xl border bg-muted/40'
            >
              <span className='sr-only'>{t('loading')}</span>
            </div>
          )
        )}
      </div>

      <PreviewFooter>
        {region ? (
          <div className='flex flex-wrap items-center gap-x-4 gap-y-1'>
            <PreviewStat
              label={t('resolution')}
              value={formatBasePairs(region.resolution)}
            />
            <PreviewStat
              label={t('bins')}
              value={`${region.width} × ${region.height}`}
            />
            <PreviewStat
              label={t('nonzero')}
              value={positive.toLocaleString('en-US')}
            />
            <PreviewStat
              label={t('maximum')}
              value={maximum.toLocaleString('en-US')}
            />
          </div>
        ) : (
          <span />
        )}
        <span className='hidden lg:inline'>{t('logScale')}</span>
      </PreviewFooter>
    </div>
  )
}
