import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export interface PageCrumb {
  label: string
  href?: string
}

export function PageBreadcrumbs({ items }: { items: PageCrumb[] }) {
  return (
    <Breadcrumb className='min-w-0 flex-1'>
      <BreadcrumbList className='flex-nowrap'>
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1
          return (
            <Fragment key={crumb.href ?? `current:${crumb.label}`}>
              {index > 0 && <BreadcrumbSeparator className='hidden md:block' />}
              <BreadcrumbItem
                className={cn('min-w-0', !isLast && 'hidden md:inline-flex')}
              >
                {isLast || !crumb.href ? (
                  <BreadcrumbPage className='truncate'>
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href} className='truncate'>
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/**
 * The 48px bar at the top of every page: sidebar toggle, breadcrumbs (or custom
 * content) and right-aligned actions. Full-bleed pages render it directly.
 */
export function PageTopbar({
  breadcrumbs,
  actions,
  children,
  className,
}: {
  breadcrumbs?: PageCrumb[]
  actions?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4',
        className,
      )}
    >
      <SidebarTrigger className='-ml-1' />
      <Separator orientation='vertical' className='mr-2 h-4!' />
      {breadcrumbs && <PageBreadcrumbs items={breadcrumbs} />}
      {children}
      {actions && (
        <div className='ml-auto flex shrink-0 items-center gap-2'>
          {actions}
        </div>
      )}
    </header>
  )
}

/**
 * Standard frame for scrolling pages under `(main)`: the topbar plus a single
 * scrollable body.
 */
export function PageShell({
  breadcrumbs,
  actions,
  children,
  bodyClassName,
}: {
  breadcrumbs: PageCrumb[]
  actions?: ReactNode
  children: ReactNode
  bodyClassName?: string
}) {
  return (
    <SidebarInset className='flex h-screen flex-col overflow-hidden'>
      <PageTopbar breadcrumbs={breadcrumbs} actions={actions} />
      <main className={cn('min-h-0 flex-1 overflow-y-auto', bodyClassName)}>
        {children}
      </main>
    </SidebarInset>
  )
}

const containerSizes = {
  narrow: 'max-w-5xl',
  default: 'max-w-7xl',
  wide: 'max-w-[96rem]',
} as const

/** Centered content column with the standard page gutter. */
export function PageContainer({
  size = 'default',
  className,
  children,
}: {
  size?: keyof typeof containerSizes
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 py-6 sm:px-6 lg:py-8',
        containerSizes[size],
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Page title block: one h1 size, optional description and right-aligned actions. */
export function PageHeader({
  title,
  titleAddon,
  description,
  actions,
  className,
}: {
  title: ReactNode
  /** Badges or status shown inline after the title. */
  titleAddon?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className='min-w-0 space-y-1'>
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
          <h1 className='text-2xl font-semibold tracking-tight break-words'>
            {title}
          </h1>
          {titleAddon}
        </div>
        {description && (
          <p className='text-sm text-pretty text-muted-foreground'>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center'>
          {actions}
        </div>
      )}
    </div>
  )
}
