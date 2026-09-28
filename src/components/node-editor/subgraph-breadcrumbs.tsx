'use client'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

/** Inline subgraph path for canvases without a page topbar; hidden at the root. */
export function SubgraphBreadcrumbs({
  labels,
  onNavigate,
}: {
  labels: string[]
  onNavigate: (depth: number) => void
}) {
  const t = useTranslations('editor.subgraph')
  if (!labels.length) return null
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
          / {label}
        </Button>
      ))}
    </nav>
  )
}
