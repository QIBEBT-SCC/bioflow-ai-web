'use client'

import {
  BoxesIcon,
  BrainCircuitIcon,
  ContainerIcon,
  GitBranchIcon,
  PlusIcon,
  RefreshCwIcon,
  WrenchIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { NodeLibraryOverviewStats } from '@/hooks/use-node-library'

function HeroStatCard({
  icon,
  value,
  isLoading,
  label,
  sub,
}: {
  icon: React.ReactNode
  value: number
  isLoading: boolean
  label: string
  sub: string
}) {
  return (
    <div className='relative flex flex-col justify-between rounded-xl border bg-background/85 p-4 backdrop-blur-xs transition-shadow hover:shadow-sm'>
      <span className='inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground [&_svg]:size-3.5 [&_svg]:text-primary'>
        {icon}
        {label}
      </span>
      <div className='mt-3'>
        {isLoading ? (
          <Skeleton className='h-9 w-24' />
        ) : (
          <span className='text-3xl font-semibold tracking-tight text-foreground tabular-nums sm:text-4xl'>
            {value.toLocaleString()}
          </span>
        )}
      </div>
      <p className='mt-1.5 text-xs text-muted-foreground tabular-nums'>{sub}</p>
    </div>
  )
}

export function LibraryHeroBanner({
  stats,
  isLoading,
  isFetching,
  onRefresh,
}: {
  stats: NodeLibraryOverviewStats
  isLoading: boolean
  isFetching: boolean
  onRefresh: () => void
}) {
  const t = useTranslations('Library.hero')

  return (
    <section className='relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm sm:p-8'>
      {/* Subtle biological DAG / node-topology backdrop using primary tokens only */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-primary/8 blur-3xl'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-primary/5 blur-3xl'
      />
      <svg
        aria-hidden='true'
        viewBox='0 0 600 260'
        className='pointer-events-none absolute top-0 right-0 h-full w-auto text-primary/10'
        fill='none'
      >
        <path
          d='M60 190 C 160 190, 170 90, 270 90 C 370 90, 390 160, 500 110'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeDasharray='5 5'
        />
        <path
          d='M120 55 C 220 55, 240 155, 340 155 C 430 155, 455 60, 555 60'
          stroke='currentColor'
          strokeWidth='1.2'
        />
        <circle cx='60' cy='190' r='5' fill='currentColor' />
        <circle cx='270' cy='90' r='6' fill='currentColor' />
        <circle cx='500' cy='110' r='5' fill='currentColor' />
        <circle cx='120' cy='55' r='4' fill='currentColor' />
        <circle cx='340' cy='155' r='5' fill='currentColor' />
        <circle cx='555' cy='60' r='4' fill='currentColor' />
      </svg>

      <div className='relative z-10 space-y-6'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <span className='inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success'>
            <span className='relative flex size-2'>
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75' />
              <span className='relative inline-flex size-2 rounded-full bg-success' />
            </span>
            {t('statusLive')}
          </span>

          <div className='flex flex-wrap items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={onRefresh}
              disabled={isFetching}
            >
              <RefreshCwIcon
                className={isFetching ? 'size-4 animate-spin' : 'size-4'}
              />
              {isFetching ? t('refreshing') : t('refreshButton')}
            </Button>
            <Button size='sm' asChild>
              <Link href='/tool/add'>
                <PlusIcon className='size-4' />
                {t('addToolCta')}
              </Link>
            </Button>
          </div>
        </div>

        <div className='max-w-3xl space-y-2'>
          <p className='text-xs font-semibold tracking-widest text-primary uppercase'>
            {t('eyebrow')}
          </p>
          <h1 className='text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>
            {t('title')}
          </h1>
          <p className='text-sm leading-relaxed text-pretty text-muted-foreground sm:text-base'>
            {t('subtitle')}
          </p>
        </div>

        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'>
          <HeroStatCard
            icon={<GitBranchIcon />}
            value={stats.executableNodesTotal}
            isLoading={isLoading}
            label={t('stats.nodesLabel')}
            sub={t('stats.nodesSub', {
              tool: stats.toolsTotal,
              code: stats.codesTotal,
              subgraph: stats.subgraphsTotal,
            })}
          />
          <HeroStatCard
            icon={<WrenchIcon />}
            value={stats.toolsTotal}
            isLoading={isLoading}
            label={t('stats.toolsLabel')}
            sub={t('stats.toolsSub', { groups: stats.groupsTotal })}
          />
          <HeroStatCard
            icon={<ContainerIcon />}
            value={stats.imagesTotal}
            isLoading={isLoading}
            label={t('stats.imagesLabel')}
            sub={t('stats.imagesSub')}
          />
          <HeroStatCard
            icon={<BrainCircuitIcon />}
            value={stats.memoriesTotal}
            isLoading={isLoading}
            label={t('stats.memoriesLabel')}
            sub={t('stats.memoriesSub')}
          />
          <HeroStatCard
            icon={<BoxesIcon />}
            value={stats.resourcesTotal}
            isLoading={isLoading}
            label={t('stats.resourcesLabel')}
            sub={t('stats.resourcesSub', {
              dbs: stats.databasesTotal,
              genomes: stats.genomesTotal,
            })}
          />
        </div>
      </div>
    </section>
  )
}
