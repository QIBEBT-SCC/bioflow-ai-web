import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Compact metric tile: icon + label on top, value content below. */
export function StatTile({
  icon,
  label,
  className,
  children,
}: {
  icon: ReactNode
  label: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('rounded-xl border bg-card p-4', className)}>
      <div className='mb-2 flex items-center gap-2 text-sm text-muted-foreground [&_svg]:size-4'>
        {icon}
        {label}
      </div>
      {children}
    </div>
  )
}
