import type { Metadata } from 'next'
import { WorkflowRunFlow } from '@/components/workflow/workflow-run-flow'

export const metadata: Metadata = {
  title: '工作流运行 | BioFlow AI',
  description: '查看工作流运行进度和节点状态',
}

export default async function WorkflowRunPage({
  params,
}: {
  params: Promise<{ uid: string }>
}) {
  const { uid } = await params
  return <WorkflowRunFlow uid={uid} />
}
