'use client'

import { useTranslations } from 'next-intl'
import {
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import { UserManagement } from '@/components/settings/user-management'

export default function UserManagementPage() {
  const t = useTranslations('setting.user_management')

  return (
    <PageShell breadcrumbs={[{ label: t('breadcrumb') }]}>
      <PageContainer>
        <PageHeader title={t('title')} description={t('description')} />
        <UserManagement />
      </PageContainer>
    </PageShell>
  )
}
