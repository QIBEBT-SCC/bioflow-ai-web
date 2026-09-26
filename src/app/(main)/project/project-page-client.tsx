'use client'

import Cookies from 'js-cookie'
import {
  ChevronDownIcon,
  Grid2X2Icon,
  ListIcon,
  SearchIcon,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  type ChangeEvent,
  type CompositionEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import { NewProjectDialog } from '@/components/project/new-project-dialog'
import {
  AllProjectTable,
  MyProjectTable,
  type ProjectSort,
  type ProjectViewMode,
  StarredProjectTable,
} from '@/components/project/project-list'
import { TagList } from '@/components/project/tag-list'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth-query'
import {
  PROJECT_SORT_COOKIE,
  PROJECT_VIEW_COOKIE,
} from '@/lib/project-preferences'
import { UserRole } from '@/types/auth'

const SEARCH_DEBOUNCE_MS = 300

function ProjectSearchInput({
  initialValue,
  placeholder,
  onSearch,
}: {
  initialValue: string
  placeholder: string
  onSearch: (value: string) => void
}) {
  const [value, setValue] = useState(initialValue)
  const isComposingRef = useRef(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousInitialValueRef = useRef(initialValue)
  const lastSubmittedValueRef = useRef(initialValue)
  const onSearchRef = useRef(onSearch)
  onSearchRef.current = onSearch

  // Preserve newer drafts while navigation catches up, but honor back/forward.
  if (initialValue !== previousInitialValueRef.current) {
    previousInitialValueRef.current = initialValue
    if (initialValue !== lastSubmittedValueRef.current) {
      lastSubmittedValueRef.current = initialValue
      setValue(initialValue)
    }
  }

  const cancelPendingSearch = useCallback(() => {
    if (searchTimerRef.current !== null) {
      clearTimeout(searchTimerRef.current)
      searchTimerRef.current = null
    }
  }, [])

  const scheduleSearch = useCallback(
    (nextValue: string) => {
      cancelPendingSearch()
      searchTimerRef.current = setTimeout(() => {
        searchTimerRef.current = null
        lastSubmittedValueRef.current = nextValue
        onSearchRef.current(nextValue)
      }, SEARCH_DEBOUNCE_MS)
    },
    [cancelPendingSearch],
  )

  useEffect(() => cancelPendingSearch, [cancelPendingSearch])

  const updateSearchDraft = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value
    setValue(nextValue)
    if (!isComposingRef.current) scheduleSearch(nextValue)
  }

  const handleCompositionStart = () => {
    isComposingRef.current = true
    cancelPendingSearch()
  }

  const handleCompositionEnd = (event: CompositionEvent<HTMLInputElement>) => {
    const nextValue = event.currentTarget.value
    isComposingRef.current = false
    setValue(nextValue)
    scheduleSearch(nextValue)
  }

  return (
    <div className='relative w-full sm:w-64'>
      <SearchIcon className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
      <Input
        type='search'
        maxLength={200}
        placeholder={placeholder}
        value={value}
        onChange={updateSearchDraft}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        className='pl-8'
      />
    </div>
  )
}

export default function ProjectsPageClient({
  activeTab,
  search,
  selectedTagId,
  currentPage,
  projectListHref,
  initialSort,
  initialViewMode,
}: {
  activeTab: 'all' | 'starred' | 'my'
  search: string
  selectedTagId: number | null
  currentPage: number
  projectListHref: string
  initialSort: ProjectSort
  initialViewMode: ProjectViewMode
}) {
  const t = useTranslations('Project.list')
  const { user } = useAuth()
  const { replace } = useRouter()
  const pathname = usePathname()
  const [sort, setSortPreference] = useState(initialSort)
  const [viewMode, setViewModePreference] = useState(initialViewMode)
  const currentQuery = projectListHref.split('?')[1] ?? ''

  const updateParams = useCallback(
    (updates: Record<string, string | null>, resetPage = false) => {
      const params = new URLSearchParams(currentQuery)
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      if (resetPage) params.delete('page')

      const nextQuery = params.toString()
      replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      })
    },
    [currentQuery, pathname, replace],
  )

  const setActiveTab = (tab: string) =>
    updateParams({ tab: tab === 'all' ? null : tab }, true)
  const setSearch = (value: string) => updateParams({ q: value || null }, true)
  const setSelectedTag = (tagId: number | null) =>
    updateParams({ tag: tagId ? String(tagId) : null }, true)
  const setSort = (value: ProjectSort) => {
    setSortPreference(value)
    Cookies.set(PROJECT_SORT_COOKIE, value, {
      expires: 365,
      path: '/',
      sameSite: 'lax',
    })
    updateParams({}, true)
  }
  const setViewMode = (value: ProjectViewMode) => {
    setViewModePreference(value)
    Cookies.set(PROJECT_VIEW_COOKIE, value, {
      expires: 365,
      path: '/',
      sameSite: 'lax',
    })
  }
  const setCurrentPage = (page: number) =>
    updateParams({ page: page > 1 ? String(page) : null })

  return (
    <PageShell breadcrumbs={[{ label: t('breadcrumb') }]}>
      <PageContainer>
        <PageHeader
          title={t('title')}
          description={t('subtitle')}
          actions={user && user.role >= UserRole.MEMBER && <NewProjectDialog />}
        />
        <div className='flex flex-col gap-6 md:flex-row'>
          <TagList selectedTagId={selectedTagId} onTagChange={setSelectedTag} />
          <section className='min-w-0 flex-1'>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='w-full'
            >
              <div className='flex flex-col justify-between gap-4 xl:flex-row xl:items-center'>
                <TabsList>
                  <TabsTrigger value='all'>{t('tabs.all')}</TabsTrigger>
                  <TabsTrigger value='starred'>{t('tabs.starred')}</TabsTrigger>
                  <TabsTrigger value='my'>{t('tabs.my')}</TabsTrigger>
                </TabsList>

                <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row'>
                  <ProjectSearchInput
                    initialValue={search}
                    placeholder={t('searchPlaceholder')}
                    onSearch={setSearch}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='outline'>
                        {t(`sort.${sort}`)}
                        <ChevronDownIcon className='size-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      {(['recent', 'nameAsc', 'nameDesc'] as const).map(
                        (option) => (
                          <DropdownMenuItem
                            key={option}
                            onSelect={() => setSort(option)}
                          >
                            {t(`sort.${option}`)}
                          </DropdownMenuItem>
                        ),
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className='flex rounded-md border'>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size='icon'
                      className='rounded-r-none'
                      onClick={() => setViewMode('list')}
                      aria-label={t('view.list')}
                    >
                      <ListIcon className='size-4' />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size='icon'
                      className='rounded-l-none'
                      onClick={() => setViewMode('grid')}
                      aria-label={t('view.grid')}
                    >
                      <Grid2X2Icon className='size-4' />
                    </Button>
                  </div>
                </div>
              </div>

              <TabsContent value='all' className='mt-4'>
                <AllProjectTable
                  search={search}
                  tagId={selectedTagId}
                  sort={sort}
                  viewMode={viewMode}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  projectListHref={projectListHref}
                />
              </TabsContent>
              <TabsContent value='starred' className='mt-4'>
                <StarredProjectTable
                  search={search}
                  tagId={selectedTagId}
                  sort={sort}
                  viewMode={viewMode}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  projectListHref={projectListHref}
                />
              </TabsContent>
              <TabsContent value='my' className='mt-4'>
                <MyProjectTable
                  search={search}
                  tagId={selectedTagId}
                  sort={sort}
                  viewMode={viewMode}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  projectListHref={projectListHref}
                />
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </PageContainer>
    </PageShell>
  )
}
