'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import {
  type GfaErrorCode,
  type GfaGraph,
  GfaParseError,
  parseGfa,
} from '@/components/project/run/gfa'
import { GfaCanvas } from '@/components/project/run/gfa-canvas'
import { layoutGfa } from '@/components/project/run/gfa-layout'

const ERROR_KEYS: Record<GfaErrorCode, string> = {
  duplicateName: 'duplicateName',
  duplicatePath: 'duplicatePath',
  duplicateSegment: 'duplicateSegment',
  empty: 'empty',
  invalidOrientation: 'invalidOrientation',
  invalidRecord: 'invalidRecord',
  missingSegment: 'missingSegment',
  tooManyLinks: 'tooManyLinks',
  tooManyPathSteps: 'tooManyPathSteps',
  tooManyPaths: 'tooManyPaths',
  tooManySegments: 'tooManySegments',
  unsupportedVersion: 'unsupportedVersion',
}

function parseResult(
  content: string,
): { graph: GfaGraph; error: null } | { graph: null; error: unknown } {
  try {
    return { graph: parseGfa(content), error: null }
  } catch (error) {
    return { graph: null, error }
  }
}

export function GfaPreview({ content }: { content: string }) {
  const t = useTranslations('Project.runDetail.gfaPreview')
  const parsed = useMemo(() => parseResult(content), [content])
  const graph = parsed.graph
  const layout = useMemo(() => (graph ? layoutGfa(graph) : null), [graph])
  const [search, setSearch] = useState('')
  const [pathName, setPathName] = useState('')
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const matches = useMemo(
    () =>
      new Set(
        graph?.segments
          .filter(
            (segment) =>
              normalizedSearch &&
              segment.name.toLocaleLowerCase().includes(normalizedSearch),
          )
          .map((segment) => segment.name) ?? [],
      ),
    [graph, normalizedSearch],
  )
  const selectedPath =
    graph?.paths.find((path) => path.name === pathName) ?? null
  const selectedNode = layout?.nodes.find(
    (node) => node.segment.name === selectedName,
  )

  if (parsed.error) {
    const code =
      parsed.error instanceof GfaParseError
        ? parsed.error.code
        : 'invalidRecord'
    const line =
      parsed.error instanceof GfaParseError ? parsed.error.line : undefined
    return (
      <div className='h-full overflow-auto p-4'>
        <p
          role='alert'
          className='rounded border border-destructive/40 p-3 text-sm text-destructive'
        >
          {t(`errors.${ERROR_KEYS[code]}`)}
          {line ? ` ${t('errorLine', { line })}` : ''}
        </p>
      </div>
    )
  }

  if (!graph || !layout) return null

  const locateFirstMatch = () => {
    const exact = graph.segments.find(
      (segment) => segment.name.toLocaleLowerCase() === normalizedSearch,
    )?.name
    setSelectedName(exact ?? matches.values().next().value ?? null)
  }

  return (
    <div className='flex h-full flex-col overflow-hidden text-sm'>
      <div className='flex flex-wrap items-center gap-2 border-b p-3'>
        <input
          aria-label={t('search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') locateFirstMatch()
          }}
          placeholder={t('search')}
          className='h-8 w-48 rounded border bg-background px-2'
        />
        <button
          type='button'
          onClick={locateFirstMatch}
          disabled={!matches.size}
          className='h-8 rounded border px-3 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted'
        >
          {t('locate')}
        </button>
        <label className='flex items-center gap-2'>
          <span className='text-muted-foreground'>{t('path')}</span>
          <select
            aria-label={t('path')}
            value={pathName}
            onChange={(event) => setPathName(event.target.value)}
            className='h-8 max-w-64 rounded border bg-background px-2'
          >
            <option value=''>{t('noPath')}</option>
            {graph.paths.map((path) => (
              <option key={path.name} value={path.name}>
                {t('pathOption', {
                  name: path.name,
                  count: path.steps.length,
                })}
              </option>
            ))}
          </select>
        </label>
        <span className='text-xs text-muted-foreground'>
          {t('summary', {
            segments: graph.segments.length,
            links: graph.links.length,
            paths: graph.paths.length,
            length: graph.totalLength.toLocaleString('en-US'),
          })}
        </span>
        {normalizedSearch && (
          <span className='text-xs text-muted-foreground'>
            {t('matches', { count: matches.size })}
          </span>
        )}
      </div>
      <div className='flex min-h-0 flex-1'>
        <GfaCanvas
          ariaLabel={t('graphic')}
          fitLabel={t('fit')}
          layout={layout}
          matches={matches}
          onSelectAction={setSelectedName}
          path={selectedPath}
          selectedName={selectedName}
          zoomInLabel={t('zoomIn')}
          zoomOutLabel={t('zoomOut')}
        />
        {selectedNode && (
          <aside className='w-64 shrink-0 overflow-auto border-l bg-background p-3'>
            <div className='flex items-start justify-between gap-2'>
              <h3 className='break-all font-mono font-semibold'>
                {selectedNode.segment.name}
              </h3>
              <button
                type='button'
                onClick={() => setSelectedName(null)}
                aria-label={t('closeDetails')}
                className='rounded px-1 text-muted-foreground hover:bg-muted'
              >
                ×
              </button>
            </div>
            <dl className='mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs'>
              <dt className='text-muted-foreground'>{t('length')}</dt>
              <dd>
                {selectedNode.segment.length?.toLocaleString('en-US') ??
                  t('unknown')}
              </dd>
              <dt className='text-muted-foreground'>{t('depth')}</dt>
              <dd>{selectedNode.segment.depth ?? t('unknown')}</dd>
              <dt className='text-muted-foreground'>{t('degree')}</dt>
              <dd>{selectedNode.degree}</dd>
            </dl>
            {Object.keys(selectedNode.segment.tags).length > 0 && (
              <div className='mt-4'>
                <h4 className='mb-2 text-xs font-medium text-muted-foreground'>
                  {t('tags')}
                </h4>
                <dl className='space-y-1 font-mono text-xs'>
                  {Object.entries(selectedNode.segment.tags)
                    .slice(0, 12)
                    .map(([key, value]) => (
                      <div key={key} className='flex gap-2'>
                        <dt className='font-semibold'>{key}</dt>
                        <dd className='min-w-0 break-all'>{value}</dd>
                      </div>
                    ))}
                </dl>
              </div>
            )}
          </aside>
        )}
      </div>
      <div className='border-t px-3 py-1.5 text-xs text-muted-foreground'>
        {t('hint', { version: graph.version })}
        {graph.unknownLengthCount > 0 &&
          ` ${t('unknownLengths', { count: graph.unknownLengthCount })}`}
        {graph.ignoredRecordCount > 0 &&
          ` ${t('ignoredRecords', { count: graph.ignoredRecordCount })}`}
      </div>
    </div>
  )
}
