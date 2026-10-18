'use client'

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DatabaseIcon,
  PlusIcon,
  SearchIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { FilterPanel } from '@/components/layout/filter-panel'
import { PageHeader } from '@/components/layout/page-shell'
import { DatabaseDetail } from '@/components/resource/databases/database-detail'
import { DatabaseFormDialog } from '@/components/resource/databases/database-form-dialog'
import { DatabasesList } from '@/components/resource/databases/databases-list'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useDBList, useSearchDB } from '@/hooks/use-resource'

const PAGE_SIZE = 10

export function DatabasesManager() {
  const t = useTranslations('resource')
  const [searchQuery, setSearchQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [selectedDbId, setSelectedDbId] = useState<number | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const trimmedQuery = searchQuery.trim()
  const isSearching = trimmedQuery.length > 0
  const [prevQuery, setPrevQuery] = useState(trimmedQuery)
  if (trimmedQuery !== prevQuery) {
    setPrevQuery(trimmedQuery)
    setOffset(0)
  }

  const listQuery = useDBList(offset, PAGE_SIZE, !isSearching)
  const searchQueryResult = useSearchDB(trimmedQuery, offset, PAGE_SIZE)
  const activeQuery = isSearching ? searchQueryResult : listQuery
  const databases = activeQuery.data?.data ?? []
  const total = activeQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  // Fall back to the first visible entry until the user picks one.
  const activeDbId = selectedDbId ?? databases[0]?.id ?? null
  const hasNoDatabases =
    !isSearching && !listQuery.isLoading && listQuery.data?.total === 0

  const addButton = (
    <Button onClick={() => setIsAddDialogOpen(true)}>
      <PlusIcon className='size-4' />
      {t('add_database')}
    </Button>
  )

  const addDialog = (
    <DatabaseFormDialog
      open={isAddDialogOpen}
      onOpenChange={setIsAddDialogOpen}
      onSaved={(database) => setSelectedDbId(database.id)}
    />
  )

  if (hasNoDatabases) {
    return (
      <>
        <PageHeader title={t('title')} description={t('description')} />
        <Empty className='border border-dashed'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <DatabaseIcon />
            </EmptyMedia>
            <EmptyTitle>{t('empty_title')}</EmptyTitle>
            <EmptyDescription>{t('empty_help')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{addButton}</EmptyContent>
        </Empty>
        {addDialog}
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={addButton}
      />

      <div className='flex flex-col gap-6 md:flex-row md:items-start'>
        <FilterPanel
          className='md:w-72'
          title={t('database_list')}
          footer={
            total > PAGE_SIZE && (
              <div className='flex items-center justify-between gap-2'>
                <span className='text-xs text-muted-foreground tabular-nums'>
                  {t('page_indicator', {
                    current: currentPage,
                    total_pages: totalPages,
                  })}
                </span>
                <div className='flex gap-1'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-7'
                    aria-label={t('prev_page')}
                    onClick={() => setOffset((prev) => prev - PAGE_SIZE)}
                    disabled={offset === 0}
                  >
                    <ChevronLeftIcon className='size-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-7'
                    aria-label={t('next_page')}
                    onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
                    disabled={offset + PAGE_SIZE >= total}
                  >
                    <ChevronRightIcon className='size-4' />
                  </Button>
                </div>
              </div>
            )
          }
        >
          <div className='relative mb-2 px-1'>
            <SearchIcon className='pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder={t('search_database')}
              aria-label={t('search_database')}
              className='h-8 pl-8'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {activeQuery.isLoading ? (
            <div className='space-y-1 px-1' aria-busy='true'>
              <span className='sr-only'>{t('loading')}</span>
              {Array.from({ length: 4 }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
                <Skeleton key={i} className='h-11 rounded-md' />
              ))}
            </div>
          ) : databases.length > 0 ? (
            <DatabasesList
              databases={databases}
              selectedDbId={activeDbId}
              onSelectDatabase={setSelectedDbId}
            />
          ) : (
            <p className='px-2 py-6 text-center text-sm text-muted-foreground'>
              {t('search_empty', { query: trimmedQuery })}
            </p>
          )}
        </FilterPanel>

        <section className='min-w-0 flex-1'>
          {activeDbId !== null ? (
            <DatabaseDetail
              key={activeDbId}
              databaseId={activeDbId}
              onDelete={() => setSelectedDbId(null)}
            />
          ) : (
            !activeQuery.isLoading && (
              <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
                {t('no_database_selected')}
              </div>
            )
          )}
        </section>
      </div>

      {addDialog}
    </>
  )
}
