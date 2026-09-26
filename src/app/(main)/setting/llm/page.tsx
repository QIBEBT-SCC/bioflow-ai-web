import { getTranslations } from 'next-intl/server'
import {
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import {
  type LLMManagementTab,
  LLMManagementTabs,
} from '@/components/settings/llm-management-tabs'

const VALID_TABS: LLMManagementTab[] = ['statistics', 'assignment', 'providers']

interface LLMManagementPageProps {
  searchParams: Promise<{ tab?: string | string[] }>
}

export default async function LLMManagementPage({
  searchParams,
}: LLMManagementPageProps) {
  const [{ tab }, t] = await Promise.all([
    searchParams,
    getTranslations('setting.llm_management'),
  ])
  const initialTab =
    typeof tab === 'string' && VALID_TABS.includes(tab as LLMManagementTab)
      ? (tab as LLMManagementTab)
      : 'statistics'

  return (
    <PageShell breadcrumbs={[{ label: t('breadcrumb') }]}>
      <PageContainer>
        <PageHeader title={t('title')} description={t('description')} />
        <LLMManagementTabs key={initialTab} initialTab={initialTab} />
      </PageContainer>
    </PageShell>
  )
}
