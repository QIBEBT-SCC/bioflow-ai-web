import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import {
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import { NotificationManagement } from '@/components/settings/notification-management'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('setting.notification_management')
  return { title: t('title'), description: t('description') }
}

export default async function NotificationManagementPage() {
  const t = await getTranslations('setting.notification_management')

  return (
    <PageShell breadcrumbs={[{ label: t('breadcrumb') }]}>
      <PageContainer>
        <PageHeader title={t('title')} description={t('description')} />
        <NotificationManagement />
      </PageContainer>
    </PageShell>
  )
}
