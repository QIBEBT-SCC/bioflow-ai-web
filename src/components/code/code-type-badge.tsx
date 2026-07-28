import { Badge } from '@/components/ui/badge'
import type { CodeNodeType } from '@/types/code'

export function CodeTypeBadge({ nodeType }: { nodeType: CodeNodeType }) {
  const isPython = nodeType === 'code_python'
  return (
    <Badge
      variant='outline'
      className={
        isPython
          ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300'
          : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
      }
    >
      {isPython ? 'Python' : 'Bash'}
    </Badge>
  )
}
