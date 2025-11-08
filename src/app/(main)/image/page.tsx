'use client'

import { ExternalLink, FileText, Package, Plus, Search, X } from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { useImageCount, useImageList, useSearchImages } from '@/hooks/use-tool'

const SKELETON_KEYS = ['sk-0', 'sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5']

// 以实际接口数据替换 mock

export default function ImagePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const offset = (currentPage - 1) * itemsPerPage
  const {
    data: pageImages = [],
    isLoading: loadingList,
    error: errorList,
  } = useImageList(offset, itemsPerPage)
  const { data: totalCount = 0 } = useImageCount()
  const enableSearch = searchQuery.trim().length > 0
  const {
    data: searchImages = [],
    isLoading: loadingSearch,
    error: errorSearch,
  } = useSearchImages(searchQuery)
  const images = enableSearch ? searchImages : pageImages
  const loading = enableSearch ? loadingSearch : loadingList
  const error = enableSearch ? errorSearch : errorList

  const filteredImages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return images
    return images.filter(
      (img) =>
        (img.name?.toLowerCase() || '').includes(q) ||
        (img.description?.toLowerCase() || '').includes(q) ||
        (img.version?.toLowerCase() || '').includes(q),
    )
  }, [images, searchQuery])

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))
  const hasNextPage = !enableSearch && currentPage < totalPages

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  return (
    <SidebarInset className='h-screen flex flex-col'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center justify-between px-4 h-12 bg-background'>
          <div className='flex items-center gap-2'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='!mr-2 !h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbPage>Images</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </header>
      <div className='flex-1 overflow-y-auto'>
        <div className='container mx-auto px-4 py-8 max-w-7xl'>
          {/* Header */}
          <div className='mb-12'>
            <div className='flex items-start justify-between gap-4 mb-3'>
              <div>
                <h1 className='text-4xl font-bold text-balance'>
                  Docker Image Registry
                </h1>
              </div>
            </div>
            <p className='text-lg text-muted-foreground text-pretty'>
              Browse and discover containerized tools and frameworks for your
              projects
            </p>
          </div>

          {/* Search Bar */}
            <div className='mb-8'>
              <div className='relative max-w-2xl'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground' />
              <Input
                type='text'
                placeholder='Search images by name, description, or version...'
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                  className='pl-10 pr-10 h-12 text-base'
              />
                {searchQuery && (
                  <Button
                    variant='ghost'
                    size='icon'
                    className='absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8'
                    aria-label='Clear search'
                    onClick={() => handleSearchChange('')}
                  >
                    <X className='h-4 w-4 text-muted-foreground' />
                  </Button>
                )}
            </div>
          </div>

          {/* Results Count - only show when searching */}
          {enableSearch && (
            <div className='mb-6'>
              <p className='text-sm text-muted-foreground'>
                {filteredImages.length}{' '}
                {filteredImages.length === 1 ? 'image' : 'images'} found
              </p>
            </div>
          )}

            {error ? (
            <Empty className='border'>
              <EmptyHeader>
                <EmptyMedia>
                  <Package className='h-12 w-12' />
                </EmptyMedia>
                <EmptyTitle>加载失败</EmptyTitle>
                <EmptyDescription>
                  {error instanceof Error ? error.message : '加载失败'}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                  <Button variant='outline' onClick={() => setCurrentPage((p) => p)}>
                    重试
                  </Button>
              </EmptyContent>
            </Empty>
          ) : loading ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {SKELETON_KEYS.map((k) => (
                <Card key={k} className='h-48 animate-pulse' />
              ))}
            </div>
            ) : filteredImages.length === 0 ? (
            <Empty className='border'>
              <EmptyHeader>
                <EmptyMedia>
                  <Package className='h-12 w-12' />
                </EmptyMedia>
                <EmptyTitle>No Docker Images Found</EmptyTitle>
                <EmptyDescription>
                    {"You haven't added any Docker images yet. Get started by creating your first image."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                  <Button>
                    <Plus />
                    Create First Image
                  </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              {/* Image Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {filteredImages.map((image) => (
                  <Card
                    key={image.uid || `${image.name}-${image.version}`}
                    className='flex flex-col hover:shadow-lg transition-shadow'
                  >
                    <CardHeader>
                      <div className='flex items-start justify-between gap-2 mb-2'>
                        <div className='flex items-center gap-2 min-w-0'>
                          <Package className='h-5 w-5 text-primary shrink-0' />
                          <CardTitle className='text-lg truncate'>
                            {image.name}
                          </CardTitle>
                        </div>
                      </div>
                      {image.version && (
                        <Badge
                          variant='secondary'
                          className='w-fit font-mono text-xs'
                        >
                          {image.version}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className='flex-1 flex flex-col'>
                      <CardDescription className='mb-4 line-clamp-3 leading-relaxed'>
                        {image.description || 'No description available'}
                      </CardDescription>

                      {/* Image Tag */}
                      <div className='mb-4 p-3 bg-muted rounded-md'>
                        <code className='text-xs font-mono break-all text-foreground'>
                          {`${image.image?.registry ?? ''}/${image.image?.namespace ?? ''}/${image.image?.repository ?? ''}:${image.image?.tag ?? ''}`
                            .replace(/^\/+/, '')
                            .replace(/\/+/, '/')}
                        </code>
                      </div>

                      {/* Links */}
                      <div className='flex flex-wrap gap-2 mt-auto'>
                        {image.homepage && (
                          <Button
                            variant='outline'
                            size='sm'
                            asChild
                            className='flex-1 bg-transparent'
                          >
                            <a
                              href={image.homepage}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='flex items-center justify-center gap-1.5'
                            >
                              <ExternalLink className='h-3.5 w-3.5' />
                              <span>Homepage</span>
                            </a>
                          </Button>
                        )}
                        {image.paper_link && (
                          <Button
                            variant='outline'
                            size='sm'
                            asChild
                            className='flex-1 bg-transparent'
                          >
                            <a
                              href={image.paper_link}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='flex items-center justify-center gap-1.5'
                            >
                              <FileText className='h-3.5 w-3.5' />
                              <span>Paper</span>
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {!enableSearch && totalPages > 1 && (
                <Pagination className='mt-8'>
                  <PaginationContent>
                    {/* Previous */}
                    <PaginationItem>
                      <PaginationPrevious
                        href='#'
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage > 1)
                            setCurrentPage((p) => Math.max(1, p - 1))
                        }}
                        className={
                          currentPage === 1
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      />
                    </PaginationItem>

                    {/* Page numbers with ellipsis */}
                    {(() => {
                      const items: React.ReactNode[] = []
                      const addLink = (page: number, active = false) => {
                        items.push(
                          <PaginationItem key={`p-${page}`}>
                            <PaginationLink
                              href='#'
                              isActive={active}
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(page)
                              }}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>,
                        )
                      }
                      const addEllipsis = (key: string) => {
                        items.push(
                          <PaginationItem key={key}>
                            <PaginationEllipsis />
                          </PaginationItem>,
                        )
                      }
                      const windowSize = 1 // show 1 page around current
                      const start = Math.max(2, currentPage - windowSize)
                      const end = Math.min(
                        totalPages - 1,
                        currentPage + windowSize,
                      )

                      // First page
                      addLink(1, currentPage === 1)

                      // Leading ellipsis
                      if (start > 2) addEllipsis('lead')

                      // Middle pages
                      for (let p = start; p <= end; p++) {
                        addLink(p, p === currentPage)
                      }

                      // Trailing ellipsis
                      if (end < totalPages - 1) addEllipsis('trail')

                      // Last page
                      if (totalPages > 1)
                        addLink(totalPages, currentPage === totalPages)

                      return items
                    })()}

                    {/* Next */}
                    <PaginationItem>
                      <PaginationNext
                        href='#'
                        onClick={(e) => {
                          e.preventDefault()
                          if (hasNextPage) setCurrentPage((p) => p + 1)
                        }}
                        className={
                          !hasNextPage ? 'pointer-events-none opacity-50' : ''
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </div>
    </SidebarInset>
  )
}
