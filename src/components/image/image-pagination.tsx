import type React from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface ImagePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function ImagePagination({
  currentPage,
  totalPages,
  onPageChange,
}: ImagePaginationProps) {
  const hasNextPage = currentPage < totalPages

  const renderPageNumbers = () => {
    const items: React.ReactNode[] = []
    
    const addLink = (page: number, active = false) => {
      items.push(
        <PaginationItem key={`p-${page}`}>
          <PaginationLink
            href='#'
            isActive={active}
            onClick={(e) => {
              e.preventDefault()
              onPageChange(page)
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
    const end = Math.min(totalPages - 1, currentPage + windowSize)

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
    if (totalPages > 1) addLink(totalPages, currentPage === totalPages)

    return items
  }

  return (
    <Pagination className='mt-8'>
      <PaginationContent>
        {/* Previous */}
        <PaginationItem>
          <PaginationPrevious
            href='#'
            onClick={(e) => {
              e.preventDefault()
              if (currentPage > 1) onPageChange(Math.max(1, currentPage - 1))
            }}
            className={
              currentPage === 1 ? 'pointer-events-none opacity-50' : ''
            }
          />
        </PaginationItem>

        {/* Page numbers with ellipsis */}
        {renderPageNumbers()}

        {/* Next */}
        <PaginationItem>
          <PaginationNext
            href='#'
            onClick={(e) => {
              e.preventDefault()
              if (hasNextPage) onPageChange(currentPage + 1)
            }}
            className={!hasNextPage ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
