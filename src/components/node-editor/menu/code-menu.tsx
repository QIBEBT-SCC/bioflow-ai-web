'use client'

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
  SearchIcon,
  XIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { getCode } from '@/app/actions/code'
import { CodeTypeBadge } from '@/components/code/code-type-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useCodeList } from '@/hooks/use-code'
import type { CodeInfo, CodeNodeType } from '@/types/code'

const PAGE_SIZE = 20

interface CodeMenuProps {
  onClose: () => void
  onSelectCode: (code: CodeInfo) => void
}

export function CodeMenu({ onClose, onSelectCode }: CodeMenuProps) {
  const t = useTranslations('editor.menu')
  const [query, setQuery] = useState('')
  const [nodeType, setNodeType] = useState<CodeNodeType | undefined>()
  const [page, setPage] = useState(1)
  const [selectingUid, setSelectingUid] = useState<string | null>(null)
  const { data, isLoading, isError } = useCodeList({
    query: query.trim(),
    nodeType,
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  })
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))

  const selectCode = async (uid: string) => {
    if (selectingUid) return
    setSelectingUid(uid)
    try {
      const code = await getCode(uid)
      onSelectCode(code)
      onClose()
    } catch (error) {
      toast.error(
        t('code_load_error', {
          error: error instanceof Error ? error.message : String(error),
        }),
      )
    } finally {
      setSelectingUid(null)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[8vh] animate-in fade-in'>
      <div className='flex max-h-[85vh] w-full max-w-4xl flex-col rounded-lg bg-background shadow-xl animate-in zoom-in-95'>
        <div className='flex shrink-0 items-center justify-between border-b p-4'>
          <h2 className='text-xl font-semibold'>{t('select_code')}</h2>
          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='rounded-full'
            disabled={selectingUid !== null}
          >
            <XIcon className='size-5' />
          </Button>
        </div>

        <div className='flex shrink-0 flex-col gap-3 border-b p-4 sm:flex-row'>
          <div className='relative flex-1'>
            <SearchIcon className='absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground' />
            <Input
              type='search'
              placeholder={t('search_codes')}
              className='pl-10'
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
          </div>
          <Select
            value={nodeType ?? 'all'}
            onValueChange={(value) => {
              setNodeType(value === 'all' ? undefined : (value as CodeNodeType))
              setPage(1)
            }}
          >
            <SelectTrigger className='w-full sm:w-40'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>{t('all')}</SelectItem>
              <SelectItem value='code_bash'>Bash</SelectItem>
              <SelectItem value='code_python'>Python</SelectItem>
              <SelectItem value='code_R'>R</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='min-h-72 flex-1 overflow-y-auto p-4'>
          {isLoading ? (
            <div className='space-y-3'>
              {['code-1', 'code-2', 'code-3', 'code-4'].map((id) => (
                <Skeleton key={id} className='h-20 w-full' />
              ))}
            </div>
          ) : isError ? (
            <div className='py-12 text-center text-sm text-destructive'>
              {t('code_load_error', { error: '' })}
            </div>
          ) : data?.data.length ? (
            <div className='grid gap-3'>
              {data.data.map((code) => (
                <button
                  key={code.uid}
                  type='button'
                  className='w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent disabled:cursor-wait disabled:opacity-60'
                  onClick={() => selectCode(code.uid)}
                  disabled={selectingUid !== null}
                >
                  <div className='mb-1 flex items-center justify-between gap-3'>
                    <span className='font-medium'>{code.name}</span>
                    {selectingUid === code.uid ? (
                      <Loader2Icon className='size-4 animate-spin' />
                    ) : (
                      <CodeTypeBadge nodeType={code.node_type} />
                    )}
                  </div>
                  <p className='line-clamp-2 text-sm text-muted-foreground'>
                    {code.description}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className='py-12 text-center text-sm text-muted-foreground'>
              {t('no_codes_found')}
            </div>
          )}
        </div>

        <div className='flex shrink-0 items-center justify-between border-t p-4'>
          <span className='text-sm text-muted-foreground'>
            {t('code_page', { page, total: totalPages })}
          </span>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeftIcon className='size-4' />
              {t('previous')}
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page >= totalPages || isLoading}
            >
              {t('next')}
              <ChevronRightIcon className='size-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
