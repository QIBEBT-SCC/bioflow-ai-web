import { useTranslations } from 'next-intl'
import { ChatSidebarToggle } from '@/components/chat/chat-sidebar-toggle'
import { PageTopbar } from '@/components/layout/page-shell'

interface RunPageHeaderProps {
  projectId: string
  runUid: string
  projectName?: string
  runName?: string
}

export function RunPageHeader({
  projectId,
  runUid,
  projectName,
  runName,
}: RunPageHeaderProps) {
  const t = useTranslations('Project.detail.breadcrumb')

  return (
    <PageTopbar
      breadcrumbs={[
        { label: t('projects'), href: '/project' },
        { label: projectName ?? projectId, href: `/project/${projectId}` },
        { label: runName ?? runUid },
      ]}
      actions={<ChatSidebarToggle />}
    />
  )
}
