'use client'

import { useTranslations } from 'next-intl'
import {
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import { GenomeManager } from '@/components/resource/genome/genome-manager'

export default function ResourcePage() {
  const t = useTranslations('resource')

  return (
    <PageShell
      breadcrumbs={[{ label: t('title') }, { label: t('genome.breadcrumb') }]}
    >
      <PageContainer>
        <PageHeader
          title={t('genome.title')}
          description={t('genome.description')}
        />
        <GenomeManager />
      </PageContainer>
    </PageShell>
  )
}
