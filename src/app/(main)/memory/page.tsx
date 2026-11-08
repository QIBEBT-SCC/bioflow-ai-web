import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import {
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import { ToolMemoryManagement } from '@/components/tool/tool-memory-management'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('tool.Memory')
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function ToolMemoryManagementPage() {
  const t = await getTranslations('tool.Memory')

  return (
    <PageShell breadcrumbs={[{ label: t('breadcrumb') }]}>
      <PageContainer>
        <PageHeader title={t('title')} description={t('description')} />
        <Suspense>
          <ToolMemoryManagement />
        </Suspense>
      </PageContainer>
    </PageShell>
  )
}
