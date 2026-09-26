import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  RUN_STATUS_APPEARANCE,
  type RunStatus,
  statusToneClasses,
} from '@/lib/status'
import { cn } from '@/lib/utils'

export function RunStatusIcon({
  status,
  className,
}: {
  status: RunStatus
  className?: string
}) {
  const appearance = RUN_STATUS_APPEARANCE[status]
  const Icon = appearance.icon
  return (
    <Icon
      className={cn(
        'size-3.5 shrink-0',
        statusToneClasses[appearance.tone].text,
        status === 'running' && 'animate-spin motion-reduce:animate-none',
        className,
      )}
    />
  )
}

export function RunStatusBadge({
  status,
  label,
  className,
}: {
  status: RunStatus
  label: ReactNode
  className?: string
}) {
  const appearance = RUN_STATUS_APPEARANCE[status]
  return (
    <Badge
      variant='outline'
      className={cn(
        'gap-1',
        statusToneClasses[appearance.tone].badge,
        className,
      )}
    >
      <RunStatusIcon status={status} className='size-3 text-current' />
      {label}
    </Badge>
  )
}
