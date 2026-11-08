'use client'

import {
  BrainIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { ImagePagination } from '@/components/image/image-pagination'
import {
  DeleteToolMemoryDialog,
  ToolMemoryDetailSheet,
  ToolMemoryFormDialog,
  ToolPicker,
} from '@/components/tool/tool-memory-dialogs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTool } from '@/hooks/use-tool'
import { useToolMemories } from '@/hooks/use-tool-memory'
import type { ToolMemoryListItem } from '@/types/tool-memory'

const PAGE_SIZE = 20

type FormState =
  | { mode: 'create' }
  | { mode: 'edit'; memory: ToolMemoryListItem }

export function ToolMemoryManagement() {
  const t = useTranslations('tool.Memory')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const toolUid = useSearchParams().get('tool') ?? undefined
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState<ToolMemoryListItem | null>(null)
  const [deleting, setDeleting] = useState<ToolMemoryListItem | null>(null)
  const [form, setForm] = useState<FormState | null>(null)

  const { data, isLoading, isError } = useToolMemories(
    toolUid,
    (page - 1) * PAGE_SIZE,
    PAGE_SIZE,
  )
  const { data: filterTool } = useTool(toolUid ?? '')
  const memories = data?.data ?? []
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))
  const filterOption = toolUid
    ? { uid: toolUid, name: filterTool?.name ?? t('unknown_tool') }
    : null

  const setFilter = (uid?: string) => {
    setPage(1)
    router.replace(uid ? `${pathname}?tool=${uid}` : pathname)
  }

  const openEdit = (memory: ToolMemoryListItem) => {
    setViewing(null)
    setForm({ mode: 'edit', memory })
  }

  const openDelete = (memory: ToolMemoryListItem) => {
    setViewing(null)
    setDeleting(memory)
  }

  const handleDeleted = () => {
    setDeleting(null)
    // The last row of a trailing page leaves nothing to show on that page.
    if (memories.length === 1 && page > 1) setPage(page - 1)
  }

  const formTool =
    form?.mode === 'edit'
      ? { uid: form.memory.tool_uid, name: form.memory.tool_name }
      : filterOption

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-2'>
          <ToolPicker
            value={filterOption}
            onChange={(tool) => setFilter(tool.uid)}
            placeholder={t('all_tools')}
            className='min-w-0 flex-1 sm:w-64 sm:flex-none'
          />
          {toolUid && (
            <Button
              variant='ghost'
              size='icon'
              aria-label={t('clear_filter')}
              onClick={() => setFilter()}
            >
              <XIcon className='size-4' />
            </Button>
          )}
          {data && (
            <span className='shrink-0 text-xs tabular-nums text-muted-foreground'>
              {t('total', { count: data.total })}
            </span>
          )}
        </div>
        <Button onClick={() => setForm({ mode: 'create' })}>
          <PlusIcon className='size-4' />
          {t('add')}
        </Button>
      </div>

      {isLoading && (
        <div aria-busy='true'>
          <span className='sr-only'>{t('loading')}</span>
          <Skeleton className='h-64 rounded-xl' />
        </div>
      )}

      {isError && (
        <Alert variant='destructive'>
          <AlertDescription>{t('list_failed')}</AlertDescription>
        </Alert>
      )}

      {data && memories.length === 0 && (
        <Empty className='border border-dashed'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <BrainIcon />
            </EmptyMedia>
            <EmptyTitle>{t('empty_title')}</EmptyTitle>
            <EmptyDescription>
              {t(toolUid ? 'empty_tool_description' : 'empty_description')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {memories.length > 0 && (
        <div className='overflow-hidden rounded-xl border bg-card'>
          <Table className='table-fixed'>
            <TableHeader>
              <TableRow>
                <TableHead>{t('memory')}</TableHead>
                <TableHead className='w-28 sm:w-44'>{t('tool')}</TableHead>
                <TableHead className='hidden w-32 lg:table-cell'>
                  {t('creator')}
                </TableHead>
                <TableHead className='hidden w-32 lg:table-cell'>
                  {t('created_at')}
                </TableHead>
                <TableHead className='w-14'>
                  <span className='sr-only'>{t('actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memories.map((memory) => (
                <TableRow key={memory.uid}>
                  <TableCell className='whitespace-normal'>
                    <button
                      type='button'
                      className='cursor-pointer text-left font-medium break-words hover:text-primary'
                      onClick={() => setViewing(memory)}
                    >
                      {memory.description}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/tool/${memory.tool_uid}`}
                      className='block truncate text-muted-foreground hover:text-primary'
                    >
                      {memory.tool_name}
                    </Link>
                  </TableCell>
                  <TableCell className='hidden truncate text-muted-foreground lg:table-cell'>
                    {memory.creator_username ?? t('unknown_creator')}
                  </TableCell>
                  <TableCell className='hidden text-muted-foreground tabular-nums lg:table-cell'>
                    {new Date(memory.created_at).toLocaleDateString(locale)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          aria-label={t('actions')}
                        >
                          <MoreHorizontalIcon className='size-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem onSelect={() => openEdit(memory)}>
                          <PencilIcon />
                          {t('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant='destructive'
                          onSelect={() => openDelete(memory)}
                        >
                          <Trash2Icon />
                          {t('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <ImagePagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      <ToolMemoryDetailSheet
        memory={viewing}
        onClose={() => setViewing(null)}
        onEdit={openEdit}
        onDelete={openDelete}
      />
      {form && (
        <ToolMemoryFormDialog
          memoryUid={form.mode === 'edit' ? form.memory.uid : undefined}
          tool={formTool}
          onClose={() => setForm(null)}
        />
      )}
      <DeleteToolMemoryDialog
        memory={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
