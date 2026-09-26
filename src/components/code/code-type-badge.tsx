import { FileCode2Icon, SquareTerminalIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CodeNodeType } from '@/types/code'

const codeTypeStyles: Record<
  CodeNodeType,
  { label: string; badge: string; tile: string }
> = {
  code_python: {
    label: 'Python',
    badge:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
    tile: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
  },
  code_R: {
    label: 'R',
    badge:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300',
    tile: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
  },
  code_bash: {
    label: 'Bash',
    badge:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
    tile: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  },
}

export function CodeTypeBadge({ nodeType }: { nodeType: CodeNodeType }) {
  const style = codeTypeStyles[nodeType] ?? codeTypeStyles.code_bash
  return (
    <Badge variant='outline' className={style.badge}>
      {style.label}
    </Badge>
  )
}

export function CodeTypeIcon({ nodeType }: { nodeType: CodeNodeType }) {
  const style = codeTypeStyles[nodeType] ?? codeTypeStyles.code_bash
  const Icon = nodeType === 'code_bash' ? SquareTerminalIcon : FileCode2Icon
  return (
    <div
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-lg',
        style.tile,
      )}
    >
      <Icon className='size-5' />
    </div>
  )
}
