import type { ReactNode } from 'react'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

/** Titled content card used for sections on detail and settings pages. */
export function SectionCard({
  icon,
  title,
  description,
  action,
  className,
  contentClassName,
  children,
}: {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
  contentClassName?: string
  children: ReactNode
}) {
  return (
    <Card className={cn('gap-4', className)}>
      <CardHeader className='gap-1'>
        <CardTitle className='flex items-center gap-2 text-base'>
          {icon && (
            <span className='text-muted-foreground [&_svg]:size-4'>{icon}</span>
          )}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  )
}
