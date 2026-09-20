'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  type NewickErrorCode,
  type NewickNode,
  NewickParseError,
  type NewickTree,
  parseNewickTrees,
} from '@/components/project/run/newick'

type LayoutNode = {
  node: NewickNode
  x: number
  y: number
  children: number[]
}

type TreeLayout = {
  width: number
  height: number
  nodes: LayoutNode[]
}

const ERROR_KEYS: Record<NewickErrorCode, string> = {
  empty: 'empty',
  invalidBranchLength: 'invalidBranchLength',
  missingLabel: 'missingLabel',
  missingSemicolon: 'missingSemicolon',
  tooDeep: 'tooDeep',
  tooManyNodes: 'tooManyNodes',
  tooManyTrees: 'tooManyTrees',
  unexpectedToken: 'unexpectedToken',
  unterminatedComment: 'unterminatedComment',
  unterminatedQuote: 'unterminatedQuote',
}

function layoutTree(
  tree: NewickTree,
  useBranchLengths: boolean,
  availableWidth: number,
): TreeLayout {
  const top = 28
  const left = 28
  const rowHeight = 26
  const raw: Array<{
    node: NewickNode
    depth: number
    distance: number
    y: number
    children: number[]
  }> = []
  let leafIndex = 0
  let maxDepth = 0
  let maxDistance = 0
  let maxLabelLength = 0

  const visit = (
    node: NewickNode,
    depth: number,
    distance: number,
  ): { index: number; y: number } => {
    maxDepth = Math.max(maxDepth, depth)
    maxDistance = Math.max(maxDistance, distance)
    maxLabelLength = Math.max(maxLabelLength, node.label.length)
    const index = raw.length
    raw.push({ node, depth, distance, y: 0, children: [] })
    const childIndexes: number[] = []
    const childYs = node.children.map((child) => {
      const nextDistance = distance + Math.max(0, child.length ?? 0)
      const childLayout = visit(child, depth + 1, nextDistance)
      childIndexes.push(childLayout.index)
      return childLayout.y
    })
    const y = childYs.length
      ? childYs.reduce((sum, value) => sum + value, 0) / childYs.length
      : top + leafIndex++ * rowHeight
    raw[index].y = y
    raw[index].children = childIndexes
    return { index, y }
  }

  visit(tree.root, 0, 0)
  const labelWidth = Math.min(520, Math.max(180, maxLabelLength * 7 + 24))
  const plotWidth = Math.max(380, availableWidth - labelWidth - left - 32)
  const scaledByLength = useBranchLengths && maxDistance > 0
  const nodes = raw.map(({ node, depth, distance, y, children }) => ({
    node,
    x:
      left +
      (scaledByLength
        ? distance / maxDistance
        : depth / Math.max(1, maxDepth)) *
        plotWidth,
    y,
    children,
  }))
  return {
    width: left + plotWidth + labelWidth,
    height: Math.max(
      180,
      top * 2 + Math.max(0, tree.leafCount - 1) * rowHeight,
    ),
    nodes,
  }
}

function parseResult(
  content: string,
): { trees: NewickTree[]; error: null } | { trees: null; error: unknown } {
  try {
    return { trees: parseNewickTrees(content), error: null }
  } catch (error) {
    return { trees: null, error }
  }
}

export function NewickPreview({
  content,
  fileName,
}: {
  content: string
  fileName: string
}) {
  const t = useTranslations('Project.runDetail.newickPreview')
  const parsed = useMemo(() => parseResult(content), [content])
  const [selectedTree, setSelectedTree] = useState(0)
  const [search, setSearch] = useState('')
  const [useBranchLengths, setUseBranchLengths] = useState(true)
  const [showInternalLabels, setShowInternalLabels] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [availableWidth, setAvailableWidth] = useState(900)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const trees = parsed.trees
  const treeIndex = trees ? Math.min(selectedTree, trees.length - 1) : 0
  const tree = trees?.[treeIndex]
  const layout = useMemo(
    () =>
      tree
        ? layoutTree(tree, useBranchLengths, availableWidth)
        : { width: 0, height: 0, nodes: [] },
    [tree, useBranchLengths, availableWidth],
  )
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const matches = useMemo(
    () =>
      normalizedSearch
        ? new Set(
            layout.nodes
              .filter(({ node }) =>
                node.label.toLocaleLowerCase().includes(normalizedSearch),
              )
              .map(({ node }) => node.id),
          )
        : new Set<number>(),
    [layout.nodes, normalizedSearch],
  )

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const updateWidth = () =>
      setAvailableWidth(
        Math.max(640, wrapper.getBoundingClientRect().width - 16),
      )
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [])

  const downloadSvg = () => {
    if (!svgRef.current) return
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(layout.width))
    clone.setAttribute('height', String(layout.height))
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
      type: 'image/svg+xml',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${fileName.replace(/\.[^.]+$/, '') || 'tree'}.svg`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (parsed.error) {
    const detail =
      parsed.error instanceof NewickParseError
        ? `${t(`errors.${ERROR_KEYS[parsed.error.code]}`)} ${t('errorPosition', { position: parsed.error.position + 1 })}`
        : t('errors.unexpectedToken')
    return (
      <div className='h-full overflow-auto p-4'>
        <p
          role='alert'
          className='rounded border border-destructive/40 p-3 text-sm text-destructive'
        >
          {detail}
        </p>
      </div>
    )
  }

  if (!tree) return null

  return (
    <div className='flex h-full flex-col overflow-hidden text-sm'>
      <div className='flex flex-wrap items-center gap-2 border-b p-3'>
        {trees && trees.length > 1 && (
          <label className='flex items-center gap-2'>
            <span className='text-muted-foreground'>{t('tree')}</span>
            <select
              aria-label={t('tree')}
              value={treeIndex}
              onChange={(event) => setSelectedTree(Number(event.target.value))}
              className='h-8 max-w-56 rounded border bg-background px-2'
            >
              {trees.map((item, index) => (
                <option key={item.root.id} value={index}>
                  {t('treeOption', {
                    index: index + 1,
                    count: item.leafCount,
                  })}
                </option>
              ))}
            </select>
          </label>
        )}
        <input
          aria-label={t('search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('search')}
          className='h-8 w-48 rounded border bg-background px-2'
        />
        <label className='flex h-8 items-center gap-1.5 rounded border px-2'>
          <input
            type='checkbox'
            checked={useBranchLengths}
            disabled={!tree.hasBranchLengths}
            onChange={(event) => setUseBranchLengths(event.target.checked)}
          />
          {t('branchLengths')}
        </label>
        <label className='flex h-8 items-center gap-1.5 rounded border px-2'>
          <input
            type='checkbox'
            checked={showInternalLabels}
            onChange={(event) => setShowInternalLabels(event.target.checked)}
          />
          {t('internalLabels')}
        </label>
        <button
          type='button'
          onClick={() => setZoom((value) => Math.min(3, value + 0.25))}
          className='h-8 rounded border px-3 hover:bg-muted'
        >
          {t('zoomIn')}
        </button>
        <button
          type='button'
          onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
          className='h-8 rounded border px-3 hover:bg-muted'
        >
          {t('zoomOut')}
        </button>
        <button
          type='button'
          onClick={() => setZoom(1)}
          className='h-8 rounded border px-3 hover:bg-muted'
        >
          {t('resetZoom')}
        </button>
        <button
          type='button'
          onClick={downloadSvg}
          className='h-8 rounded border px-3 hover:bg-muted'
        >
          {t('exportSvg')}
        </button>
      </div>
      <div className='flex flex-wrap gap-x-4 gap-y-1 border-b px-4 py-2 text-xs text-muted-foreground'>
        <span>
          {t('summary', {
            leaves: tree.leafCount,
            nodes: tree.nodeCount,
          })}
        </span>
        {normalizedSearch && (
          <span>{t('matches', { count: matches.size })}</span>
        )}
        <span>{t('rootingNotice')}</span>
      </div>
      <div ref={wrapperRef} className='flex-1 overflow-auto bg-background p-2'>
        <svg
          ref={svgRef}
          role='img'
          aria-label={t('treeGraphic', { fileName })}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width={Math.round(layout.width * zoom)}
          height={Math.round(layout.height * zoom)}
          className='text-foreground'
        >
          <title>{fileName}</title>
          {layout.nodes.map((item) => {
            if (!item.children.length) return null
            const children = item.children.map((index) => layout.nodes[index])
            return (
              <g key={`branches-${item.node.id}`}>
                <line
                  x1={item.x}
                  x2={item.x}
                  y1={Math.min(...children.map((child) => child.y))}
                  y2={Math.max(...children.map((child) => child.y))}
                  className='stroke-muted-foreground/60'
                  stroke='currentColor'
                  strokeOpacity={0.6}
                  vectorEffect='non-scaling-stroke'
                />
                {children.map((child) => (
                  <line
                    key={child.node.id}
                    x1={item.x}
                    x2={child.x}
                    y1={child.y}
                    y2={child.y}
                    className='stroke-muted-foreground/60'
                    stroke='currentColor'
                    strokeOpacity={0.6}
                    vectorEffect='non-scaling-stroke'
                  />
                ))}
              </g>
            )
          })}
          {layout.nodes.map(({ node, x, y }) => {
            const isLeaf = node.children.length === 0
            const showLabel =
              Boolean(node.label) && (isLeaf || showInternalLabels)
            const matched = matches.has(node.id)
            return (
              <g key={node.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={matched ? 4 : isLeaf ? 2.5 : 2}
                  fill={matched ? '#f97316' : 'currentColor'}
                  className={matched ? 'fill-orange-500' : 'fill-primary'}
                >
                  {node.label && <title>{node.label}</title>}
                </circle>
                {showLabel && (
                  <text
                    x={x + 7}
                    y={y + (isLeaf ? 4 : -5)}
                    fill={matched ? '#ea580c' : 'currentColor'}
                    className={
                      matched
                        ? 'fill-orange-600 text-xs font-semibold dark:fill-orange-400'
                        : isLeaf
                          ? 'fill-foreground text-xs'
                          : 'fill-muted-foreground text-[10px]'
                    }
                  >
                    {node.label}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
