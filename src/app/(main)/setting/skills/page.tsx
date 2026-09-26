import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import {
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import { SkillManagement } from '@/components/settings/skill-management'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('setting.skill_management')
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function SkillManagementPage() {
  const t = await getTranslations('setting.skill_management')

  return (
    <PageShell breadcrumbs={[{ label: t('breadcrumb') }]}>
      <PageContainer>
        <PageHeader title={t('title')} description={t('description')} />
        <SkillManagement />
      </PageContainer>
    </PageShell>
  )
}
