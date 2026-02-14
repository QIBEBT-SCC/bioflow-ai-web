'use client'

import { PackageIcon, PlusIcon, SearchIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { CreateImageDialog } from '@/components/image/create-image-dialog'
import { ImageCard } from '@/components/image/image-card'
import { ImagePagination } from '@/components/image/image-pagination'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
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

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))

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
            <div className='flex items-center justify-between gap-4'>
              <div className='relative flex-1 max-w-2xl'>
                <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground' />
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
                    <XIcon className='h-4 w-4 text-muted-foreground' />
                  </Button>
                )}
              </div>
              <CreateImageDialog />
            </div>
          </div>

          {/* Results Count - only show when searching */}
          {enableSearch && (
            <div className='mb-6'>
              <p className='text-sm text-muted-foreground'>
                {images.length} {images.length === 1 ? 'image' : 'images'} found
              </p>
            </div>
          )}

          {error ? (
            <Empty className='border'>
              <EmptyHeader>
                <EmptyMedia>
                  <PackageIcon className='h-12 w-12' />
                </EmptyMedia>
                <EmptyTitle>加载失败</EmptyTitle>
                <EmptyDescription>
                  {error ? error.message : '加载失败'}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant='outline'
                  onClick={() => window.location.reload()}
                >
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
          ) : images.length === 0 ? (
            <Empty className='border'>
              <EmptyHeader>
                <EmptyMedia>
                  <PackageIcon className='h-12 w-12' />
                </EmptyMedia>
                <EmptyTitle>No Docker Images Found</EmptyTitle>
                <EmptyDescription>
                  {
                    "You haven't added any Docker images yet. Get started by creating your first image."
                  }
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <CreateImageDialog
                  trigger={
                    <Button>
                      <PlusIcon className='h-4 w-4 mr-2' />
                      Create First Image
                    </Button>
                  }
                />
              </EmptyContent>
            </Empty>
          ) : (
            <>
              {/* Image Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {images.map((image) => (
                  <ImageCard
                    key={image.uid || `${image.name}-${image.version}`}
                    image={image}
                  />
                ))}
              </div>

              {/* Pagination */}
              {!enableSearch && totalPages > 1 && (
                <ImagePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </div>
    </SidebarInset>
  )
}
