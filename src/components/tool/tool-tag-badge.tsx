import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

function tagStyle(tagName: string) {
  switch (tagName) {
    case 'AI Checked':
      return 'border-success/30 bg-success/10 text-success'
    case 'AI Unchecked':
      return 'border-warning/40 bg-warning/10 text-warning'
    default:
      return 'border-info/30 bg-info/10 text-info'
  }
}

export function ToolTagBadge({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  return (
    <Badge variant='outline' className={cn(tagStyle(name), className)}>
      {name}
    </Badge>
  )
}
