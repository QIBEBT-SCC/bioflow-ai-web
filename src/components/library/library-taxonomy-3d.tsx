'use client'

import { ArrowUpRightIcon } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  LibraryTaxonomy,
  TaxonomyGroupItem,
  TaxonomyTagItem,
} from '@/app/actions/library'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type AtlasSelection =
  | { kind: 'group'; id: number }
  | { kind: 'tag'; id: number }

interface Vec3 {
  x: number
  y: number
  z: number
}

interface AtlasNode {
  key: string
  kind: 'group' | 'tag'
  id: number
  label: string
  count: number
  baseRadius: number
  pos: Vec3
}

interface ProjectedNode extends AtlasNode {
  rx: number
  ry: number
  rz: number
  sx: number
  sy: number
  sr: number
  scale: number
}

interface ThemeRgb {
  primary: [number, number, number]
  accent2: [number, number, number]
  foreground: [number, number, number]
  muted: [number, number, number]
  border: [number, number, number]
}

function resolveCssColorRgb(
  probeCtx: CanvasRenderingContext2D,
  varName: string,
  fallback: [number, number, number],
): [number, number, number] {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()
  if (!raw) return fallback
  probeCtx.clearRect(0, 0, 1, 1)
  probeCtx.fillStyle = raw
  probeCtx.fillRect(0, 0, 1, 1)
  const data = probeCtx.getImageData(0, 0, 1, 1).data
  return [data[0], data[1], data[2]]
}

function readThemePalette(): ThemeRgb {
  const offscreen = document.createElement('canvas')
  offscreen.width = 1
  offscreen.height = 1
  const ctx = offscreen.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    return {
      primary: [23, 91, 151],
      accent2: [52, 160, 145],
      foreground: [34, 41, 54],
      muted: [110, 120, 138],
      border: [215, 222, 232],
    }
  }
  return {
    primary: resolveCssColorRgb(ctx, '--primary', [23, 91, 151]),
    accent2: resolveCssColorRgb(ctx, '--chart-2', [52, 160, 145]),
    foreground: resolveCssColorRgb(ctx, '--foreground', [34, 41, 54]),
    muted: resolveCssColorRgb(ctx, '--muted-foreground', [110, 120, 138]),
    border: resolveCssColorRgb(ctx, '--border', [215, 222, 232]),
  }
}

function rgba(rgb: [number, number, number], alpha: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}

function fibonacciSpherePoints(
  count: number,
  radius: number,
  phaseOffset = 0,
): Vec3[] {
  if (count <= 0) return []
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  return Array.from({ length: count }, (_, i) => {
    const y = count === 1 ? 0 : 1 - (i / (count - 1)) * 2
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = goldenAngle * i + phaseOffset
    return {
      x: Math.cos(theta) * ringRadius * radius,
      y: y * radius,
      z: Math.sin(theta) * ringRadius * radius,
    }
  })
}

function rotatePoint(p: Vec3, yaw: number, pitch: number): Vec3 {
  const cosY = Math.cos(yaw)
  const sinY = Math.sin(yaw)
  const x1 = p.x * cosY + p.z * sinY
  const z1 = -p.x * sinY + p.z * cosY

  const cosP = Math.cos(pitch)
  const sinP = Math.sin(pitch)
  const y2 = p.y * cosP - z1 * sinP
  const z2 = p.y * sinP + z1 * cosP
  return { x: x1, y: y2, z: z2 }
}

export function LibraryTaxonomy3D({ taxonomy }: { taxonomy: LibraryTaxonomy }) {
  const t = useTranslations('Library.atlas')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [selection, setSelection] = useState<AtlasSelection | null>(null)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  const stateRef = useRef({
    yaw: 0.45,
    pitch: 0.24,
    velYaw: 0,
    velPitch: 0,
    isDragging: false,
    dragMoved: false,
    lastX: 0,
    lastY: 0,
    pointerX: -9999,
    pointerY: -9999,
    activeKey: null as string | null,
    projected: [] as ProjectedNode[],
  })

  const { nodes, groupMap, tagMap, neighborsByKey, maxWeight, topTagIds } =
    useMemo(() => {
      const gPoints = fibonacciSpherePoints(taxonomy.groups.length, 118, 0.2)
      const tPoints = fibonacciSpherePoints(taxonomy.tags.length, 196, 1.35)

      const maxGroupCount = Math.max(
        1,
        ...taxonomy.groups.map((g) => g.tool_count),
      )
      const maxTagCount = Math.max(1, ...taxonomy.tags.map((g) => g.tool_count))

      const builtNodes: AtlasNode[] = [
        ...taxonomy.groups.map((g, idx) => ({
          key: `group-${g.id}`,
          kind: 'group' as const,
          id: g.id,
          label: g.name,
          count: g.tool_count,
          baseRadius: 7.5 + Math.sqrt(g.tool_count / maxGroupCount) * 12,
          pos: gPoints[idx] ?? { x: 0, y: 0, z: 0 },
        })),
        ...taxonomy.tags.map((tag, idx) => ({
          key: `tag-${tag.id}`,
          kind: 'tag' as const,
          id: tag.id,
          label: tag.name,
          count: tag.tool_count,
          baseRadius: 4 + Math.sqrt(tag.tool_count / maxTagCount) * 6.5,
          pos: tPoints[idx] ?? { x: 0, y: 0, z: 0 },
        })),
      ]

      const gMap = new Map<number, TaxonomyGroupItem>(
        taxonomy.groups.map((g) => [g.id, g]),
      )
      const tMap = new Map<number, TaxonomyTagItem>(
        taxonomy.tags.map((tag) => [tag.id, tag]),
      )
      const adj = new Map<string, Set<string>>()
      let maxW = 1

      for (const link of taxonomy.links) {
        if (link.weight > maxW) maxW = link.weight
        const gk = `group-${link.group_id}`
        const tk = `tag-${link.tag_id}`
        if (!adj.has(gk)) adj.set(gk, new Set())
        if (!adj.has(tk)) adj.set(tk, new Set())
        adj.get(gk)?.add(tk)
        adj.get(tk)?.add(gk)
      }

      const topTags = new Set(taxonomy.tags.slice(0, 14).map((tag) => tag.id))

      return {
        nodes: builtNodes,
        groupMap: gMap,
        tagMap: tMap,
        neighborsByKey: adj,
        maxWeight: maxW,
        topTagIds: topTags,
      }
    }, [taxonomy])

  const selectedKey = selection ? `${selection.kind}-${selection.id}` : null
  const activeKey = hoveredKey ?? selectedKey

  useEffect(() => {
    stateRef.current.activeKey = activeKey
  }, [activeKey])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let palette = readThemePalette()
    const observer = new MutationObserver(() => {
      palette = readThemePalette()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-accent', 'class'],
    })

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    let animId = 0
    let width = 0
    let height = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      const st = stateRef.current
      if (!st.isDragging) {
        if (!reducedMotion && !st.activeKey) {
          st.yaw += 0.0024
        }
        st.yaw += st.velYaw
        st.pitch += st.velPitch
        st.velYaw *= 0.92
        st.velPitch *= 0.92
        st.pitch = Math.max(-1.25, Math.min(1.25, st.pitch))
      }

      ctx.clearRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2
      const baseDim = Math.min(width, height)
      const focal = 560
      const viewScale = baseDim / 500

      // Subtle radial core aura
      const coreGlow = ctx.createRadialGradient(
        cx,
        cy,
        4,
        cx,
        cy,
        140 * viewScale,
      )
      coreGlow.addColorStop(0, rgba(palette.primary, 0.14))
      coreGlow.addColorStop(0.55, rgba(palette.accent2, 0.05))
      coreGlow.addColorStop(1, rgba(palette.primary, 0))
      ctx.fillStyle = coreGlow
      ctx.beginPath()
      ctx.arc(cx, cy, 140 * viewScale, 0, Math.PI * 2)
      ctx.fill()

      // Draw 3D orbital reference rings for spatial clarity
      for (const ringRadius of [118, 196]) {
        ctx.beginPath()
        const steps = 64
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * Math.PI * 2
          const rp = rotatePoint(
            {
              x: Math.cos(angle) * ringRadius,
              y: 0,
              z: Math.sin(angle) * ringRadius,
            },
            st.yaw,
            st.pitch,
          )
          const pScale = (focal / (focal + rp.z)) * viewScale
          const px = cx + rp.x * pScale
          const py = cy + rp.y * pScale
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.strokeStyle = rgba(palette.border, 0.45)
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Project all nodes into 3D screen space
      const projectedMap = new Map<string, ProjectedNode>()
      const projectedList: ProjectedNode[] = nodes.map((node) => {
        const rot = rotatePoint(node.pos, st.yaw, st.pitch)
        const pScale = (focal / (focal + rot.z)) * viewScale
        const item: ProjectedNode = {
          ...node,
          rx: rot.x,
          ry: rot.y,
          rz: rot.z,
          sx: cx + rot.x * pScale,
          sy: cy + rot.y * pScale,
          sr: Math.max(2.5, node.baseRadius * pScale),
          scale: pScale,
        }
        projectedMap.set(node.key, item)
        return item
      })

      st.projected = projectedList

      // Hit-test pointer hover
      if (!st.isDragging && st.pointerX > -9000) {
        let hit: ProjectedNode | null = null
        let bestZ = Number.POSITIVE_INFINITY
        for (const p of projectedList) {
          const dx = st.pointerX - p.sx
          const dy = st.pointerY - p.sy
          const hitRadius = p.sr + 6
          if (dx * dx + dy * dy <= hitRadius * hitRadius && p.rz < bestZ) {
            bestZ = p.rz
            hit = p
          }
        }
        const nextHover = hit ? hit.key : null
        setHoveredKey((prev) => (prev === nextHover ? prev : nextHover))
        canvas.style.cursor = hit ? 'pointer' : 'grab'
      }

      const active = st.activeKey
      const activeNeighbors = active ? neighborsByKey.get(active) : undefined

      // Core-to-group spokes
      for (const p of projectedList) {
        if (p.kind !== 'group') continue
        const isHighlighted = active === p.key || activeNeighbors?.has(p.key)
        const alpha = active ? (isHighlighted ? 0.42 : 0.04) : 0.11
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(p.sx, p.sy)
        ctx.strokeStyle = rgba(palette.primary, alpha)
        ctx.lineWidth = isHighlighted ? 1.4 : 0.8
        ctx.stroke()
      }

      // Group-to-tag co-occurrence filaments
      for (const link of taxonomy.links) {
        const gk = `group-${link.group_id}`
        const tk = `tag-${link.tag_id}`
        const gp = projectedMap.get(gk)
        const tp = projectedMap.get(tk)
        if (!gp || !tp) continue

        const touchesActive = active === gk || active === tk
        if (active && !touchesActive) continue

        const weightNorm = link.weight / maxWeight
        const depthAlpha = Math.max(0.25, 1 - (gp.rz + tp.rz + 400) / 900)
        const alpha = touchesActive
          ? 0.35 + 0.55 * weightNorm
          : (0.05 + 0.14 * weightNorm) * depthAlpha

        ctx.beginPath()
        ctx.moveTo(gp.sx, gp.sy)
        ctx.lineTo(tp.sx, tp.sy)
        ctx.strokeStyle = rgba(
          touchesActive ? palette.accent2 : palette.primary,
          alpha,
        )
        ctx.lineWidth = touchesActive ? 1.2 + weightNorm * 1.8 : 0.8
        ctx.stroke()
      }

      // Draw central BioFlow Core orb
      ctx.beginPath()
      ctx.arc(cx, cy, 8 * viewScale, 0, Math.PI * 2)
      ctx.fillStyle = rgba(palette.primary, 0.9)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx, cy, 13 * viewScale, 0, Math.PI * 2)
      ctx.strokeStyle = rgba(palette.primary, 0.25)
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Painter's algorithm: farthest nodes first
      const sorted = [...projectedList].sort((a, b) => b.rz - a.rz)

      for (const p of sorted) {
        const isActive = active === p.key
        const isNeighbor = Boolean(active && activeNeighbors?.has(p.key))
        const dimmed = Boolean(active && !isActive && !isNeighbor)

        const depthFactor = Math.max(0.35, Math.min(1, 1 - (p.rz + 180) / 560))
        const baseColor = p.kind === 'group' ? palette.primary : palette.accent2
        const nodeAlpha = dimmed ? 0.16 : 0.45 + 0.55 * depthFactor

        // Halo for active / neighbor nodes
        if (isActive || isNeighbor) {
          const halo = ctx.createRadialGradient(
            p.sx,
            p.sy,
            p.sr * 0.4,
            p.sx,
            p.sy,
            p.sr * 2.4,
          )
          halo.addColorStop(0, rgba(baseColor, isActive ? 0.42 : 0.22))
          halo.addColorStop(1, rgba(baseColor, 0))
          ctx.fillStyle = halo
          ctx.beginPath()
          ctx.arc(p.sx, p.sy, p.sr * 2.4, 0, Math.PI * 2)
          ctx.fill()
        }

        // 3D shaded orb
        const orb = ctx.createRadialGradient(
          p.sx - p.sr * 0.32,
          p.sy - p.sr * 0.32,
          p.sr * 0.12,
          p.sx,
          p.sy,
          p.sr,
        )
        orb.addColorStop(0, `rgba(255, 255, 255, ${dimmed ? 0.2 : 0.82})`)
        orb.addColorStop(0.45, rgba(baseColor, nodeAlpha))
        orb.addColorStop(1, rgba(baseColor, Math.min(1, nodeAlpha + 0.1)))

        ctx.beginPath()
        ctx.arc(p.sx, p.sy, p.sr, 0, Math.PI * 2)
        ctx.fillStyle = orb
        ctx.fill()

        if (isActive) {
          ctx.beginPath()
          ctx.arc(p.sx, p.sy, p.sr + 2.5, 0, Math.PI * 2)
          ctx.strokeStyle = rgba(baseColor, 0.85)
          ctx.lineWidth = 1.5
          ctx.stroke()
        }

        // Labels: always show groups when front-ish or highlighted; show prominent/active tags
        const showLabel =
          isActive ||
          isNeighbor ||
          (!dimmed &&
            (p.kind === 'group' ? p.rz < 78 : topTagIds.has(p.id) && p.rz < 15))

        if (showLabel) {
          const fontSize =
            p.kind === 'group'
              ? isActive
                ? 12.5
                : 11.5
              : isActive
                ? 11.5
                : 10.5
          ctx.font = `${isActive || p.kind === 'group' ? 600 : 500} ${fontSize}px var(--font-geist-sans), sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          const labelAlpha =
            isActive || isNeighbor ? 0.98 : 0.55 + depthFactor * 0.4
          ctx.fillStyle = rgba(
            p.kind === 'group' ? palette.foreground : palette.muted,
            labelAlpha,
          )
          ctx.fillText(p.label, p.sx, p.sy + p.sr + 4)
        }
      }

      animId = requestAnimationFrame(draw)
    }

    resize()
    animId = requestAnimationFrame(draw)
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
      observer.disconnect()
    }
  }, [neighborsByKey, nodes, maxWeight, taxonomy.links, topTagIds])

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const st = stateRef.current
    st.isDragging = true
    st.dragMoved = false
    st.lastX = e.clientX - rect.left
    st.lastY = e.clientY - rect.top
    st.velYaw = 0
    st.velPitch = 0
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.style.cursor = 'grabbing'
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const st = stateRef.current
    st.pointerX = x
    st.pointerY = y

    if (!st.isDragging) return
    const dx = x - st.lastX
    const dy = y - st.lastY
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      st.dragMoved = true
    }
    st.yaw += dx * 0.0075
    st.pitch = Math.max(-1.25, Math.min(1.25, st.pitch + dy * 0.0075))
    st.velYaw = dx * 0.004
    st.velPitch = dy * 0.004
    st.lastX = x
    st.lastY = y
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = stateRef.current
    if (!st.dragMoved) {
      const rect = e.currentTarget.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      let hit: ProjectedNode | null = null
      let bestZ = Number.POSITIVE_INFINITY
      for (const p of st.projected) {
        const dx = px - p.sx
        const dy = py - p.sy
        const hitRadius = p.sr + 6
        if (dx * dx + dy * dy <= hitRadius * hitRadius && p.rz < bestZ) {
          bestZ = p.rz
          hit = p
        }
      }
      if (hit) {
        const clicked: AtlasSelection = { kind: hit.kind, id: hit.id }
        setSelection((prev) =>
          prev && prev.kind === clicked.kind && prev.id === clicked.id
            ? null
            : clicked,
        )
      } else {
        setSelection(null)
      }
    }
    st.isDragging = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    e.currentTarget.style.cursor = 'grab'
  }

  const handlePointerLeave = () => {
    stateRef.current.pointerX = -9999
    stateRef.current.pointerY = -9999
    setHoveredKey(null)
  }

  // Derive active node detail for HUD
  const activeDetail = useMemo(() => {
    const target = hoveredKey
      ? hoveredKey.startsWith('group-')
        ? ({ kind: 'group', id: Number(hoveredKey.slice(6)) } as const)
        : ({ kind: 'tag', id: Number(hoveredKey.slice(4)) } as const)
      : selection
    if (!target) return null

    if (target.kind === 'group') {
      const group = groupMap.get(target.id)
      if (!group) return null
      const relatedTags = taxonomy.links
        .filter((l) => l.group_id === group.id)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 6)
        .map((l) => ({
          id: l.tag_id,
          name: tagMap.get(l.tag_id)?.name ?? '',
          weight: l.weight,
        }))
        .filter((item) => item.name)
      return {
        kind: 'group' as const,
        id: group.id,
        name: group.name,
        count: group.tool_count,
        neighbors: relatedTags,
      }
    }

    const tag = tagMap.get(target.id)
    if (!tag) return null
    const relatedGroups = taxonomy.links
      .filter((l) => l.tag_id === tag.id)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 6)
      .map((l) => ({
        id: l.group_id,
        name: groupMap.get(l.group_id)?.name ?? '',
        weight: l.weight,
      }))
      .filter((item) => item.name)
    return {
      kind: 'tag' as const,
      id: tag.id,
      name: tag.name,
      count: tag.tool_count,
      neighbors: relatedGroups,
    }
  }, [groupMap, hoveredKey, selection, tagMap, taxonomy.links])

  return (
    <div className='relative h-[430px] w-full overflow-hidden rounded-xl border bg-muted/20 select-none'>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className='size-full touch-none'
      />

      {/* Floating detail HUD only when hovering or selecting a node */}
      {activeDetail && (
        <div className='pointer-events-none absolute right-3 bottom-3 left-3 flex items-end justify-between gap-3'>
          <div className='pointer-events-auto max-w-md rounded-xl border bg-card/92 p-3.5 shadow-md backdrop-blur-sm'>
            <div className='flex items-center justify-between gap-3'>
              <div className='flex min-w-0 items-center gap-2'>
                <Badge
                  variant='outline'
                  className={
                    activeDetail.kind === 'group'
                      ? 'border-primary/30 bg-primary/10 text-primary text-[11px]'
                      : 'border-chart-2/30 bg-chart-2/10 text-foreground text-[11px]'
                  }
                >
                  {activeDetail.kind === 'group'
                    ? t('kindGroup')
                    : t('kindTag')}
                </Badge>
                <span className='truncate text-sm font-semibold'>
                  {activeDetail.name}
                </span>
              </div>
              <Badge variant='secondary' className='shrink-0 tabular-nums'>
                {t('toolCount', { count: activeDetail.count })}
              </Badge>
            </div>

            {activeDetail.neighbors.length > 0 && (
              <div className='mt-2.5 flex flex-wrap items-center gap-1.5'>
                <span className='text-[11px] text-muted-foreground'>
                  {activeDetail.kind === 'group'
                    ? t('connectedTags')
                    : t('connectedGroups')}
                </span>
                {activeDetail.neighbors.map((n) => (
                  <button
                    key={n.id}
                    type='button'
                    onClick={() =>
                      setSelection({
                        kind: activeDetail.kind === 'group' ? 'tag' : 'group',
                        id: n.id,
                      })
                    }
                    className='inline-flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-[11px] transition-colors hover:border-primary/40 hover:text-primary'
                  >
                    <span>{n.name}</span>
                    <span className='font-mono text-[10px] text-muted-foreground tabular-nums'>
                      {n.weight}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeDetail.kind === 'group' && (
              <div className='mt-2.5 flex justify-end'>
                <Button variant='link' size='xs' className='h-auto p-0' asChild>
                  <Link href={`/tool?group=${activeDetail.id}`}>
                    {t('openGroupTools')}
                    <ArrowUpRightIcon className='size-3.5' />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
