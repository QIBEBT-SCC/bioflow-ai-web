import { CheckCircle2Icon, CircleDashedIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { statusToneClasses } from '@/lib/status'
import { cn } from '@/lib/utils'

/** One coding agent: identity + connection status header, then its settings. */
export function CodingAgentSection({
  icon,
  name,
  summary,
  connected,
  statusLabel,
  action,
  children,
}: {
  icon: ReactNode
  name: string
  summary: string
  connected: boolean
  statusLabel: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className='gap-0 overflow-hidden py-0'>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-3 p-5'>
        <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5'>
          {icon}
        </div>
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='font-semibold'>{name}</h2>
            <Badge
              variant='outline'
              className={cn(
                'gap-1',
                statusToneClasses[connected ? 'success' : 'neutral'].badge,
              )}
            >
              {connected ? (
                <CheckCircle2Icon className='size-3' />
              ) : (
                <CircleDashedIcon className='size-3' />
              )}
              {statusLabel}
            </Badge>
          </div>
          <p className='mt-0.5 text-sm text-muted-foreground'>{summary}</p>
        </div>
        {action && <div className='shrink-0'>{action}</div>}
      </div>
      <div className='divide-y border-t'>{children}</div>
    </Card>
  )
}

/** A titled block inside a coding-agent section. */
export function CodingAgentBlock({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className='space-y-4 p-5'>
      <div className='space-y-0.5'>
        <h3 className='text-sm font-medium'>{title}</h3>
        {description && (
          <p className='text-sm text-muted-foreground'>{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}
