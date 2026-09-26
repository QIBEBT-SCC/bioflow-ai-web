import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import {
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import { CodingAgentManagement } from '@/components/settings/coding-agent-management'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('setting.coding_agent')
  return { title: t('title'), description: t('description') }
}

export default async function CodingAgentPage() {
  const t = await getTranslations('setting.coding_agent')
  return (
    <PageShell breadcrumbs={[{ label: t('breadcrumb') }]}>
      <PageContainer size='narrow'>
        <PageHeader title={t('title')} description={t('description')} />
        <CodingAgentManagement />
      </PageContainer>
    </PageShell>
  )
}
