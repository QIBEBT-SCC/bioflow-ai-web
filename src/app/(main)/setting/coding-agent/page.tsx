import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import {
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import {
  CodingAgentManagement,
  type CodingAgentSettingsTab,
} from '@/components/settings/coding-agent-management'

const VALID_AGENTS: CodingAgentSettingsTab[] = ['codex', 'opencode']

interface CodingAgentPageProps {
  searchParams: Promise<{ agent?: string | string[] }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('setting.coding_agent')
  return { title: t('title'), description: t('description') }
}

export default async function CodingAgentPage({
  searchParams,
}: CodingAgentPageProps) {
  const [{ agent }, t] = await Promise.all([
    searchParams,
    getTranslations('setting.coding_agent'),
  ])
  const initialAgent =
    typeof agent === 'string' &&
    VALID_AGENTS.includes(agent as CodingAgentSettingsTab)
      ? (agent as CodingAgentSettingsTab)
      : 'codex'
  return (
    <PageShell breadcrumbs={[{ label: t('breadcrumb') }]}>
      <PageContainer size='narrow'>
        <PageHeader title={t('title')} description={t('description')} />
        <CodingAgentManagement key={initialAgent} initialAgent={initialAgent} />
      </PageContainer>
    </PageShell>
  )
}
