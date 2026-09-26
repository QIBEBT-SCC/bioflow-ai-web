'use client'

import {
  GitForkIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import {
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import {
  useDeleteWorkflow,
  useSearchSubgraphs,
  useWorkflows,
} from '@/hooks/use-workflow'
import { type WorkflowPortSummary, WorkflowType } from '@/types/workflow'
import { SubgraphDetails } from './subgraph-details'

const PAGE_SIZE = 12
const SKELETON_IDS = ['one', 'two', 'three', 'four', 'five', 'six']

export function SubgraphManagement() {
  const t = useTranslations('editor.subgraph.management')
  const subgraphT = useTranslations('editor.subgraph')
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewUid, setViewUid] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<{
    uid: string
    name: string
  } | null>(null)
  const { data, isPending, error, refetch } = useWorkflows(
    page * PAGE_SIZE,
    PAGE_SIZE,
    WorkflowType.SUBMODULE,
  )
  const debouncedQuery = useDebouncedValue(searchQuery.trim(), 300)
  const isSearching = searchQuery.trim().length > 0
  const isDebouncing = isSearching && debouncedQuery !== searchQuery.trim()
  const semanticSearch = useSearchSubgraphs(debouncedQuery, 20)
  const activeItems = isSearching
    ? (semanticSearch.data ?? [])
    : (data?.data ?? [])
  const activePending = isSearching
    ? isDebouncing || semanticSearch.isPending
    : isPending
  const activeError = isSearching
    ? isDebouncing
      ? null
      : semanticSearch.error
    : error
  const deletion = useDeleteWorkflow()
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const confirmDelete = () => {
    if (!deleting || deletion.isPending) return
    deletion.mutate(deleting.uid, {
      onSuccess: () => {
        if (!isSearching && data?.data.length === 1 && page > 0)
          setPage((current) => current - 1)
        setDeleting(null)
      },
    })
  }
  return (
    <PageShell breadcrumbs={[{ label: t('title') }]}>
      <PageContainer>
        <PageHeader
          title={t('title')}
          description={t('description')}
          actions={
            <div className='relative w-full sm:w-72'>
              <SearchIcon className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                type='search'
                className='pl-8'
                aria-label={subgraphT('search_placeholder')}
                placeholder={subgraphT('search_placeholder')}
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setPage(0)
                }}
              />
            </div>
          }
        />

        {activePending && (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {SKELETON_IDS.map((id) => (
              <Skeleton key={id} className='h-56 rounded-xl' />
            ))}
          </div>
        )}

        {activeError && (
          <Empty className='border border-dashed'>
            <EmptyHeader>
              <EmptyTitle>{t('load_error_title')}</EmptyTitle>
              <EmptyDescription>{activeError.message}</EmptyDescription>
            </EmptyHeader>
            <Button
              variant='outline'
              onClick={() =>
                void (isSearching ? semanticSearch.refetch() : refetch())
              }
            >
              {t('retry')}
            </Button>
          </Empty>
        )}

        {!activePending && !activeError && activeItems.length === 0 && (
          <Empty className='border border-dashed'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                {isSearching ? <SearchIcon /> : <GitForkIcon />}
              </EmptyMedia>
              <EmptyTitle>
                {isSearching
                  ? subgraphT('no_search_results')
                  : t('empty_title')}
              </EmptyTitle>
              <EmptyDescription>
                {isSearching
                  ? subgraphT('no_search_results_description', {
                      query: searchQuery.trim(),
                    })
                  : t('empty')}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {!activePending && !activeError && activeItems.length > 0 && (
          <>
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {activeItems.map((item) => (
                <Card
                  key={item.uid}
                  className='group relative gap-0 py-0 transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-md'
                >
                  <CardContent className='p-5'>
                    <div className='mb-3 flex items-start gap-3'>
                      <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                        <GitForkIcon className='size-5' />
                      </div>
                      <button
                        type='button'
                        className='line-clamp-2 min-w-0 flex-1 pt-0.5 text-left font-semibold after:absolute after:inset-0 group-hover:text-primary'
                        onClick={() => setViewUid(item.uid)}
                      >
                        {item.name}
                      </button>
                      <div className='relative z-10 -mt-1 -mr-2'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='size-8 text-muted-foreground'
                            >
                              <MoreHorizontalIcon className='size-4' />
                              <span className='sr-only'>
                                {t('more_options')}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/editor?workflowUid=${encodeURIComponent(item.uid)}`}
                              >
                                <PencilIcon className='size-4' />
                                {t('edit')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant='destructive'
                              onClick={() => setDeleting(item)}
                            >
                              <Trash2Icon className='size-4' />
                              {t('delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className='line-clamp-2 min-h-10 text-sm text-muted-foreground'>
                      {item.description}
                    </p>
                    <div className='mt-4 grid gap-2 border-t pt-3 text-xs'>
                      <InterfaceNames
                        label={t('inputs')}
                        ports={item.inputs ?? []}
                        emptyLabel={t('none')}
                      />
                      <InterfaceNames
                        label={t('outputs')}
                        ports={item.outputs ?? []}
                        emptyLabel={t('none')}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {isSearching ? (
              <p className='mt-6 text-sm text-muted-foreground'>
                {subgraphT('search_results_count', {
                  count: activeItems.length,
                })}
              </p>
            ) : (
              <div className='mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row'>
                <p className='text-sm text-muted-foreground'>
                  {t('showing', {
                    start: page * PAGE_SIZE + 1,
                    end: Math.min((page + 1) * PAGE_SIZE, total),
                    total,
                  })}
                </p>
                <Pagination className='mx-0 w-auto'>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setPage((current) => Math.max(0, current - 1))
                        }
                        className={
                          !page
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className='px-3 text-sm tabular-nums'>
                        {page + 1} / {totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setPage((current) =>
                            Math.min(totalPages - 1, current + 1),
                          )
                        }
                        className={
                          page + 1 === totalPages
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </PageContainer>
      {viewUid && (
        <SubgraphDetails uid={viewUid} onClose={() => setViewUid(null)} />
      )}
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !deletion.isPending) setDeleting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_description', { name: deleting?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletion.isPending}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={deletion.isPending}
              onClick={(event) => {
                event.preventDefault()
                confirmDelete()
              }}
            >
              {deletion.isPending ? t('deleting') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  )
}

function InterfaceNames({
  label,
  ports,
  emptyLabel,
}: {
  label: string
  ports: WorkflowPortSummary[]
  emptyLabel: string
}) {
  return (
    <div className='grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-2'>
      <span className='pt-1 text-muted-foreground'>{label}</span>
      {ports.length > 0 ? (
        <div className='flex min-w-0 flex-wrap gap-1.5'>
          {ports.map((port) => (
            <span
              key={port.id}
              className='max-w-full truncate rounded-md bg-muted px-2 py-1'
              title={
                port.description
                  ? `${port.name}: ${port.description}`
                  : port.name
              }
            >
              {port.name}
            </span>
          ))}
        </div>
      ) : (
        <span className='pt-1 text-muted-foreground'>{emptyLabel}</span>
      )}
    </div>
  )
}
