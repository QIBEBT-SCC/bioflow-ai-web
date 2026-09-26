'use client'

import { PackageIcon, PlusIcon, SearchIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type ComponentProps, useState } from 'react'
import { CreateImageDialog } from '@/components/image/create-image-dialog'
import { ImageCard } from '@/components/image/image-card'
import { ImagePagination } from '@/components/image/image-pagination'
import {
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useImageList, useSearchImages } from '@/hooks/use-tool'

const SKELETON_KEYS = ['sk-0', 'sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5']

export default function ImagePage() {
  const t = useTranslations('image')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const offset = (currentPage - 1) * itemsPerPage
  const {
    data: imagePage,
    isLoading: loadingList,
    error: errorList,
  } = useImageList(offset, itemsPerPage)
  const enableSearch = searchQuery.trim().length > 0
  const {
    data: searchPage,
    isLoading: loadingSearch,
    error: errorSearch,
  } = useSearchImages(searchQuery.trim(), offset, itemsPerPage)
  const activePage = enableSearch ? searchPage : imagePage
  const images = activePage?.data ?? []
  const loading = enableSearch ? loadingSearch : loadingList
  const error = enableSearch ? errorSearch : errorList
  const totalCount = activePage?.total ?? 0

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  return (
    <PageShell breadcrumbs={[{ label: t('title') }]}>
      <PageContainer>
        <PageHeader
          title={t('headerTitle')}
          description={t('headerDesc')}
          actions={
            <>
              <div className='relative w-full sm:w-64'>
                <SearchIcon className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  type='text'
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className='pr-9 pl-8'
                />
                {searchQuery && (
                  <Button
                    variant='ghost'
                    size='icon'
                    className='absolute top-1/2 right-1 size-7 -translate-y-1/2'
                    aria-label={t('searchClear')}
                    onClick={() => handleSearchChange('')}
                  >
                    <XIcon className='size-4 text-muted-foreground' />
                  </Button>
                )}
              </div>
              <CreateImageDialog />
            </>
          }
        />

        {/* Results Count - only show when searching */}
        {enableSearch && (
          <div className='mb-4'>
            <p className='text-sm text-muted-foreground'>
              {totalCount === 1
                ? t('imageFound', { count: totalCount })
                : t('imagesFound', { count: totalCount })}
            </p>
          </div>
        )}

        <ImageResults
          error={error}
          loading={loading}
          images={images}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </PageContainer>
    </PageShell>
  )
}

function ImageResults({
  error,
  loading,
  images,
  currentPage,
  totalPages,
  onPageChange,
}: {
  error: Error | null
  loading: boolean
  images: ComponentProps<typeof ImageCard>['image'][]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const t = useTranslations('image')

  if (error) {
    return (
      <Empty className='border border-dashed'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <PackageIcon />
          </EmptyMedia>
          <EmptyTitle>{t('loadFail')}</EmptyTitle>
          <EmptyDescription>{error.message}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant='outline' onClick={() => window.location.reload()}>
            {t('retry')}
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  if (loading) {
    return (
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {SKELETON_KEYS.map((k) => (
          <Skeleton key={k} className='h-52 rounded-xl' />
        ))}
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <Empty className='border border-dashed'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <PackageIcon />
          </EmptyMedia>
          <EmptyTitle>{t('noImagesTitle')}</EmptyTitle>
          <EmptyDescription>{t('noImagesDesc')}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreateImageDialog
            trigger={
              <Button>
                <PlusIcon className='size-4' />
                {t('createFirstBtn')}
              </Button>
            }
          />
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {images.map((image) => (
          <ImageCard
            key={image.uid || `${image.name}-${image.version}`}
            image={image}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <ImagePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </>
  )
}
