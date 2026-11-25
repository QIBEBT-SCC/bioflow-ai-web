'use client'

import {
  ArrowUpRightIcon,
  BrainCircuitIcon,
  DatabaseIcon,
  DnaIcon,
  FolderTreeIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import type { LibraryTaxonomy } from '@/app/actions/library'
import { LibraryTaxonomy3D } from '@/components/library/library-taxonomy-3d'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { NodeLibraryOverviewStats } from '@/hooks/use-node-library'
import type { ToolMemoryListItem } from '@/types/tool-memory'

export function LibraryGroupsAndMemories({
  taxonomy,
  recentMemories,
  stats,
  isLoading,
}: {
  taxonomy: LibraryTaxonomy
  recentMemories: ToolMemoryListItem[]
  stats: NodeLibraryOverviewStats
  isLoading: boolean
}) {
  const t = useTranslations('Library.overview')
  const locale = useLocale()

  return (
    <section className='grid gap-4 lg:grid-cols-12'>
      {/* 3D Group × Tag Knowledge Atlas */}
      <div className='flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm lg:col-span-8'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between gap-3'>
            <div className='flex items-center gap-2'>
              <FolderTreeIcon className='size-4 text-primary' />
              <h2 className='text-base font-semibold'>{t('groupsTitle')}</h2>
            </div>

            <Button variant='ghost' size='xs' asChild>
              <Link href='/tool'>
                {t('viewAllTools')}
                <ArrowUpRightIcon className='size-3.5' />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <Skeleton className='h-[430px] w-full rounded-xl' />
          ) : taxonomy.groups.length === 0 ? (
            <div className='rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground'>
              {t('groupsEmpty')}
            </div>
          ) : (
            <LibraryTaxonomy3D taxonomy={taxonomy} />
          )}
        </div>

        <div className='mt-5 border-t pt-4'>
          <p className='mb-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
            {t('resourcesTitle')}
          </p>
          <div className='flex flex-wrap gap-2'>
            <Button variant='outline' size='sm' asChild>
              <Link href='/resource/database'>
                <DatabaseIcon className='size-3.5 text-primary' />
                {t('databasesLink', { count: stats.databasesTotal })}
              </Link>
            </Button>
            <Button variant='outline' size='sm' asChild>
              <Link href='/resource/genome'>
                <DnaIcon className='size-3.5 text-primary' />
                {t('genomesLink', { count: stats.genomesTotal })}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Real Recent Tool Memories */}
      <div className='rounded-xl border bg-card p-5 shadow-sm lg:col-span-4'>
        <div className='mb-4 flex flex-wrap items-start justify-between gap-2'>
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <BrainCircuitIcon className='size-4 text-success' />
              <h2 className='text-base font-semibold'>{t('memoriesTitle')}</h2>
            </div>
            <p className='text-xs text-muted-foreground'>{t('memoriesDesc')}</p>
          </div>
          <Button variant='ghost' size='xs' asChild>
            <Link href='/memory'>
              {t('viewAllMemories')}
              <ArrowUpRightIcon className='size-3.5' />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className='space-y-2.5'>
            {['m1', 'm2', 'm3', 'm4'].map((key) => (
              <Skeleton key={key} className='h-16 rounded-lg' />
            ))}
          </div>
        ) : recentMemories.length === 0 ? (
          <div className='rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground'>
            {t('memoriesEmpty')}
          </div>
        ) : (
          <div className='space-y-2.5'>
            {recentMemories.map((memory) => (
              <Link
                key={memory.uid}
                href={`/tool/${memory.tool_uid}`}
                className='block rounded-lg border bg-muted/25 p-3 transition-colors hover:border-primary/40 hover:bg-muted/50'
              >
                <div className='flex items-center justify-between gap-2'>
                  <Badge
                    variant='outline'
                    className='border-success/30 bg-success/10 font-mono text-[11px] text-success'
                  >
                    {memory.tool_name}
                  </Badge>
                  <span
                    className='text-[11px] text-muted-foreground tabular-nums'
                    suppressHydrationWarning
                  >
                    {new Date(memory.created_at).toLocaleDateString(locale)}
                  </span>
                </div>
                <p className='mt-1.5 line-clamp-2 text-xs text-foreground'>
                  {memory.description}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
