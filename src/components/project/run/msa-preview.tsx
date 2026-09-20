'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  buildMsaConsensus,
  type MsaAlignment,
  type MsaAlphabet,
  type MsaErrorCode,
  MsaParseError,
  type MsaSequence,
  parseMsa,
} from '@/components/project/run/msa'

const LABEL_WIDTH = 220
const RULER_HEIGHT = 34
const ROW_HEIGHT = 22
const MIN_CELL_WIDTH = 8
const MAX_CELL_WIDTH = 24

const ERROR_KEYS: Record<MsaErrorCode, string> = {
  duplicateName: 'duplicateName',
  empty: 'empty',
  inconsistentLength: 'inconsistentLength',
  invalidPhylip: 'invalidPhylip',
  invalidSequence: 'invalidSequence',
  phylipCount: 'phylipCount',
  tooFewSequences: 'tooFewSequences',
  tooManyCells: 'tooManyCells',
  tooManyColumns: 'tooManyColumns',
  tooManySequences: 'tooManySequences',
  unsupportedFormat: 'unsupportedFormat',
}

const NUCLEOTIDE_COLORS: Record<string, string> = {
  A: '#86efac',
  C: '#93c5fd',
  G: '#fde047',
  T: '#fca5a5',
  U: '#fca5a5',
}

function residueColor(residue: string, alphabet: MsaAlphabet): string {
  if (residue === '-') return '#e2e8f0'
  if (alphabet === 'nucleotide') return NUCLEOTIDE_COLORS[residue] ?? '#d8b4fe'
  if ('AVLIMFWY'.includes(residue)) return '#bbf7d0'
  if ('DE'.includes(residue)) return '#fecaca'
  if ('KRH'.includes(residue)) return '#bfdbfe'
  if ('STNQ'.includes(residue)) return '#fde68a'
  if ('CGP'.includes(residue)) return '#ddd6fe'
  return '#e2e8f0'
}

function parseResult(
  content: string,
):
  | { alignment: MsaAlignment; error: null }
  | { alignment: null; error: unknown } {
  try {
    return { alignment: parseMsa(content), error: null }
  } catch (error) {
    return { alignment: null, error }
  }
}

function drawAlignment({
  alphabet,
  canvas,
  cellWidth,
  consensusLabel,
  consensus,
  height,
  scrollLeft,
  scrollTop,
  sequences,
  sequenceLabel,
  showConsensus,
  width,
}: {
  alphabet: MsaAlphabet
  canvas: HTMLCanvasElement
  cellWidth: number
  consensusLabel: string
  consensus: string
  height: number
  scrollLeft: number
  scrollTop: number
  sequences: MsaSequence[]
  sequenceLabel: string
  showConsensus: boolean
  width: number
}): void {
  const ratio = Math.min(2, window.devicePixelRatio || 1)
  canvas.width = Math.max(1, Math.round(width * ratio))
  canvas.height = Math.max(1, Math.round(height * ratio))
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const context = canvas.getContext('2d')
  if (!context) return
  context.scale(ratio, ratio)
  context.clearRect(0, 0, width, height)
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace'
  context.textBaseline = 'middle'

  const alignmentLength = sequences[0]?.sequence.length ?? consensus.length
  const firstColumn = Math.max(
    0,
    Math.floor((scrollLeft - LABEL_WIDTH) / cellWidth),
  )
  const lastColumn = Math.min(
    alignmentLength,
    Math.ceil((scrollLeft + width - LABEL_WIDTH) / cellWidth) + 1,
  )
  const rowOffset = showConsensus ? 1 : 0
  const firstRow = Math.max(
    0,
    Math.floor((scrollTop - RULER_HEIGHT) / ROW_HEIGHT),
  )
  const lastRow = Math.min(
    sequences.length + rowOffset,
    Math.ceil((scrollTop + height - RULER_HEIGHT) / ROW_HEIGHT) + 1,
  )

  for (let displayRow = firstRow; displayRow < lastRow; displayRow += 1) {
    const y = RULER_HEIGHT + displayRow * ROW_HEIGHT - scrollTop
    const isConsensus = showConsensus && displayRow === 0
    const sequence = isConsensus
      ? consensus
      : sequences[displayRow - rowOffset]?.sequence
    if (!sequence) continue
    if (displayRow % 2 === 1) {
      context.fillStyle = '#f8fafc'
      context.fillRect(0, y, width, ROW_HEIGHT)
    }
    for (let column = firstColumn; column < lastColumn; column += 1) {
      const residue = sequence[column] ?? ' '
      const x = LABEL_WIDTH + column * cellWidth - scrollLeft
      if (!isConsensus && residue !== ' ') {
        context.fillStyle = residueColor(residue, alphabet)
        context.fillRect(x, y + 1, cellWidth, ROW_HEIGHT - 2)
      }
      if (cellWidth >= 11 && residue !== ' ') {
        context.fillStyle = isConsensus ? '#475569' : '#0f172a'
        context.textAlign = 'center'
        context.fillText(residue, x + cellWidth / 2, y + ROW_HEIGHT / 2)
      }
    }
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, LABEL_WIDTH, height)
  context.strokeStyle = '#cbd5e1'
  context.beginPath()
  context.moveTo(LABEL_WIDTH - 0.5, 0)
  context.lineTo(LABEL_WIDTH - 0.5, height)
  context.stroke()
  context.textAlign = 'left'
  for (let displayRow = firstRow; displayRow < lastRow; displayRow += 1) {
    const y = RULER_HEIGHT + displayRow * ROW_HEIGHT - scrollTop
    const isConsensus = showConsensus && displayRow === 0
    const name = isConsensus
      ? consensusLabel
      : (sequences[displayRow - rowOffset]?.name ?? '')
    context.fillStyle = isConsensus
      ? '#f1f5f9'
      : displayRow % 2 === 1
        ? '#f8fafc'
        : '#ffffff'
    context.fillRect(0, y, LABEL_WIDTH, ROW_HEIGHT)
    context.fillStyle = isConsensus ? '#475569' : '#0f172a'
    context.fillText(name, 10, y + ROW_HEIGHT / 2, LABEL_WIDTH - 20)
  }

  context.fillStyle = '#f8fafc'
  context.fillRect(0, 0, width, RULER_HEIGHT)
  context.strokeStyle = '#cbd5e1'
  context.beginPath()
  context.moveTo(0, RULER_HEIGHT - 0.5)
  context.lineTo(width, RULER_HEIGHT - 0.5)
  context.stroke()
  context.fillStyle = '#475569'
  context.textAlign = 'left'
  context.fillText(sequenceLabel, 10, RULER_HEIGHT / 2)
  context.textAlign = 'center'
  const firstMarker = Math.max(10, Math.ceil((firstColumn + 1) / 10) * 10)
  for (let marker = firstMarker; marker <= lastColumn; marker += 10) {
    const x = LABEL_WIDTH + (marker - 0.5) * cellWidth - scrollLeft
    context.fillText(String(marker), x, RULER_HEIGHT / 2)
  }
}

export function MsaPreview({ content }: { content: string }) {
  const t = useTranslations('Project.runDetail.msaPreview')
  const parsed = useMemo(() => parseResult(content), [content])
  const [search, setSearch] = useState('')
  const [showConsensus, setShowConsensus] = useState(true)
  const [cellWidth, setCellWidth] = useState(13)
  const [viewport, setViewport] = useState({ width: 640, height: 360 })
  const [scroll, setScroll] = useState({ left: 0, top: 0 })
  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const alignment = parsed.alignment
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const sequences = useMemo(
    () =>
      alignment?.sequences.filter(
        (item) =>
          !normalizedSearch ||
          item.name.toLocaleLowerCase().includes(normalizedSearch) ||
          item.description.toLocaleLowerCase().includes(normalizedSearch),
      ) ?? [],
    [alignment, normalizedSearch],
  )
  const consensus = useMemo(
    () => (alignment ? buildMsaConsensus(alignment.sequences) : ''),
    [alignment],
  )

  useEffect(() => {
    const element = viewportRef.current
    if (!element) return
    const resize = () => {
      const bounds = element.getBoundingClientRect()
      setViewport({
        width: Math.max(320, Math.floor(bounds.width)),
        height: Math.max(200, Math.floor(bounds.height)),
      })
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = viewportRef.current
    if (!element || !normalizedSearch) return
    element.scrollTop = 0
    setScroll((value) => ({ ...value, top: 0 }))
  }, [normalizedSearch])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !alignment || !sequences.length) return
    drawAlignment({
      alphabet: alignment.alphabet,
      canvas,
      cellWidth,
      consensusLabel: t('consensus'),
      consensus,
      height: viewport.height,
      scrollLeft: scroll.left,
      scrollTop: scroll.top,
      sequences,
      sequenceLabel: t('sequence'),
      showConsensus,
      width: viewport.width,
    })
  }, [
    alignment,
    cellWidth,
    consensus,
    scroll,
    sequences,
    showConsensus,
    t,
    viewport,
  ])

  if (parsed.error) {
    const code =
      parsed.error instanceof MsaParseError
        ? parsed.error.code
        : 'unsupportedFormat'
    return (
      <div className='h-full overflow-auto p-4'>
        <p
          role='alert'
          className='rounded border border-destructive/40 p-3 text-sm text-destructive'
        >
          {t(`errors.${ERROR_KEYS[code]}`)}
        </p>
      </div>
    )
  }

  if (!alignment) return null
  const totalWidth = LABEL_WIDTH + alignment.length * cellWidth
  const totalRows = sequences.length + (showConsensus ? 1 : 0)
  const totalHeight = RULER_HEIGHT + totalRows * ROW_HEIGHT

  return (
    <div className='flex h-full flex-col overflow-hidden text-sm'>
      <div className='flex flex-wrap items-center gap-2 border-b p-3'>
        <input
          aria-label={t('search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('search')}
          className='h-8 w-52 rounded border bg-background px-2'
        />
        <label className='flex h-8 items-center gap-1.5 rounded border px-2'>
          <input
            type='checkbox'
            checked={showConsensus}
            onChange={(event) => setShowConsensus(event.target.checked)}
          />
          {t('consensus')}
        </label>
        <button
          type='button'
          aria-label={t('zoomOut')}
          title={t('zoomOut')}
          onClick={() =>
            setCellWidth((value) => Math.max(MIN_CELL_WIDTH, value - 2))
          }
          className='size-8 rounded border hover:bg-muted'
        >
          −
        </button>
        <button
          type='button'
          aria-label={t('zoomIn')}
          title={t('zoomIn')}
          onClick={() =>
            setCellWidth((value) => Math.min(MAX_CELL_WIDTH, value + 2))
          }
          className='size-8 rounded border hover:bg-muted'
        >
          +
        </button>
        <span className='text-xs text-muted-foreground'>
          {t('summary', {
            sequences: alignment.sequences.length,
            columns: alignment.length,
            format: t(`formats.${alignment.format}`),
            alphabet: t(`alphabets.${alignment.alphabet}`),
          })}
        </span>
        {normalizedSearch && (
          <span className='text-xs text-muted-foreground'>
            {t('matches', { count: sequences.length })}
          </span>
        )}
      </div>
      {sequences.length ? (
        <div
          ref={viewportRef}
          onScroll={(event) =>
            setScroll({
              left: event.currentTarget.scrollLeft,
              top: event.currentTarget.scrollTop,
            })
          }
          className='relative min-h-0 flex-1 overflow-auto bg-background text-foreground'
        >
          <div style={{ width: totalWidth, height: totalHeight }} />
          <canvas
            ref={canvasRef}
            role='img'
            aria-label={t('graphic')}
            className='pointer-events-none absolute'
            style={{ left: scroll.left, top: scroll.top }}
          />
        </div>
      ) : (
        <div className='flex min-h-0 flex-1 items-center justify-center text-muted-foreground'>
          {t('noMatches')}
        </div>
      )}
      <div className='border-t px-3 py-1.5 text-xs text-muted-foreground'>
        {t('hint')}
      </div>
    </div>
  )
}
