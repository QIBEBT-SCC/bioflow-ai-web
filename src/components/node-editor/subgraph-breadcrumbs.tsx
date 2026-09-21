'use client'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export function SubgraphBreadcrumbs({
  labels,
  onNavigate,
}: {
  labels: string[]
  onNavigate: (depth: number) => void
}) {
  const t = useTranslations('editor.subgraph')
  return (
    <nav aria-label={t('title')} className='flex gap-2 border-t p-2'>
      <Button variant='ghost' onClick={() => onNavigate(0)}>
        {t('root')}
      </Button>
      {labels.map((label, index) => (
        <Button
          key={`${index}-${label}`}
          variant='ghost'
          onClick={() => onNavigate(index + 1)}
        >
          {' '}
          / {label}
        </Button>
      ))}
    </nav>
  )
}
