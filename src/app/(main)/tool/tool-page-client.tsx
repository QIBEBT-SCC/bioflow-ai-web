'use client'

import {
  ChevronDown,
  Download,
  Filter,
  FolderPlus,
  Grid,
  List,
  Plus,
  Search,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  type ChangeEvent,
  type CompositionEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { ToolGroupSidebar } from '@/components/tool/tool-group-sidebar'
import { ToolList } from '@/components/tool/tool-list'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

const SEARCH_DEBOUNCE_MS = 300

function ToolSearchInput({
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

  // Keep newer drafts intact when the URL catches up, but honor back/forward navigation.
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
    if (!isComposingRef.current) {
      scheduleSearch(nextValue)
    }
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
    <div className='relative flex-1 sm:flex-initial'>
      <Search className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
      <Input
        type='search'
        placeholder={placeholder}
        className='pl-8 w-full sm:w-62.5'
        value={value}
        onChange={updateSearchDraft}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
      />
    </div>
  )
}

export default function ToolsPage() {
  const t = useTranslations('tool.Page')
  const { replace } = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const getSearchParam = searchParams.get.bind(searchParams)

  const viewMode: 'list' | 'grid' =
    getSearchParam('view') === 'grid' ? 'grid' : 'list'
  const searchQuery = getSearchParam('q') ?? ''
  const groupParam = getSearchParam('group')
  const selectedGroupId = groupParam ? Number(groupParam) : null
  const currentPage = Number(getSearchParam('page') ?? '1')

  const updateParams = useCallback(
    (updates: Record<string, string | null>, resetPage = false) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      if (resetPage) {
        params.delete('page')
      }
      const query = params.toString()
      replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    },
    [pathname, replace, searchParams],
  )

  const setViewMode = (mode: 'list' | 'grid') =>
    updateParams({ view: mode === 'grid' ? 'grid' : null })
  const setSearchQuery = useCallback(
    (value: string) => updateParams({ q: value || null }, true),
    [updateParams],
  )
  const setSelectedGroupId = (groupId: number | null) =>
    updateParams({ group: groupId !== null ? String(groupId) : null }, true)
  const setCurrentPage = (page: number) =>
    updateParams({ page: page > 1 ? String(page) : null })

  return (
    <SidebarInset className='h-screen overflow-hidden'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center gap-2 px-4 h-12 bg-background'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2! h-4!' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbPage>{t('title')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className='flex-1 overflow-y-auto'>
        <div className='container mx-auto py-6'>
          {/* 顶部操作栏 */}
          <div className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6'>
            <h1 className='text-2xl font-semibold'>{t('management')}</h1>
            <div className='flex gap-2 w-full sm:w-auto'>
              <ToolSearchInput
                initialValue={searchQuery}
                placeholder={t('searchPlaceholder')}
                onSearch={setSearchQuery}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline'>
                    <Plus className='size-4 mr-2' />
                    {t('add')}
                    <ChevronDown className='size-4 ml-2' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <Link href='/tool/add'>
                    <DropdownMenuItem>
                      <Plus className='size-4 mr-2' />
                      {t('addTool')}
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem>
                    <FolderPlus className='size-4 mr-2' />
                    {t('createGroup')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Download className='size-4 mr-2' />
                    {t('importTool')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className='flex flex-col md:flex-row gap-6'>
            {/* 侧边栏 - 分组筛选 */}
            <ToolGroupSidebar
              selectedGroupId={selectedGroupId}
              onSelectGroup={setSelectedGroupId}
            />

            {/* 主内容区 */}
            <main className='flex-1 space-y-6'>
              {/* 视图切换和筛选 */}
              <div className='flex justify-between items-center'>
                <h2 className='text-lg font-medium'>
                  {selectedGroupId === null ? t('allTools') : t('groupTools')}
                </h2>
                <div className='flex items-center gap-2'>
                  <Button variant='outline' size='sm'>
                    <Filter className='size-4 mr-2' />
                    {t('filter')}
                  </Button>
                  <div className='border rounded-md flex'>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size='sm'
                      className='rounded-r-none'
                      onClick={() => setViewMode('list')}
                    >
                      <List className='size-4' />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size='sm'
                      className='rounded-l-none'
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className='size-4' />
                    </Button>
                  </div>
                </div>
              </div>

              {/* 工具列表 */}
              <ToolList
                viewMode={viewMode}
                searchQuery={searchQuery}
                selectedGroupId={selectedGroupId}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </main>
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}
