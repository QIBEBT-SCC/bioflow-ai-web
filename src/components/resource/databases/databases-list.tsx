'use client'

import { useTranslations } from 'next-intl'
import { statusToneClasses } from '@/lib/status'
import { cn } from '@/lib/utils'
import type { BioDbSimple } from '@/types/resource'

interface DatabasesListProps {
  databases: BioDbSimple[]
  selectedDbId: number | null
  onSelectDatabase: (id: number) => void
}

export function DatabasesList({
  databases,
  selectedDbId,
  onSelectDatabase,
}: DatabasesListProps) {
  const t = useTranslations('resource')

  return (
    <nav aria-label={t('database_list')} className='space-y-0.5'>
      {databases.map((db) => {
        const selected = db.id === selectedDbId
        return (
          <button
            key={db.id}
            type='button'
            aria-current={selected ? 'true' : undefined}
            onClick={() => onSelectDatabase(db.id)}
            className={cn(
              'flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted',
              selected && 'bg-accent text-accent-foreground hover:bg-accent',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'mt-1.5 size-2 shrink-0 rounded-full',
                db.path
                  ? statusToneClasses.success.dot
                  : statusToneClasses.neutral.dot,
              )}
            />
            <span className='min-w-0 flex-1'>
              <span className='block truncate text-sm font-medium'>
                {db.name}
              </span>
              {db.path ? (
                <span className='block truncate font-mono text-xs text-muted-foreground'>
                  {db.path}
                </span>
              ) : (
                <span className='block truncate text-xs text-muted-foreground'>
                  {t('status_not_downloaded')}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
