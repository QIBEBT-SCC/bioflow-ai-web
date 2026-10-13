'use client'

import { Download } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  type NewickErrorCode,
  type NewickNode,
  NewickParseError,
  type NewickTree,
  parseNewickTrees,
} from '@/components/project/run/newick'
import {
  PreviewError,
  PreviewFooter,
  PreviewSearch,
  PreviewStat,
  PreviewSwitch,
  PreviewToolbar,
  ZoomControls,
} from '@/components/project/run/preview-chrome'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

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
  onShowText,
}: {
  content: string
  fileName: string
  onShowText?: () => void
}) {
  const t = useTranslations('Project.runDetail.newickPreview')
  const tViewer = useTranslations('Project.runDetail.fileViewer')
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
      <PreviewError
        title={t('parseFailed')}
        message={detail}
        action={
          onShowText && (
            <Button variant='outline' size='sm' onClick={onShowText}>
              {tViewer('viewOriginalText')}
            </Button>
          )
        }
      />
    )
  }

  if (!tree) return null

  return (
    <div className='flex h-full flex-col overflow-hidden text-sm'>
      <PreviewToolbar>
        {trees && trees.length > 1 && (
          <Select
            value={String(treeIndex)}
            onValueChange={(value) => setSelectedTree(Number(value))}
          >
            <SelectTrigger
              size='sm'
              aria-label={t('tree')}
              className='max-w-56 bg-background'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {trees.map((item, index) => (
                <SelectItem key={item.root.id} value={String(index)}>
                  {t('treeOption', {
                    index: index + 1,
                    count: item.leafCount,
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <PreviewSearch
          value={search}
          onChange={setSearch}
          placeholder={t('search')}
          className='w-48'
        />
        <ZoomControls
          onZoomIn={() => setZoom((value) => Math.min(3, value + 0.25))}
          onZoomOut={() => setZoom((value) => Math.max(0.5, value - 0.25))}
          onReset={() => setZoom(1)}
          zoomInLabel={t('zoomIn')}
          zoomOutLabel={t('zoomOut')}
          resetLabel={t('resetZoom')}
          canZoomIn={zoom < 3}
          canZoomOut={zoom > 0.5}
        />
        <PreviewSwitch
          id='newick-branch-lengths'
          label={t('branchLengths')}
          checked={useBranchLengths && tree.hasBranchLengths}
          disabled={!tree.hasBranchLengths}
          onCheckedChange={setUseBranchLengths}
        />
        <PreviewSwitch
          id='newick-internal-labels'
          label={t('internalLabels')}
          checked={showInternalLabels}
          onCheckedChange={setShowInternalLabels}
        />
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='ml-auto bg-background'
          onClick={downloadSvg}
        >
          <Download />
          {t('exportSvg')}
        </Button>
      </PreviewToolbar>
      <div
        ref={wrapperRef}
        className='min-h-0 flex-1 overflow-auto bg-background p-2'
      >
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
            const dimmed = Boolean(normalizedSearch) && !matched
            return (
              <g key={node.id}>
                {matched && (
                  <circle
                    cx={x}
                    cy={y}
                    r={8}
                    fill='currentColor'
                    fillOpacity={0.15}
                    className='fill-primary'
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={matched ? 4 : isLeaf ? 2.5 : 2}
                  fill='currentColor'
                  className={matched ? 'fill-primary' : 'fill-muted-foreground'}
                >
                  {node.label && <title>{node.label}</title>}
                </circle>
                {showLabel && (
                  <text
                    x={x + 7}
                    y={y + (isLeaf ? 4 : -5)}
                    fill='currentColor'
                    fillOpacity={dimmed ? 0.35 : 1}
                    className={
                      matched
                        ? 'fill-primary text-xs font-semibold'
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
      <PreviewFooter>
        <div className='flex flex-wrap items-center gap-x-4 gap-y-1'>
          <PreviewStat label={t('leaves')} value={tree.leafCount} />
          <PreviewStat label={t('nodes')} value={tree.nodeCount} />
          {normalizedSearch && (
            <span className={cn(matches.size > 0 && 'text-primary')}>
              {t('matches', { count: matches.size })}
            </span>
          )}
          {zoom !== 1 && (
            <span className='tabular-nums'>{Math.round(zoom * 100)}%</span>
          )}
        </div>
        <span className='hidden lg:inline'>{t('rootingNotice')}</span>
      </PreviewFooter>
    </div>
  )
}
