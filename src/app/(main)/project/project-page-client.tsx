'use client'

import {
  ChevronDownIcon,
  Grid2X2Icon,
  ListIcon,
  SearchIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
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

export default function ProjectsPageClient() {
  const t = useTranslations('Project.list')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<ProjectSort>('recent')
  const [viewMode, setViewMode] = useState<ProjectViewMode>('list')

  return (
    <SidebarInset>
      <div className='flex min-w-0 flex-1 flex-col'>
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

                <Tabs defaultValue='all' className='w-full'>
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
                    />
                  </TabsContent>
                  <TabsContent value='starred' className='mt-6'>
                    <StarredProjectTable
                      search={search}
                      sort={sort}
                      viewMode={viewMode}
                    />
                  </TabsContent>
                  <TabsContent value='my' className='mt-6'>
                    <MyProjectTable
                      search={search}
                      sort={sort}
                      viewMode={viewMode}
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
