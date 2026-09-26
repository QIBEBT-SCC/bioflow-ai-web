import { useTranslations } from 'next-intl'
import { FilterPanel } from '@/components/layout/filter-panel'
import { NewTagDialog } from '@/components/project/new-tag-dialog'
import { Button } from '@/components/ui/button'
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

  return (
    <FilterPanel title={t('title')} footer={<NewTagDialog />}>
      <div className='flex flex-wrap gap-1.5 px-1 pb-1'>
        {isLoading && (
          <p className='px-1 text-sm text-muted-foreground'>{t('loading')}</p>
        )}
        {error && (
          <p className='px-1 text-sm text-destructive'>{t('loadFailed')}</p>
        )}
        {!isLoading && !error && tags.length === 0 && (
          <p className='px-1 text-sm text-muted-foreground'>{t('empty')}</p>
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
                  'opacity-40 saturate-50 hover:opacity-75',
                isSelected && 'ring-2 ring-ring ring-offset-1',
              )}
              aria-pressed={isSelected}
              onClick={() => onTagChange(isSelected ? null : tag.id)}
            >
              <span>{tag.name}</span>
              <span className='border-l border-current/20 pl-1.5 tabular-nums opacity-70'>
                {tag.project_count}
              </span>
            </Button>
          )
        })}
      </div>
    </FilterPanel>
  )
}
