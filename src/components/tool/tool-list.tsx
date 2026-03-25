'use client'

import { CopyIcon, MoreHorizontalIcon, Trash2Icon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useDeleteTool,
  useGroupTools,
  useSearchTools,
  useToolCount,
  useToolList,
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
  viewMode: 'list' | 'grid'
  searchQuery?: string
  selectedGroupId?: number | null
}

export function ToolList({
  viewMode,
  searchQuery = '',
  selectedGroupId = null,
}: ToolListProps) {
  const t = useTranslations('tool.List')
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteConfirmTool, setDeleteConfirmTool] = useState<{
    uid: string
    name: string
  } | null>(null)
  const pageSize = viewMode === 'list' ? 10 : 12
  const offset = (currentPage - 1) * pageSize

  const router = useRouter()
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
    router.push(`/tool/add?copy=${uid}&step=2`)
  }

  // 根据搜索条件和分组选择，决定使用哪个 hook
  const isSearching = searchQuery.trim() !== ''
  const isFiltering = selectedGroupId !== null && !isSearching // 搜索优先级高于分组

  // 搜索工具（服务端分页）
  const { data: searchResults = [], isLoading: isSearchLoading } =
    useSearchTools(searchQuery.trim(), offset)

  // 分组工具（无服务端分页，需要客户端处理）
  const { data: allGroupTools = [], isLoading: isLoadingGroup } = useGroupTools(
    isFiltering ? (selectedGroupId ?? undefined) : undefined,
  )

  // 所有工具（服务端分页）
  const { data: allToolsList = [], isLoading: isLoadingAll } = useToolList(
    !isSearching && !isFiltering ? offset : 0,
    !isSearching && !isFiltering ? pageSize : 10,
  )
  const { data: toolCounts = 0 } = useToolCount()

  // 对分组工具进行客户端分页
  const paginatedGroupTools = isFiltering
    ? allGroupTools.slice(offset, offset + pageSize)
    : []

  // 根据条件决定使用哪个数据源
  const allTools = isSearching
    ? searchResults
    : isFiltering
      ? paginatedGroupTools
      : allToolsList

  const isLoading = isSearching
    ? isSearchLoading
    : isFiltering
      ? isLoadingGroup
      : isLoadingAll

  // 计算总页数
  const totalPages = isSearching
    ? Math.ceil((searchResults.length || 1) / pageSize) // 搜索结果可能需要更多信息来计算总数
    : isFiltering
      ? Math.ceil(allGroupTools.length / pageSize)
      : Math.ceil(toolCounts / pageSize)

  // 当搜索查询或分组选择变化时，重置到第一页
  // biome-ignore lint/correctness/useExhaustiveDependencies: 当搜索或分组变化时需要重置页码
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedGroupId])

  // 生成页码数组
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      // 如果总页数少于最大可见数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 否则智能显示部分页码
      if (currentPage <= 3) {
        // 当前页在开头
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // 当前页在末尾
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // 当前页在中间
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2'></div>
          <p className='text-muted-foreground'>{t('loading')}</p>
        </div>
      </div>
    )
  }

  const content = viewMode === 'list' ? (
    <div>
      <Table>
        <TableHeader className='bg-muted/50'>
          <TableRow>
            <TableHead className='h-12 px-4 text-left w-30'>{t('toolName')}</TableHead>
            <TableHead className='h-12 px-4 text-left w-60'>
              {t('dockerImage')}
            </TableHead>
            <TableHead className='h-12 px-4 text-left w-85'>{t('description')}</TableHead>
            <TableHead className='h-12 px-4 text-left w-30'>{t('tags')}</TableHead>
            <TableHead className='h-12 px-4 text-center w-5'>{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allTools.map((tool: SimpleToolInfo) => (
            <TableRow key={tool.uid}>
              <TableCell className='font-medium max-w-30'>
                <Link href={`/tool/${tool.uid}`} className='hover:underline'>
                  <div className='truncate'>{tool.name}</div>
                </Link>
              </TableCell>
              <TableCell className='text-muted-foreground max-w-60'>
                <div className='truncate'>
                  {tool.image.image.registry}/{tool.image.image.namespace}/
                  {tool.image.image.repository}:{tool.image.image.tag}
                </div>
              </TableCell>
              <TableCell className='max-w-85'>
                <div className='line-clamp-2 text-sm truncate'>
                  {tool.description || t('noDescription')}
                </div>
              </TableCell>
              <TableCell className='max-w-30'>
                <div className='flex flex-row flex-wrap gap-1'>
                  {tool.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant='outline'
                      className={`${getTagStyle(tag.name)} text-xs`}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                  {tool.tags.length > 2 && (
                    <Badge variant='outline' className='text-xs'>
                      +{tool.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className='text-center'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon' className='h-8 w-8'>
                      <MoreHorizontalIcon className='h-4 w-4' />
                      <span className='sr-only'>{t('moreOptions')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => handleCopyTool(tool.uid)}>
                      <CopyIcon className='h-4 w-4 mr-2' />
                      {t('copyTool')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className='text-destructive'
                      onClick={() =>
                        setDeleteConfirmTool({ uid: tool.uid, name: tool.name })
                      }
                    >
                      <Trash2Icon className='h-4 w-4 mr-2' />
                      {t('deleteTool')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 分页 */}
      <div className='flex items-center justify-between mt-4'>
        <div className='text-sm text-muted-foreground'>
          {t('showing', {
            start: offset + 1,
            end: Math.min(offset + pageSize, toolCounts),
            total: toolCounts,
          })}
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={
                  currentPage === 1
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>
            {getPageNumbers().map((page, index) =>
              typeof page === 'number' ? (
                <PaginationItem key={`page-list-${page}`}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className='cursor-pointer'
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                // biome-ignore lint/suspicious/noArrayIndexKey: no need
                <PaginationItem key={`ellipsis-list-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
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
  ) : (
    <div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {allTools.map((tool: SimpleToolInfo) => (
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
                    <Button variant='ghost' size='icon' className='h-8 w-8'>
                      <MoreHorizontalIcon className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => handleCopyTool(tool.uid)}>
                      <CopyIcon className='h-4 w-4 mr-2' />
                      复制工具
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className='text-destructive'
                      onClick={() =>
                        setDeleteConfirmTool({ uid: tool.uid, name: tool.name })
                      }
                    >
                      <Trash2Icon className='h-4 w-4 mr-2' />
                      删除工具
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

      {/* 分页 */}
      <div className='flex items-center justify-center mt-6'>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={
                  currentPage === 1
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>
            {getPageNumbers().map((page, index) =>
              typeof page === 'number' ? (
                <PaginationItem key={`page-grid-${page}`}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className='cursor-pointer'
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                // biome-ignore lint/suspicious/noArrayIndexKey: no need
                <PaginationItem key={`ellipsis-grid-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
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

  return (
    <>
      {content}
      <DeleteToolDialog
        tool={deleteConfirmTool}
        onClose={() => setDeleteConfirmTool(null)}
        onConfirm={handleDeleteTool}
      />
    </>
  )
}

// AlertDialog 组件
function DeleteToolDialog({
  tool,
  onClose,
  onConfirm,
}: {
  tool: { uid: string; name: string } | null
  onClose: () => void
  onConfirm: () => void
}) {
  const t = useTranslations('tool.DeleteDialog')
  return (
    <AlertDialog open={!!tool} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('description', { name: tool?.name || '' })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
