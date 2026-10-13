'use client'

import { LocateFixed, X } from 'lucide-react'
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
import {
  IconTooltipButton,
  PreviewError,
  PreviewFooter,
  PreviewHint,
  PreviewSearch,
  PreviewStat,
  PreviewToolbar,
} from '@/components/project/run/preview-chrome'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const NO_PATH = '__none__'

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

export function GfaPreview({
  content,
  onShowText,
}: {
  content: string
  onShowText?: () => void
}) {
  const t = useTranslations('Project.runDetail.gfaPreview')
  const tViewer = useTranslations('Project.runDetail.fileViewer')
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
      <PreviewError
        title={t('parseFailed')}
        message={`${t(`errors.${ERROR_KEYS[code]}`)}${line ? ` ${t('errorLine', { line })}` : ''}`}
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

  if (!graph || !layout) return null

  const locateFirstMatch = () => {
    const exact = graph.segments.find(
      (segment) => segment.name.toLocaleLowerCase() === normalizedSearch,
    )?.name
    setSelectedName(exact ?? matches.values().next().value ?? null)
  }

  return (
    <div className='flex h-full flex-col overflow-hidden text-sm'>
      <PreviewToolbar>
        <PreviewSearch
          value={search}
          onChange={setSearch}
          onSubmit={locateFirstMatch}
          placeholder={t('search')}
          className='w-48'
        />
        <IconTooltipButton
          label={t('locate')}
          onClick={locateFirstMatch}
          disabled={!matches.size}
        >
          <LocateFixed />
        </IconTooltipButton>
        {graph.paths.length > 0 && (
          <Select
            value={pathName || NO_PATH}
            onValueChange={(value) =>
              setPathName(value === NO_PATH ? '' : value)
            }
          >
            <SelectTrigger
              size='sm'
              aria-label={t('path')}
              className='max-w-64 bg-background'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PATH}>{t('noPath')}</SelectItem>
              {graph.paths.map((path) => (
                <SelectItem key={path.name} value={path.name}>
                  {t('pathOption', {
                    name: path.name,
                    count: path.steps.length,
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <PreviewHint>{t('hint', { version: graph.version })}</PreviewHint>
        <div className='ml-auto flex flex-wrap items-center gap-x-3 text-xs'>
          <PreviewStat label={t('segments')} value={graph.segments.length} />
          <PreviewStat label={t('links')} value={graph.links.length} />
          <PreviewStat label={t('paths')} value={graph.paths.length} />
          <PreviewStat
            label={t('knownLength')}
            value={`${graph.totalLength.toLocaleString('en-US')} bp`}
          />
        </div>
      </PreviewToolbar>
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
          <aside className='flex w-72 shrink-0 flex-col border-l bg-muted/10'>
            <div className='flex items-start justify-between gap-2 border-b px-3 py-2'>
              <div className='min-w-0'>
                <p className='text-xs text-muted-foreground'>
                  {t('segmentDetail')}
                </p>
                <h3 className='break-all font-mono text-sm font-semibold'>
                  {selectedNode.segment.name}
                </h3>
              </div>
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                onClick={() => setSelectedName(null)}
                aria-label={t('closeDetails')}
              >
                <X />
              </Button>
            </div>
            <div className='min-h-0 flex-1 space-y-4 overflow-auto p-3 text-xs'>
              <dl className='grid grid-cols-3 gap-2'>
                {(
                  [
                    [
                      t('length'),
                      selectedNode.segment.length?.toLocaleString('en-US') ??
                        t('unknown'),
                    ],
                    [t('depth'), selectedNode.segment.depth ?? t('unknown')],
                    [t('degree'), selectedNode.degree],
                  ] as const
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className='rounded-lg border bg-background px-2 py-1.5'
                  >
                    <dt className='text-muted-foreground'>{label}</dt>
                    <dd className='mt-0.5 font-medium tabular-nums'>{value}</dd>
                  </div>
                ))}
              </dl>
              {Object.keys(selectedNode.segment.tags).length > 0 && (
                <section>
                  <h4 className='mb-2 text-xs font-medium'>{t('tags')}</h4>
                  <dl className='divide-y rounded-lg border bg-background font-mono'>
                    {Object.entries(selectedNode.segment.tags)
                      .slice(0, 12)
                      .map(([key, value]) => (
                        <div key={key} className='flex gap-2 px-2 py-1.5'>
                          <dt className='font-semibold'>{key}</dt>
                          <dd className='min-w-0 break-all text-foreground/80'>
                            {value}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </section>
              )}
            </div>
          </aside>
        )}
      </div>
      <PreviewFooter>
        <span>
          {normalizedSearch
            ? t('matches', { count: matches.size })
            : t('interactionHint')}
        </span>
        <span>
          {[
            graph.unknownLengthCount > 0 &&
              t('unknownLengths', { count: graph.unknownLengthCount }),
            graph.ignoredRecordCount > 0 &&
              t('ignoredRecords', { count: graph.ignoredRecordCount }),
          ]
            .filter(Boolean)
            .join(' ')}
        </span>
      </PreviewFooter>
    </div>
  )
}
