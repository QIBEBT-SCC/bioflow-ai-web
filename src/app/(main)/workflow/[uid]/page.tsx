import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { WorkflowRunFlow } from '@/components/workflow/workflow-run-flow'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('workflowMonitor')
  return { title: t('runPageTitle'), description: t('runPageDescription') }
}

export default async function WorkflowRunPage({
  params,
}: {
  params: Promise<{ uid: string }>
}) {
  const { uid } = await params
  return <WorkflowRunFlow uid={uid} />
}
