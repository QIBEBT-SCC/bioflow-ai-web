'use client'

import { ChevronDown, Download, FolderPlus, Plus, Search } from 'lucide-react'
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
import {
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import { ToolGroupSidebar } from '@/components/tool/tool-group-sidebar'
import { ToolList } from '@/components/tool/tool-list'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'

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
    <div className='relative w-full sm:w-64'>
      <Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
      <Input
        type='search'
        placeholder={placeholder}
        className='pl-8'
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

  const setSearchQuery = useCallback(
    (value: string) => updateParams({ q: value || null }, true),
    [updateParams],
  )
  const setSelectedGroupId = (groupId: number | null) =>
    updateParams({ group: groupId !== null ? String(groupId) : null }, true)
  const setCurrentPage = (page: number) =>
    updateParams({ page: page > 1 ? String(page) : null })

  return (
    <PageShell breadcrumbs={[{ label: t('title') }]}>
      <PageContainer>
        <PageHeader
          title={t('management')}
          description={t('description')}
          actions={
            <>
              <ToolSearchInput
                initialValue={searchQuery}
                placeholder={t('searchPlaceholder')}
                onSearch={setSearchQuery}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Plus className='size-4' />
                    {t('add')}
                    <ChevronDown className='size-4 opacity-70' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-48'>
                  <DropdownMenuItem asChild>
                    <Link href='/tool/add'>
                      <Plus className='size-4' />
                      {t('addTool')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FolderPlus className='size-4' />
                    {t('createGroup')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Download className='size-4' />
                    {t('importTool')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />

        <div className='flex flex-col gap-6 md:flex-row'>
          <ToolGroupSidebar
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
          />

          <section className='min-w-0 flex-1 space-y-4'>
            <h2 className='text-sm font-medium text-muted-foreground'>
              {selectedGroupId === null ? t('allTools') : t('groupTools')}
            </h2>
            <ToolList
              searchQuery={searchQuery}
              selectedGroupId={selectedGroupId}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </section>
        </div>
      </PageContainer>
    </PageShell>
  )
}
