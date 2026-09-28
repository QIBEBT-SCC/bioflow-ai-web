import { useTranslations } from 'next-intl'
import { ChatSidebarToggle } from '@/components/chat/chat-sidebar-toggle'
import { PageTopbar } from '@/components/layout/page-shell'
import type { WorkflowRunV2 } from '@/types/workflow-v2'

interface RunPageHeaderProps {
  projectId: string
  runUid: string
  projectName?: string
  run?: WorkflowRunV2 | null
}

export function RunPageHeader({
  projectId,
  runUid,
  projectName,
  run,
}: RunPageHeaderProps) {
  const t = useTranslations('Project.detail.breadcrumb')

  return (
    <PageTopbar
      breadcrumbs={[
        { label: t('projects'), href: '/project' },
        { label: projectName ?? projectId, href: `/project/${projectId}` },
        ...(run?.parent_run_uid
          ? [
              {
                label: run.parent_run_name ?? run.parent_run_uid,
                href: `/project/${projectId}/${run.parent_run_uid}`,
              },
              { label: run.parent_node_name ?? 'ForEach' },
            ]
          : []),
        { label: run?.item_name ?? run?.name ?? runUid },
      ]}
      actions={<ChatSidebarToggle />}
    />
  )
}
