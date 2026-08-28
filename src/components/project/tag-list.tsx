import { TagIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { NewTagDialog } from '@/components/project/new-tag-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useProjectTags } from '@/hooks/use-project'
import { cn } from '@/lib/utils'
import { colorClassMap } from '@/types/color'

export function TagList({
  selectedTagId,
  onTagChange,
}: {
  selectedTagId: number | null
  onTagChange: (tagId: number | null) => void
}) {
  const t = useTranslations('Project.list.tags')
  const { data: tags = [], isLoading, error } = useProjectTags()

  if (isLoading) return <div>{t('loading')}</div>
  if (error) return <div>{t('loadFailed')}</div>

  return (
    <aside className='w-full md:w-64 shrink-0'>
      <div className='sticky top-6 space-y-4'>
        <div className='flex items-center'>
          <TagIcon className='size-4 mr-1' />
          <h2 className='text-lg font-medium'>{t('title')}</h2>
        </div>

        <Card className='gap-0 py-3 shadow-none'>
          <CardContent className='flex flex-wrap gap-2 px-3'>
            {tags.length === 0 && (
              <div className='text-muted-foreground'>{t('empty')}</div>
            )}
            {tags.map((tag) => {
              const isSelected = tag.id === selectedTagId
              return (
                <Button
                  key={tag.id}
                  type='button'
                  variant='ghost'
                  size='xs'
                  className={cn(
                    'rounded-full border-0 px-2.5 shadow-none transition-all',
                    colorClassMap[tag.color],
                    selectedTagId !== null &&
                      !isSelected &&
                      'opacity-35 saturate-50 hover:opacity-70',
                    isSelected && 'ring-2 ring-primary ring-offset-2',
                  )}
                  aria-pressed={isSelected}
                  onClick={() => onTagChange(isSelected ? null : tag.id)}
                >
                  <span>{tag.name}</span>
                  <span className='border-current/20 border-l pl-1.5 opacity-70'>
                    {tag.project_count}
                  </span>
                </Button>
              )
            })}
          </CardContent>
        </Card>

        <NewTagDialog />
      </div>
    </aside>
  )
}
