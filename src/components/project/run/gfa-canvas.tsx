'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GfaPath } from '@/components/project/run/gfa'
import type {
  GfaLayout,
  GfaLayoutNode,
} from '@/components/project/run/gfa-layout'

type Transform = { x: number; y: number; scale: number }

type DragState = {
  pointerX: number
  pointerY: number
  originX: number
  originY: number
  moved: boolean
} | null

type DrawOptions = {
  canvas: HTMLCanvasElement
  height: number
  layout: GfaLayout
  matches: Set<string>
  path: GfaPath | null
  selectedName: string | null
  transform: Transform
  width: number
}

const MIN_ZOOM = 0.002
const MAX_ZOOM = 3

function edgeKey(first: string, second: string): string {
  return `${first}\u0000${second}`
}

function pathHighlights(path: GfaPath | null): {
  edges: Set<string>
  segments: Set<string>
} {
  const segments = new Set(path?.steps.map((step) => step.segment) ?? [])
  const edges = new Set<string>()
  if (path) {
    for (let index = 1; index < path.steps.length; index += 1) {
      const first = path.steps[index - 1].segment
      const second = path.steps[index].segment
      edges.add(edgeKey(first, second))
      edges.add(edgeKey(second, first))
    }
  }
  return { edges, segments }
}

function nodeFill(node: GfaLayoutNode, maximumDepth: number): string {
  if (node.segment.depth === null || maximumDepth <= 0) return '#0f766e'
  const intensity = Math.log1p(node.segment.depth) / Math.log1p(maximumDepth)
  return `hsl(174 72% ${42 - intensity * 17}%)`
}

function visibleNode(
  node: GfaLayoutNode,
  transform: Transform,
  width: number,
  height: number,
): boolean {
  const left = -transform.x / transform.scale - node.width
  const right = (width - transform.x) / transform.scale + node.width
  const top = -transform.y / transform.scale - node.height
  const bottom = (height - transform.y) / transform.scale + node.height
  return node.x >= left && node.x <= right && node.y >= top && node.y <= bottom
}

function drawGraph({
  canvas,
  height,
  layout,
  matches,
  path,
  selectedName,
  transform,
  width,
}: DrawOptions): void {
  const ratio = Math.min(2, window.devicePixelRatio || 1)
  canvas.width = Math.max(1, Math.round(width * ratio))
  canvas.height = Math.max(1, Math.round(height * ratio))
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const context = canvas.getContext('2d')
  if (!context) return
  context.scale(ratio, ratio)
  context.fillStyle = '#f8fafc'
  context.fillRect(0, 0, width, height)

  context.strokeStyle = '#e2e8f0'
  context.lineWidth = 1
  const gridSize = 24
  for (let x = transform.x % gridSize; x < width; x += gridSize) {
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, height)
    context.stroke()
  }
  for (let y = transform.y % gridSize; y < height; y += gridSize) {
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(width, y)
    context.stroke()
  }

  context.save()
  context.translate(transform.x, transform.y)
  context.scale(transform.scale, transform.scale)
  const highlights = pathHighlights(path)
  for (const edge of layout.edges) {
    if (edge.points.length < 2) continue
    const highlighted = highlights.edges.has(
      edgeKey(edge.link.from, edge.link.to),
    )
    context.strokeStyle = highlighted ? '#f59e0b' : '#94a3b8'
    context.lineWidth = (highlighted ? 3 : 1.4) / transform.scale
    context.beginPath()
    edge.points.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y)
      else context.lineTo(point.x, point.y)
    })
    context.stroke()
  }

  const maximumDepth = Math.max(
    0,
    ...layout.nodes.map((node) => node.segment.depth ?? 0),
  )
  for (const node of layout.nodes) {
    if (!visibleNode(node, transform, width, height)) continue
    const left = node.x - node.width / 2
    const top = node.y - node.height / 2
    const inPath = highlights.segments.has(node.segment.name)
    const matchesSearch = matches.has(node.segment.name)
    const selected = selectedName === node.segment.name
    context.fillStyle = selected
      ? '#2563eb'
      : matchesSearch
        ? '#9333ea'
        : inPath
          ? '#d97706'
          : nodeFill(node, maximumDepth)
    context.fillRect(left, top, node.width, node.height)
    context.strokeStyle = selected ? '#1e3a8a' : '#ffffff'
    context.lineWidth = (selected ? 3 : 1) / transform.scale
    context.strokeRect(left, top, node.width, node.height)

    if (transform.scale >= 0.42 || selected || matchesSearch) {
      const maximumCharacters = Math.max(4, Math.floor(node.width / 7.2))
      const label =
        node.segment.name.length > maximumCharacters
          ? `${node.segment.name.slice(0, maximumCharacters - 1)}…`
          : node.segment.name
      context.fillStyle = '#ffffff'
      context.font = '600 11px ui-monospace, SFMono-Regular, Menlo, monospace'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(label, node.x, node.y)
    }
  }
  context.restore()
}

function hitNode(
  layout: GfaLayout,
  transform: Transform,
  x: number,
  y: number,
): GfaLayoutNode | null {
  const graphX = (x - transform.x) / transform.scale
  const graphY = (y - transform.y) / transform.scale
  for (let index = layout.nodes.length - 1; index >= 0; index -= 1) {
    const node = layout.nodes[index]
    if (
      Math.abs(graphX - node.x) <= node.width / 2 &&
      Math.abs(graphY - node.y) <= node.height / 2
    )
      return node
  }
  return null
}

export function GfaCanvas({
  ariaLabel,
  fitLabel,
  layout,
  matches,
  onSelectAction,
  path,
  selectedName,
  zoomInLabel,
  zoomOutLabel,
}: {
  ariaLabel: string
  fitLabel: string
  layout: GfaLayout
  matches: Set<string>
  onSelectAction: (name: string | null) => void
  path: GfaPath | null
  selectedName: string | null
  zoomInLabel: string
  zoomOutLabel: string
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<DragState>(null)
  const [viewport, setViewport] = useState({ width: 640, height: 360 })
  const [transform, setTransform] = useState<Transform>({
    x: 0,
    y: 0,
    scale: 1,
  })
  const nodeByName = useMemo(
    () => new Map(layout.nodes.map((node) => [node.segment.name, node])),
    [layout.nodes],
  )

  const fit = useCallback(() => {
    const scale = Math.max(
      MIN_ZOOM,
      Math.min(
        1.2,
        (viewport.width - 48) / layout.width,
        (viewport.height - 48) / layout.height,
      ),
    )
    setTransform({
      scale,
      x: (viewport.width - layout.width * scale) / 2,
      y: (viewport.height - layout.height * scale) / 2,
    })
  }, [layout.height, layout.width, viewport.height, viewport.width])

  useEffect(() => {
    const element = wrapperRef.current
    if (!element) return
    const resize = () => {
      const bounds = element.getBoundingClientRect()
      setViewport({
        width: Math.max(320, Math.floor(bounds.width)),
        height: Math.max(220, Math.floor(bounds.height)),
      })
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => fit(), [fit])

  useEffect(() => {
    if (!selectedName) return
    const node = nodeByName.get(selectedName)
    if (!node) return
    setTransform((current) => ({
      ...current,
      x: viewport.width / 2 - node.x * current.scale,
      y: viewport.height / 2 - node.y * current.scale,
    }))
  }, [nodeByName, selectedName, viewport.height, viewport.width])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawGraph({
      canvas,
      height: viewport.height,
      layout,
      matches,
      path,
      selectedName,
      transform,
      width: viewport.width,
    })
  }, [layout, matches, path, selectedName, transform, viewport])

  const zoom = (factor: number) => {
    setTransform((current) => {
      const scale = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, current.scale * factor),
      )
      const graphX = (viewport.width / 2 - current.x) / current.scale
      const graphY = (viewport.height / 2 - current.y) / current.scale
      return {
        scale,
        x: viewport.width / 2 - graphX * scale,
        y: viewport.height / 2 - graphY * scale,
      }
    })
  }

  return (
    <div ref={wrapperRef} className='relative min-h-0 flex-1 overflow-hidden'>
      <canvas
        ref={canvasRef}
        role='img'
        aria-label={ariaLabel}
        className='size-full touch-none cursor-grab active:cursor-grabbing'
        onWheel={(event) => {
          event.preventDefault()
          const rect = event.currentTarget.getBoundingClientRect()
          const pointerX = event.clientX - rect.left
          const pointerY = event.clientY - rect.top
          setTransform((current) => {
            const factor = Math.exp(-event.deltaY * 0.001)
            const scale = Math.max(
              MIN_ZOOM,
              Math.min(MAX_ZOOM, current.scale * factor),
            )
            const graphX = (pointerX - current.x) / current.scale
            const graphY = (pointerY - current.y) / current.scale
            return {
              scale,
              x: pointerX - graphX * scale,
              y: pointerY - graphY * scale,
            }
          })
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return
          event.currentTarget.setPointerCapture(event.pointerId)
          dragRef.current = {
            pointerX: event.clientX,
            pointerY: event.clientY,
            originX: transform.x,
            originY: transform.y,
            moved: false,
          }
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current
          if (!drag) return
          const deltaX = event.clientX - drag.pointerX
          const deltaY = event.clientY - drag.pointerY
          if (Math.abs(deltaX) + Math.abs(deltaY) > 3) drag.moved = true
          setTransform((current) => ({
            ...current,
            x: drag.originX + deltaX,
            y: drag.originY + deltaY,
          }))
        }}
        onPointerUp={(event) => {
          const drag = dragRef.current
          dragRef.current = null
          event.currentTarget.releasePointerCapture(event.pointerId)
          if (drag?.moved) return
          const rect = event.currentTarget.getBoundingClientRect()
          const node = hitNode(
            layout,
            transform,
            event.clientX - rect.left,
            event.clientY - rect.top,
          )
          onSelectAction(node?.segment.name ?? null)
        }}
      />
      <div className='absolute right-3 bottom-3 flex overflow-hidden rounded border bg-background shadow-sm'>
        <button
          type='button'
          onClick={() => zoom(1.25)}
          aria-label={zoomInLabel}
          className='size-8 border-r hover:bg-muted'
        >
          +
        </button>
        <button
          type='button'
          onClick={() => zoom(0.8)}
          aria-label={zoomOutLabel}
          className='size-8 border-r hover:bg-muted'
        >
          −
        </button>
        <button
          type='button'
          onClick={fit}
          aria-label={fitLabel}
          className='h-8 px-2 text-xs hover:bg-muted'
        >
          {fitLabel}
        </button>
      </div>
    </div>
  )
}
