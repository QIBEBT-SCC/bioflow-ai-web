import { TagIcon } from 'lucide-react'
import { NewTagDialog } from '@/components/project/new-tag-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProjectTags } from '@/hooks/use-project'
import { colorClassMap } from '@/types/color'

export function TagList() {
  const { data: tags = [], isLoading, error } = useProjectTags()

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>加载失败</div>

  return (
    <aside className='w-full md:w-64 shrink-0'>
      <div className='sticky top-6 space-y-6'>
        <div className='flex items-center'>
          <TagIcon className='h-4 w-4 mr-1' />
          <h2 className='text-lg font-medium'>标签</h2>
        </div>

        <div className='space-y-2'>
          {tags.length === 0 && (
            <div className='text-muted-foreground'>加载中...</div>
          )}
          {tags.map((tag) => (
            <Button
              key={tag.name}
              variant='outline'
              className='w-full justify-start'
              size='sm'
            >
              <Badge className={`mr-2 border-0 ${colorClassMap[tag.color]}`}>
                {tag.name}
              </Badge>
              <span className='text-muted-foreground ml-auto'>
                {tag.project_count ? tag.project_count : '--'}
              </span>
            </Button>
          ))}
        </div>

        <NewTagDialog />
      </div>
    </aside>
  )
}
