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
import { useCallback, useState } from 'react'
import { NewProjectDialog } from '@/components/project/new-project-dialog'
import {
  AllProjectTable,
  MyProjectTable,
  type ProjectSort,
  type ProjectViewMode,
  StarredProjectTable,
} from '@/components/project/project-list'
import { TagList } from '@/components/project/tag-list'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  PROJECT_SORT_COOKIE,
  PROJECT_VIEW_COOKIE,
} from '@/lib/project-preferences'

export default function ProjectsPageClient({
  activeTab,
  search,
  currentPage,
  projectListHref,
  initialSort,
  initialViewMode,
}: {
  activeTab: 'all' | 'starred' | 'my'
  search: string
  currentPage: number
  projectListHref: string
  initialSort: ProjectSort
  initialViewMode: ProjectViewMode
}) {
  const t = useTranslations('Project.list')
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
    <SidebarInset className='h-screen overflow-hidden'>
      <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
        <header className='shrink-0 border-b'>
          <div className='flex h-12 items-center gap-2 bg-background px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2! h-4!' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbPage>{t('breadcrumb')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className='flex-1 overflow-auto'>
          <div className='container mx-auto px-4 py-6'>
            <div className='flex flex-col gap-6 md:flex-row'>
              <TagList />
              <main className='min-w-0 flex-1 space-y-6'>
                <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
                  <div>
                    <h1 className='text-2xl font-semibold'>{t('title')}</h1>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      {t('subtitle')}
                    </p>
                  </div>
                  <NewProjectDialog />
                </div>

                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className='w-full'
                >
                  <div className='flex flex-col justify-between gap-4 xl:flex-row xl:items-center'>
                    <TabsList>
                      <TabsTrigger value='all'>{t('tabs.all')}</TabsTrigger>
                      <TabsTrigger value='starred'>
                        {t('tabs.starred')}
                      </TabsTrigger>
                      <TabsTrigger value='my'>{t('tabs.my')}</TabsTrigger>
                    </TabsList>

                    <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row'>
                      <div className='relative sm:w-72'>
                        <SearchIcon className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
                        <Input
                          type='search'
                          placeholder={t('searchPlaceholder')}
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          className='pl-8'
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='outline'>
                            {t(`sort.${sort}`)}
                            <ChevronDownIcon className='ml-2 size-4' />
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

                  <TabsContent value='all' className='mt-6'>
                    <AllProjectTable
                      search={search}
                      sort={sort}
                      viewMode={viewMode}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                      projectListHref={projectListHref}
                    />
                  </TabsContent>
                  <TabsContent value='starred' className='mt-6'>
                    <StarredProjectTable
                      search={search}
                      sort={sort}
                      viewMode={viewMode}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                      projectListHref={projectListHref}
                    />
                  </TabsContent>
                  <TabsContent value='my' className='mt-6'>
                    <MyProjectTable
                      search={search}
                      sort={sort}
                      viewMode={viewMode}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                      projectListHref={projectListHref}
                    />
                  </TabsContent>
                </Tabs>
              </main>
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}
