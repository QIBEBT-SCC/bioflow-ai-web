'use client'

import { useQuery } from '@tanstack/react-query'
import {
  ArrowUpRightIcon,
  BrainCircuitIcon,
  Code2Icon,
  ContainerIcon,
  DatabaseIcon,
  DnaIcon,
  ExternalLinkIcon,
  GitBranchIcon,
  SearchIcon,
  WrenchIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { getCodeList } from '@/app/actions/code'
import { getGenomeList, searchGenome } from '@/app/actions/genome'
import { getImageList, searchImages } from '@/app/actions/image'
import { getDBList } from '@/app/actions/resource'
import { getToolList, searchTools } from '@/app/actions/tool'
import { getToolMemories } from '@/app/actions/tool-memory'
import { getWorkflows } from '@/app/actions/workflow'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { NodeLibraryOverviewStats } from '@/hooks/use-node-library'
import { WorkflowType } from '@/types/workflow'

type BrowserTab = 'tool' | 'image' | 'code' | 'subgraph' | 'memory' | 'resource'

const TAB_MANAGER_HREF: Record<BrowserTab, string> = {
  tool: '/tool',
  image: '/image',
  code: '/code',
  subgraph: '/subgraph',
  memory: '/memory',
  resource: '/resource/database',
}

function LoadingGrid() {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {['s1', 's2', 's3', 's4', 's5', 's6'].map((key) => (
        <Skeleton key={key} className='h-36 rounded-xl' />
      ))}
    </div>
  )
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className='rounded-xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground'>
      {text}
    </div>
  )
}

export function LibraryAssetBrowser({
  stats,
}: {
  stats: NodeLibraryOverviewStats
}) {
  const t = useTranslations('Library.browser')
  const locale = useLocale()
  const [activeTab, setActiveTab] = useState<BrowserTab>('tool')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query.trim(), 300)

  const toolsQuery = useQuery({
    queryKey: ['library', 'browser', 'tool', debouncedQuery],
    queryFn: () =>
      debouncedQuery ? searchTools(debouncedQuery, 0, 12) : getToolList(0, 12),
    enabled: activeTab === 'tool',
  })

  const imagesQuery = useQuery({
    queryKey: ['library', 'browser', 'image', debouncedQuery],
    queryFn: () =>
      debouncedQuery
        ? searchImages(debouncedQuery, 0, 12)
        : getImageList(0, 12),
    enabled: activeTab === 'image',
  })

  const codesQuery = useQuery({
    queryKey: ['library', 'browser', 'code', debouncedQuery],
    queryFn: () =>
      getCodeList({
        query: debouncedQuery || undefined,
        offset: 0,
        limit: 12,
      }),
    enabled: activeTab === 'code',
  })

  const subgraphsQuery = useQuery({
    queryKey: ['library', 'browser', 'subgraph', debouncedQuery],
    queryFn: () => getWorkflows(0, 12, WorkflowType.SUBMODULE, debouncedQuery),
    enabled: activeTab === 'subgraph',
  })

  const memoriesQuery = useQuery({
    queryKey: ['library', 'browser', 'memory'],
    queryFn: () => getToolMemories(undefined, 0, 24),
    enabled: activeTab === 'memory',
  })

  const dbsQuery = useQuery({
    queryKey: ['library', 'browser', 'dbs'],
    queryFn: () => getDBList(0, 12),
    enabled: activeTab === 'resource',
  })

  const genomesQuery = useQuery({
    queryKey: ['library', 'browser', 'genomes', debouncedQuery],
    queryFn: () =>
      debouncedQuery ? searchGenome(debouncedQuery) : getGenomeList(0, 12),
    enabled: activeTab === 'resource',
  })

  const tabCounts: Record<BrowserTab, number> = {
    tool: stats.toolsTotal,
    image: stats.imagesTotal,
    code: stats.codesTotal,
    subgraph: stats.subgraphsTotal,
    memory: stats.memoriesTotal,
    resource: stats.resourcesTotal,
  }

  const normalizedFilter = debouncedQuery.toLowerCase()
  const filteredMemories = (memoriesQuery.data?.data ?? []).filter((item) => {
    if (!normalizedFilter) return true
    return (
      item.tool_name.toLowerCase().includes(normalizedFilter) ||
      item.description.toLowerCase().includes(normalizedFilter)
    )
  })

  const filteredDbs = (dbsQuery.data?.data ?? []).filter((db) => {
    if (!normalizedFilter) return true
    return db.name.toLowerCase().includes(normalizedFilter)
  })

  const genomes = genomesQuery.data ?? []

  return (
    <section className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div className='space-y-1'>
          <h2 className='text-lg font-semibold tracking-tight'>
            {t('sectionTitle')}
          </h2>
          <p className='text-sm text-muted-foreground'>{t('sectionDesc')}</p>
        </div>

        <Button variant='outline' size='sm' asChild>
          <Link href={TAB_MANAGER_HREF[activeTab]}>
            {t('manageAll')}
            <ArrowUpRightIcon className='size-4' />
          </Link>
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as BrowserTab)}
        className='space-y-4'
      >
        <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
          <TabsList className='h-auto flex-wrap justify-start'>
            {(
              [
                'tool',
                'image',
                'code',
                'subgraph',
                'memory',
                'resource',
              ] as const
            ).map((tab) => (
              <TabsTrigger key={tab} value={tab} className='gap-1.5'>
                <span>{t(`tabs.${tab}`)}</span>
                <span className='rounded-full bg-muted px-1.5 py-0 text-[11px] text-muted-foreground tabular-nums'>
                  {tabCounts[tab]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className='relative w-full sm:w-72'>
            <SearchIcon className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              type='search'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className='pl-8'
            />
          </div>
        </div>

        {/* Tools */}
        <TabsContent value='tool' className='mt-0'>
          {toolsQuery.isLoading ? (
            <LoadingGrid />
          ) : (toolsQuery.data?.data.length ?? 0) === 0 ? (
            <EmptyBox text={t('empty')} />
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {toolsQuery.data?.data.map((tool) => (
                <div
                  key={tool.uid}
                  className='flex flex-col justify-between rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:border-primary/40 hover:shadow-md'
                >
                  <div className='space-y-2.5'>
                    <div className='flex items-start justify-between gap-2'>
                      <Link
                        href={`/tool/${tool.uid}`}
                        className='group flex min-w-0 items-center gap-2'
                      >
                        <span className='inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted'>
                          <WrenchIcon className='size-4 text-primary' />
                        </span>
                        <div className='min-w-0'>
                          <h3 className='truncate text-sm font-semibold group-hover:text-primary'>
                            {tool.name}
                          </h3>
                          {tool.image?.name && (
                            <p className='truncate font-mono text-[11px] text-muted-foreground'>
                              {tool.image.name}
                              {tool.image.version
                                ? `:${tool.image.version}`
                                : ''}
                            </p>
                          )}
                        </div>
                      </Link>
                      {tool.image?.paper_link && (
                        <a
                          href={tool.image.paper_link}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/15'
                        >
                          {t('paperLink')}
                          <ExternalLinkIcon className='size-3' />
                        </a>
                      )}
                    </div>

                    <p className='line-clamp-2 text-xs leading-relaxed text-muted-foreground'>
                      {tool.description || t('noDescription')}
                    </p>
                  </div>

                  <div className='mt-3 flex items-center justify-between gap-2 border-t pt-3'>
                    <div className='flex min-w-0 flex-wrap gap-1'>
                      {tool.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag.id}
                          variant='secondary'
                          className='text-[11px]'
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                    <Link
                      href={`/tool/${tool.uid}`}
                      className='inline-flex shrink-0 items-center text-xs font-medium text-primary hover:underline'
                    >
                      <ArrowUpRightIcon className='size-3.5' />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Images */}
        <TabsContent value='image' className='mt-0'>
          {imagesQuery.isLoading ? (
            <LoadingGrid />
          ) : (imagesQuery.data?.data.length ?? 0) === 0 ? (
            <EmptyBox text={t('empty')} />
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {imagesQuery.data?.data.map((img) => {
                const href = img.uid ? `/image/${img.uid}` : '/image'
                return (
                  <div
                    key={img.uid ?? img.ref ?? img.name}
                    className='flex flex-col justify-between rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:border-primary/40 hover:shadow-md'
                  >
                    <div className='space-y-2.5'>
                      <div className='flex items-start justify-between gap-2'>
                        <Link
                          href={href}
                          className='group flex min-w-0 items-center gap-2'
                        >
                          <span className='inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted'>
                            <ContainerIcon className='size-4 text-primary' />
                          </span>
                          <div className='min-w-0'>
                            <h3 className='truncate text-sm font-semibold group-hover:text-primary'>
                              {img.name}
                            </h3>
                            <p className='truncate font-mono text-[11px] text-muted-foreground'>
                              {img.version}
                            </p>
                          </div>
                        </Link>
                        {img.paper_link && (
                          <a
                            href={img.paper_link}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/15'
                          >
                            {t('paperLink')}
                            <ExternalLinkIcon className='size-3' />
                          </a>
                        )}
                      </div>
                      <p className='line-clamp-2 text-xs leading-relaxed text-muted-foreground'>
                        {img.description || t('noDescription')}
                      </p>
                    </div>

                    <div className='mt-3 flex items-center justify-between gap-2 border-t pt-3 text-[11px] text-muted-foreground'>
                      <span className='truncate font-mono'>
                        {img.ref ?? img.image?.repository}
                      </span>
                      <Link
                        href={href}
                        className='shrink-0 text-primary hover:underline'
                      >
                        <ArrowUpRightIcon className='size-3.5' />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Code Nodes */}
        <TabsContent value='code' className='mt-0'>
          {codesQuery.isLoading ? (
            <LoadingGrid />
          ) : (codesQuery.data?.data.length ?? 0) === 0 ? (
            <EmptyBox text={t('empty')} />
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {codesQuery.data?.data.map((code) => (
                <Link
                  key={code.uid}
                  href={`/code/${code.uid}`}
                  className='group flex flex-col justify-between rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:border-primary/40 hover:shadow-md'
                >
                  <div className='space-y-2.5'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex min-w-0 items-center gap-2'>
                        <span className='inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted'>
                          <Code2Icon className='size-4 text-info' />
                        </span>
                        <h3 className='truncate text-sm font-semibold group-hover:text-primary'>
                          {code.name}
                        </h3>
                      </div>
                      <Badge
                        variant='outline'
                        className='shrink-0 font-mono text-[11px]'
                      >
                        {code.node_type}
                      </Badge>
                    </div>
                    <p className='line-clamp-2 text-xs leading-relaxed text-muted-foreground'>
                      {code.description || t('noDescription')}
                    </p>
                  </div>

                  <div className='mt-3 flex items-center justify-end border-t pt-3 text-muted-foreground'>
                    <ArrowUpRightIcon className='size-3.5 group-hover:text-primary' />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Subgraphs */}
        <TabsContent value='subgraph' className='mt-0'>
          {subgraphsQuery.isLoading ? (
            <LoadingGrid />
          ) : (subgraphsQuery.data?.data.length ?? 0) === 0 ? (
            <EmptyBox text={t('empty')} />
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {subgraphsQuery.data?.data.map((wf) => (
                <Link
                  key={wf.uid}
                  href='/subgraph'
                  className='group flex flex-col justify-between rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:border-primary/40 hover:shadow-md'
                >
                  <div className='space-y-2.5'>
                    <div className='flex items-center gap-2'>
                      <span className='inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted'>
                        <GitBranchIcon className='size-4 text-primary' />
                      </span>
                      <h3 className='truncate text-sm font-semibold group-hover:text-primary'>
                        {wf.name}
                      </h3>
                    </div>
                    <p className='line-clamp-2 text-xs leading-relaxed text-muted-foreground'>
                      {wf.description || t('noDescription')}
                    </p>
                  </div>

                  <div className='mt-3 flex items-center justify-between gap-2 border-t pt-3 text-[11px] text-muted-foreground tabular-nums'>
                    <span>
                      {t('portsSummary', {
                        inputs: wf.inputs.length,
                        outputs: wf.outputs.length,
                      })}
                    </span>
                    <ArrowUpRightIcon className='size-3.5 group-hover:text-primary' />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Memories */}
        <TabsContent value='memory' className='mt-0'>
          {memoriesQuery.isLoading ? (
            <LoadingGrid />
          ) : filteredMemories.length === 0 ? (
            <EmptyBox text={t('empty')} />
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {filteredMemories.map((memory) => (
                <Link
                  key={memory.uid}
                  href={`/tool/${memory.tool_uid}`}
                  className='group flex flex-col justify-between rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:border-primary/40 hover:shadow-md'
                >
                  <div className='space-y-2.5'>
                    <div className='flex items-center justify-between gap-2'>
                      <Badge
                        variant='outline'
                        className='border-success/30 bg-success/10 font-mono text-[11px] text-success'
                      >
                        <BrainCircuitIcon className='size-3' />
                        {memory.tool_name}
                      </Badge>
                      <span
                        className='text-[11px] text-muted-foreground tabular-nums'
                        suppressHydrationWarning
                      >
                        {new Date(memory.created_at).toLocaleDateString(locale)}
                      </span>
                    </div>
                    <p className='line-clamp-3 text-xs leading-relaxed text-foreground'>
                      {memory.description}
                    </p>
                  </div>

                  <div className='mt-3 flex items-center justify-between gap-2 border-t pt-3 text-[11px] text-muted-foreground'>
                    <span>{memory.creator_username ?? 'System'}</span>
                    <ArrowUpRightIcon className='size-3.5 group-hover:text-primary' />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Resources (BioDBs + Reference Genomes) */}
        <TabsContent value='resource' className='mt-0 space-y-6'>
          {dbsQuery.isLoading || genomesQuery.isLoading ? (
            <LoadingGrid />
          ) : filteredDbs.length === 0 && genomes.length === 0 ? (
            <EmptyBox text={t('empty')} />
          ) : (
            <>
              {filteredDbs.length > 0 && (
                <div className='space-y-3'>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    {t('databasesHeading')}
                  </h3>
                  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    {filteredDbs.map((db) => (
                      <Link
                        key={db.id}
                        href='/resource/database'
                        className='group flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:border-primary/40 hover:shadow-md'
                      >
                        <div className='flex min-w-0 items-center gap-2.5'>
                          <span className='inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted'>
                            <DatabaseIcon className='size-4 text-primary' />
                          </span>
                          <div className='min-w-0'>
                            <p className='truncate text-sm font-semibold group-hover:text-primary'>
                              {db.name}
                            </p>
                            <p className='truncate font-mono text-[11px] text-muted-foreground'>
                              {db.size ?? db.path ?? '—'}
                            </p>
                          </div>
                        </div>
                        <ArrowUpRightIcon className='size-4 shrink-0 text-muted-foreground group-hover:text-primary' />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {genomes.length > 0 && (
                <div className='space-y-3'>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    {t('genomesHeading')}
                  </h3>
                  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    {genomes.map((genome) => (
                      <Link
                        key={genome.id}
                        href='/resource/genome'
                        className='group flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:border-primary/40 hover:shadow-md'
                      >
                        <div className='flex min-w-0 items-center gap-2.5'>
                          <span className='inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted'>
                            <DnaIcon className='size-4 text-primary' />
                          </span>
                          <div className='min-w-0'>
                            <p className='truncate text-sm font-semibold group-hover:text-primary'>
                              {genome.name}
                            </p>
                            <p className='truncate font-mono text-[11px] text-muted-foreground'>
                              {genome.accession} · TaxID {genome.ncbi_tax_id}
                            </p>
                          </div>
                        </div>
                        <ArrowUpRightIcon className='size-4 shrink-0 text-muted-foreground group-hover:text-primary' />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </section>
  )
}
