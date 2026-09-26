'use client'

import { useTranslations } from 'next-intl'
import {
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import { DatabasesManager } from '@/components/resource/databases/database-manager'

export default function ResourcePage() {
  const t = useTranslations('resource')

  return (
    <PageShell breadcrumbs={[{ label: t('title') }, { label: t('databases') }]}>
      <PageContainer>
        <PageHeader title={t('title')} description={t('description')} />
        <DatabasesManager />
      </PageContainer>
    </PageShell>
  )
}
