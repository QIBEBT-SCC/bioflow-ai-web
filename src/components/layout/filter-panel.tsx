import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Left-hand filter column used by list pages (tool groups, project tags, …). */
export function FilterPanel({
  title,
  action,
  footer,
  className,
  children,
}: {
  title: ReactNode
  action?: ReactNode
  footer?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <aside className={cn('w-full shrink-0 md:w-60', className)}>
      <div className='rounded-xl border bg-card p-2 md:sticky md:top-0'>
        <div className='flex h-8 items-center justify-between px-2'>
          <h2 className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>
            {title}
          </h2>
          {action}
        </div>
        <div className='mt-1'>{children}</div>
        {footer && <div className='mt-2 border-t px-1 pt-2'>{footer}</div>}
      </div>
    </aside>
  )
}
