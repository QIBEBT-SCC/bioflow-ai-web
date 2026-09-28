'use client'

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CornerDownLeftIcon,
  RotateCcwIcon,
  SearchIcon,
  SearchXIcon,
  SparklesIcon,
  TriangleAlertIcon,
  TypeIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import type {
  useWorkflowLibrarySearch,
  WorkflowSearchMode,
} from '@/hooks/use-workflow-library-search'
import { cn } from '@/lib/utils'

type SearchState = ReturnType<typeof useWorkflowLibrarySearch>

const modeIcons: Record<WorkflowSearchMode, typeof TypeIcon> = {
  name: TypeIcon,
  semantic: SparklesIcon,
}

export function WorkflowLibrarySearch({
  search,
  placeholder,
}: {
  search: SearchState
  placeholder: string
}) {
  const t = useTranslations('WorkflowSearch')
  const semantic = search.mode === 'semantic'
  const inputPlaceholder = semantic ? t('semanticPlaceholder') : placeholder
  return (
    <div className='space-y-1.5'>
      <div className='flex flex-col gap-2 sm:flex-row'>
        <InputGroup className='min-w-0 flex-1'>
          <InputGroupAddon>
            {semantic ? (
              <SparklesIcon className='text-primary' />
            ) : (
              <SearchIcon />
            )}
          </InputGroupAddon>
          <InputGroupInput
            type='search'
            aria-label={inputPlaceholder}
            placeholder={inputPlaceholder}
            value={search.query}
            onChange={(event) => search.setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                semantic &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault()
                void search.submitSemantic()
              }
            }}
          />
          {semantic && (
            <InputGroupAddon align='inline-end'>
              <InputGroupButton
                size='sm'
                variant='default'
                disabled={!search.query.trim() || search.semanticPending}
                onClick={() => void search.submitSemantic()}
              >
                {search.semanticPending ? <Spinner /> : <CornerDownLeftIcon />}
                {t('search')}
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <fieldset
          className='flex h-9 shrink-0 gap-0.5 rounded-lg bg-muted p-0.5'
          aria-label={t('mode')}
        >
          {(['name', 'semantic'] as const).map((mode) => {
            const Icon = modeIcons[mode]
            const active = search.mode === mode
            return (
              <button
                key={mode}
                type='button'
                aria-pressed={active}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:flex-none',
                  active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => search.setSearchMode(mode)}
              >
                <Icon
                  aria-hidden
                  className={cn('size-3.5', active && 'text-primary')}
                />
                {t(mode)}
              </button>
            )
          })}
        </fieldset>
      </div>
      {search.needsSubmission && search.submittedQuery && (
        <p
          className='flex items-center gap-1.5 text-xs text-warning'
          aria-live='polite'
        >
          <TriangleAlertIcon aria-hidden className='size-3.5' />
          {t('editedHint')}
        </p>
      )}
    </div>
  )
}

function FeedbackBlock({
  icon,
  title,
  description,
  className,
}: {
  icon: ReactNode
  title: string
  description?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-4 py-10 text-center',
        className,
      )}
    >
      <div className='flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-5'>
        {icon}
      </div>
      <p className='text-sm font-medium'>{title}</p>
      {description && (
        <p className='max-w-xs text-xs text-muted-foreground'>{description}</p>
      )}
    </div>
  )
}

/**
 * Renders loading / error / awaiting-submit / empty states for a workflow
 * library search, and the result list (`children`) once there is something
 * to show.
 */
export function WorkflowSearchResults({
  search,
  emptyLabel,
  noMatchesLabel,
  skeletonRows = 4,
  className,
  children,
}: {
  search: SearchState
  emptyLabel: string
  noMatchesLabel: string
  skeletonRows?: number
  className?: string
  children: ReactNode
}) {
  const t = useTranslations('WorkflowSearch')
  if (search.isPending) {
    return (
      <div aria-busy='true' className={cn('space-y-2', className)}>
        <span className='sr-only'>{t('loading')}</span>
        {Array.from({ length: skeletonRows }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
          <Skeleton key={index} className='h-15 rounded-lg' />
        ))}
      </div>
    )
  }
  if (search.error) {
    return (
      <Alert variant='destructive' className={className}>
        <TriangleAlertIcon />
        <AlertDescription className='flex flex-wrap items-center justify-between gap-2'>
          <span className='min-w-0 break-words'>{search.error.message}</span>
          <Button
            variant='outline'
            size='sm'
            onClick={() => void search.retry()}
          >
            <RotateCcwIcon />
            {t('retry')}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }
  if (search.semanticActive && !search.semanticResults) {
    return (
      <FeedbackBlock
        className={className}
        icon={<SparklesIcon className='text-primary' />}
        title={t('submitTitle')}
        description={t('submitHint')}
      />
    )
  }
  if (search.results.length === 0) {
    return (
      <FeedbackBlock
        className={className}
        icon={search.query.trim() ? <SearchXIcon /> : <SearchIcon />}
        title={search.query.trim() ? noMatchesLabel : emptyLabel}
      />
    )
  }
  return children
}

/** Result count, semantic score hint and prev/next paging for name search. */
export function WorkflowSearchFooter({
  search,
  pageSize,
  disabled,
}: {
  search: SearchState
  pageSize: number
  disabled?: boolean
}) {
  const t = useTranslations('WorkflowSearch')
  if (search.isPending || search.error) return null
  if (search.semanticActive) {
    if (!search.semanticResults) return null
    return (
      <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground'>
        <p className='min-w-0 truncate'>
          {t('semanticSummary', {
            count: search.results.length,
            query: search.submittedQuery,
          })}
        </p>
        <p>{t('scoreHint')}</p>
      </div>
    )
  }
  const total = search.pageData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className='flex items-center justify-between gap-4'>
      <p className='text-xs text-muted-foreground tabular-nums'>
        {totalPages > 1
          ? t('pagedTotal', {
              count: total,
              page: search.page + 1,
              pages: totalPages,
            })
          : t('total', { count: total })}
      </p>
      {totalPages > 1 && (
        <div className='flex gap-1'>
          <Button
            variant='outline'
            size='icon-sm'
            aria-label={t('previousPage')}
            disabled={disabled || search.page === 0}
            onClick={() => search.setPage((page) => Math.max(0, page - 1))}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            aria-label={t('nextPage')}
            disabled={disabled || search.page >= totalPages - 1}
            onClick={() =>
              search.setPage((page) => Math.min(totalPages - 1, page + 1))
            }
          >
            <ChevronRightIcon />
          </Button>
        </div>
      )}
    </div>
  )
}

export function WorkflowRelevanceBadge({ score }: { score: number }) {
  const t = useTranslations('WorkflowSearch')
  const intensity = Math.max(0, Math.min(1, score))
  return (
    <span
      className='inline-flex h-5 shrink-0 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-2 text-[11px] font-medium text-primary tabular-nums'
      title={`${t('relevance')} · ${t('scoreHint')}`}
    >
      <span className='sr-only'>{t('relevance')}</span>
      <span
        aria-hidden
        className='relative h-1 w-6 overflow-hidden rounded-full bg-primary/15'
      >
        <span
          className='absolute inset-y-0 left-0 rounded-full bg-primary'
          style={{ width: `${Math.round(intensity * 100)}%` }}
        />
      </span>
      {score.toFixed(2)}
    </span>
  )
}

/** Narrows a list item to a semantic search hit carrying a relevance score. */
export function relevanceOf(item: object): number | undefined {
  return 'relevance_score' in item && typeof item.relevance_score === 'number'
    ? item.relevance_score
    : undefined
}
