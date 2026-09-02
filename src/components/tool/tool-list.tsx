'use client'

import {
  CopyIcon,
  MoreHorizontalIcon,
  NetworkIcon,
  Trash2Icon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { ToolUsageSheet } from '@/components/tool/tool-usage-sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  useDeleteTool,
  useGroupTools,
  useSearchTools,
  useToolList,
  useToolUsage,
} from '@/hooks/use-tool'
import type { SimpleToolInfo } from '@/types/tool'

// 根据标签名称获取对应的样式
function getTagStyle(tagName: string) {
  switch (tagName) {
    case 'AI Checked':
      return 'bg-green-50 text-green-600 border-green-200'
    case 'AI Unchecked':
      return 'bg-yellow-50 text-yellow-600 border-yellow-200'
    default:
      return 'bg-blue-50 text-blue-600 border-blue-200'
  }
}

interface ToolListProps {
  searchQuery?: string
  selectedGroupId?: number | null
  currentPage: number
  onPageChange: (page: number) => void
}

function getPageNumbers(totalPages: number, currentPage: number) {
  const pages: (number | string)[] = []
  const maxVisible = 5

  if (totalPages <= maxVisible) {
    for (let page = 1; page <= totalPages; page++) pages.push(page)
  } else if (currentPage <= 3) {
    pages.push(1, 2, 3, 4, '...', totalPages)
  } else if (currentPage >= totalPages - 2) {
    pages.push(1, '...')
    for (let page = totalPages - 3; page <= totalPages; page++) pages.push(page)
  } else {
    pages.push(
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages,
    )
  }

  return pages
}

function resolveToolListView({
  isSearching,
  isFiltering,
  searchResults,
  searchTotal,
  allGroupTools,
  allToolsList,
  allToolsTotal,
  offset,
  pageSize,
  isSearchLoading,
  isLoadingGroup,
  isLoadingAll,
}: {
  isSearching: boolean
  isFiltering: boolean
  searchResults: SimpleToolInfo[]
  searchTotal: number
  allGroupTools: SimpleToolInfo[]
  allToolsList: SimpleToolInfo[]
  allToolsTotal: number
  offset: number
  pageSize: number
  isSearchLoading: boolean
  isLoadingGroup: boolean
  isLoadingAll: boolean
}) {
  if (isSearching) {
    return {
      tools: searchResults,
      isLoading: isSearchLoading,
      totalPages: Math.ceil(searchTotal / pageSize),
    }
  }
  if (isFiltering) {
    return {
      tools: allGroupTools.slice(offset, offset + pageSize),
      isLoading: isLoadingGroup,
      totalPages: Math.ceil(allGroupTools.length / pageSize),
    }
  }
  return {
    tools: allToolsList,
    isLoading: isLoadingAll,
    totalPages: Math.ceil(allToolsTotal / pageSize),
  }
}

export function ToolList({
  searchQuery = '',
  selectedGroupId = null,
  currentPage,
  onPageChange,
}: ToolListProps) {
  const t = useTranslations('tool.List')
  const [deleteConfirmTool, setDeleteConfirmTool] = useState<{
    uid: string
    name: string
  } | null>(null)
  const [usageTool, setUsageTool] = useState<{
    uid: string
    name: string
  } | null>(null)
  const pageSize = 12
  const offset = (currentPage - 1) * pageSize

  const { push } = useRouter()
  const deleteToolMutation = useDeleteTool()

  const handleDeleteTool = () => {
    if (!deleteConfirmTool) return
    deleteToolMutation.mutate(deleteConfirmTool.uid, {
      onSuccess: () => {
        setDeleteConfirmTool(null)
      },
    })
  }

  const handleCopyTool = (uid: string) => {
    push(`/tool/add?copy=${uid}&step=2`)
  }

  // 根据搜索条件和分组选择，决定使用哪个 hook
  const isSearching = searchQuery.trim() !== ''
  const isFiltering = selectedGroupId !== null && !isSearching // 搜索优先级高于分组

  // 搜索工具（服务端分页）
  const { data: searchPage, isLoading: isSearchLoading } = useSearchTools(
    searchQuery.trim(),
    offset,
    pageSize,
  )
  const searchResults = searchPage?.data ?? []
  const searchTotal = searchPage?.total ?? 0

  // 分组工具（无服务端分页，需要客户端处理）
  const { data: allGroupTools = [], isLoading: isLoadingGroup } = useGroupTools(
    isFiltering ? (selectedGroupId ?? undefined) : undefined,
  )

  // 所有工具（服务端分页）
  const { data: allToolsPage, isLoading: isLoadingAll } = useToolList(
    !isSearching && !isFiltering ? offset : 0,
    pageSize,
  )
  const allToolsList = allToolsPage?.data ?? []
  const allToolsTotal = allToolsPage?.total ?? 0

  const { tools, isLoading, totalPages } = resolveToolListView({
    isSearching,
    isFiltering,
    searchResults,
    searchTotal,
    allGroupTools,
    allToolsList,
    allToolsTotal,
    offset,
    pageSize,
    isSearchLoading,
    isLoadingGroup,
    isLoadingAll,
  })
  const safeTotalPages = Math.max(1, totalPages)

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <div className='animate-spin rounded-full size-8 border-b-2 border-primary mx-auto mb-2'></div>
          <p className='text-muted-foreground'>{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <ToolGridView
        tools={tools}
        currentPage={currentPage}
        totalPages={safeTotalPages}
        pageNumbers={getPageNumbers(safeTotalPages, currentPage)}
        onPageChange={onPageChange}
        onCopy={handleCopyTool}
        onViewUsage={(uid, name) => setUsageTool({ uid, name })}
        onDelete={(uid, name) => setDeleteConfirmTool({ uid, name })}
        t={t}
      />
      <DeleteToolDialog
        tool={deleteConfirmTool}
        onClose={() => setDeleteConfirmTool(null)}
        onConfirm={handleDeleteTool}
        onViewUsage={(tool) => {
          setDeleteConfirmTool(null)
          setUsageTool(tool)
        }}
      />
      <ToolUsageSheet
        key={usageTool?.uid}
        tool={usageTool}
        open={!!usageTool}
        onOpenChange={(open) => !open && setUsageTool(null)}
      />
    </>
  )
}

interface ToolViewProps {
  tools: SimpleToolInfo[]
  currentPage: number
  totalPages: number
  pageNumbers: (number | string)[]
  onPageChange: (page: number) => void
  onCopy: (uid: string) => void
  onViewUsage: (uid: string, name: string) => void
  onDelete: (uid: string, name: string) => void
  t: ReturnType<typeof useTranslations>
}

function ToolGridView({
  tools,
  currentPage,
  totalPages,
  pageNumbers,
  onPageChange,
  onCopy,
  onViewUsage,
  onDelete,
  t,
}: ToolViewProps) {
  return (
    <div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {tools.map((tool: SimpleToolInfo) => (
          <Card key={tool.uid} className='py-0 gap-0'>
            <CardContent className='p-4'>
              <div className='flex justify-between items-start mb-2'>
                <Link
                  href={`/tool/${tool.uid}`}
                  className='font-medium hover:underline'
                >
                  {tool.name}
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon' className='size-8'>
                      <MoreHorizontalIcon className='size-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      onClick={() => onViewUsage(tool.uid, tool.name)}
                    >
                      <NetworkIcon className='size-4 mr-2' />
                      {t('viewUsage')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCopy(tool.uid)}>
                      <CopyIcon className='size-4 mr-2' />
                      {t('copyTool')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className='text-destructive'
                      onClick={() => onDelete(tool.uid, tool.name)}
                    >
                      <Trash2Icon className='size-4 mr-2' />
                      {t('deleteTool')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className='text-sm text-muted-foreground mb-3 line-clamp-2'>
                {tool.description || t('noDescription')}
              </p>
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span className='truncate'>
                  {tool.image.image.registry}/{tool.image.image.namespace}/
                  {tool.image.image.repository}:{tool.image.image.tag}
                </span>
              </div>
              <div className='flex flex-wrap gap-1 mt-3'>
                {tool.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant='outline'
                    className={getTagStyle(tag.name)}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {tool.tags.length > 3 && (
                  <Badge variant='outline'>+{tool.tags.length - 3}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className='flex items-center justify-center mt-6'>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className={
                  currentPage === 1
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>
            {Array.from(pageNumbers.entries()).map(([pos, page]) =>
              typeof page === 'number' ? (
                <PaginationItem key={`page-grid-${page}`}>
                  <PaginationLink
                    onClick={() => onPageChange(page)}
                    isActive={currentPage === page}
                    className='cursor-pointer'
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem key={`ellipsis-grid-${pos}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                className={
                  currentPage === totalPages
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

// AlertDialog 组件
function DeleteToolDialog({
  tool,
  onClose,
  onConfirm,
  onViewUsage,
}: {
  tool: { uid: string; name: string } | null
  onClose: () => void
  onConfirm: () => void
  onViewUsage: (tool: { uid: string; name: string }) => void
}) {
  const t = useTranslations('tool.DeleteDialog')
  const usageQuery = useToolUsage(tool?.uid ?? '', 0, 0, 10, !!tool)
  const usageCount =
    (usageQuery.data?.workflow_total ?? 0) + (usageQuery.data?.run_total ?? 0)
  const isBlocked = usageCount > 0
  const description = getDeleteDialogDescription({
    isLoading: usageQuery.isLoading,
    isError: usageQuery.isError,
    isBlocked,
    toolName: tool?.name ?? '',
    workflowTotal: usageQuery.data?.workflow_total ?? 0,
    runTotal: usageQuery.data?.run_total ?? 0,
    t,
  })
  return (
    <AlertDialog open={!!tool} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          {isBlocked && tool ? (
            <Button onClick={() => onViewUsage(tool)}>{t('viewUsage')}</Button>
          ) : (
            <AlertDialogAction
              onClick={onConfirm}
              disabled={usageQuery.isLoading || usageQuery.isError}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {t('delete')}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function getDeleteDialogDescription({
  isLoading,
  isError,
  isBlocked,
  toolName,
  workflowTotal,
  runTotal,
  t,
}: {
  isLoading: boolean
  isError: boolean
  isBlocked: boolean
  toolName: string
  workflowTotal: number
  runTotal: number
  t: ReturnType<typeof useTranslations>
}) {
  if (isLoading) return t('checking')
  if (isError) return t('checkError')
  if (isBlocked) {
    return t('blocked', {
      name: toolName,
      workflows: workflowTotal,
      runs: runTotal,
    })
  }
  return t('description', { name: toolName })
}
