'use client'

import { useTranslations } from 'next-intl'
import { PageContainer, PageShell } from '@/components/layout/page-shell'
import { LibraryAssetBrowser } from '@/components/library/library-asset-browser'
import { LibraryGroupsAndMemories } from '@/components/library/library-groups-and-memories'
import { LibraryHeroBanner } from '@/components/library/library-hero-banner'
import { useNodeLibraryOverview } from '@/hooks/use-node-library'

export default function LibraryPageClient() {
  const t = useTranslations('Library')
  const { stats, taxonomy, recentMemories, isLoading, isFetching, refetchAll } =
    useNodeLibraryOverview()

  return (
    <PageShell breadcrumbs={[{ label: t('breadcrumb') }]}>
      <PageContainer size='wide' className='space-y-8'>
        <LibraryHeroBanner
          stats={stats}
          isLoading={isLoading}
          isFetching={isFetching}
          onRefresh={() => {
            void refetchAll()
          }}
        />
        <LibraryGroupsAndMemories
          taxonomy={taxonomy}
          recentMemories={recentMemories}
          stats={stats}
          isLoading={isLoading}
        />
        <LibraryAssetBrowser stats={stats} />
      </PageContainer>
    </PageShell>
  )
}
