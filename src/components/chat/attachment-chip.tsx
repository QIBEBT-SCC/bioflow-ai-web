import { XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** File-like attachment: tinted icon tile, name and one line of meta. */
export function AttachmentChip({
  icon,
  iconClassName,
  title,
  meta,
  metaClassName,
  action,
  className,
}: {
  icon: ReactNode
  iconClassName?: string
  title: string
  meta?: ReactNode
  metaClassName?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-12 w-56 max-w-full items-center gap-2.5 rounded-lg border bg-card pr-2 pl-1.5 text-xs shadow-xs',
        className,
      )}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-md [&_svg]:size-4',
          iconClassName,
        )}
      >
        {icon}
      </span>
      <div className='min-w-0 flex-1'>
        <p className='truncate font-medium text-foreground' title={title}>
          {title}
        </p>
        {meta && (
          <p
            className={cn('truncate text-muted-foreground', metaClassName)}
            title={typeof meta === 'string' ? meta : undefined}
          >
            {meta}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

/** Small round remove button pinned to the top-right corner of a draft tile. */
export function AttachmentRemoveButton({
  label,
  disabled,
  onClick,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type='button'
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className='absolute -top-1.5 -right-1.5 z-10 flex size-5 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-xs transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
    >
      <XIcon className='size-3' />
    </button>
  )
}
