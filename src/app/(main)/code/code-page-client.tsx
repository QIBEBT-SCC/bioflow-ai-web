'use client'

import { ChevronDownIcon, PlusIcon, SearchIcon } from 'lucide-react'
import Link from 'next/link'
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
import { CodeList } from '@/components/code/code-list'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import type { CodeNodeType } from '@/types/code'

const SEARCH_DEBOUNCE_MS = 300

function CodeSearchInput({
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSearchRef = useRef(onSearch)
  onSearchRef.current = onSearch

  const cancelPendingSearch = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const scheduleSearch = useCallback(
    (nextValue: string) => {
      cancelPendingSearch()
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        onSearchRef.current(nextValue)
      }, SEARCH_DEBOUNCE_MS)
    },
    [cancelPendingSearch],
  )

  useEffect(() => cancelPendingSearch, [cancelPendingSearch])

  const updateSearchValue = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value
    setValue(nextValue)
    if (!isComposingRef.current) scheduleSearch(nextValue)
  }

  const handleCompositionEnd = (event: CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false
    setValue(event.currentTarget.value)
    scheduleSearch(event.currentTarget.value)
  }

  return (
    <div className='relative flex-1 sm:w-72 sm:flex-none'>
      <SearchIcon className='absolute top-2.5 left-2.5 size-4 text-muted-foreground' />
      <Input
        type='search'
        value={value}
        placeholder={placeholder}
        className='pl-8'
        onChange={updateSearchValue}
        onCompositionStart={() => {
          isComposingRef.current = true
          cancelPendingSearch()
        }}
        onCompositionEnd={handleCompositionEnd}
      />
    </div>
  )
}

export default function CodePageClient({
  query,
  nodeType,
  currentPage,
}: {
  query: string
  nodeType?: CodeNodeType
  currentPage: number
}) {
  const t = useTranslations('code.Page')
  const { replace } = useRouter()
  const pathname = usePathname()

  const updateParams = useCallback(
    (updates: Record<string, string | null>, resetPage = false) => {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (nodeType) params.set('type', nodeType)
      if (currentPage > 1) params.set('page', String(currentPage))
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value)
        else params.delete(key)
      }
      if (resetPage) params.delete('page')
      const nextQuery = params.toString()
      replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      })
    },
    [currentPage, nodeType, pathname, query, replace],
  )

  return (
    <SidebarInset className='h-screen overflow-hidden'>
      <header className='flex h-12 shrink-0 items-center gap-2 border-b px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2! h-4!' />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{t('title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className='flex-1 overflow-y-auto'>
        <div className='container mx-auto max-w-6xl py-6'>
          <div className='mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
            <div>
              <h1 className='text-2xl font-semibold'>{t('management')}</h1>
              <p className='mt-1 text-sm text-muted-foreground'>
                {t('description')}
              </p>
            </div>
            <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row'>
              <CodeSearchInput
                key={query}
                initialValue={query}
                placeholder={t('searchPlaceholder')}
                onSearch={(value) =>
                  updateParams({ q: value.trim() || null }, true)
                }
              />
              <Select
                value={nodeType ?? 'all'}
                onValueChange={(value) =>
                  updateParams({ type: value === 'all' ? null : value }, true)
                }
              >
                <SelectTrigger className='w-full sm:w-40'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>{t('allTypes')}</SelectItem>
                  <SelectItem value='code_bash'>Bash</SelectItem>
                  <SelectItem value='code_python'>Python</SelectItem>
                  <SelectItem value='code_R'>R</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <PlusIcon className='size-4' />
                    {t('add')}
                    <ChevronDownIcon className='size-4 opacity-70' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-52'>
                  <DropdownMenuItem asChild>
                    <Link href='/code/add?type=code_bash'>{t('addBash')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href='/code/add?type=code_python'>
                      {t('addPython')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href='/code/add?type=code_R'>{t('addR')}</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <CodeList
            query={query}
            nodeType={nodeType}
            currentPage={currentPage}
            onPageChange={(page) =>
              updateParams({ page: page > 1 ? String(page) : null })
            }
          />
        </div>
      </div>
    </SidebarInset>
  )
}
