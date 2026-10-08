'use client'

import {
  FileCode,
  FilesIcon,
  FlaskConical,
  TestTubeDiagonal,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ProjectAgentArtifacts } from '@/components/agent-artifact/project-agent-artifacts'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { ChatSidebarToggle } from '@/components/chat/chat-sidebar-toggle'
import { PageTopbar } from '@/components/layout/page-shell'
import { ProjectDetailCard } from '@/components/project/project-detail-card'
import { ProjectFileMappings } from '@/components/project/project-file-mappings'
import { ProjectWorkflowList } from '@/components/project-workflow/project-workflow-list'
import { SampleList } from '@/components/sample/sample-list'
import { SidebarInset } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useChatSidebarResize } from '@/hooks/use-chat-sidebar-resize'
import { useProject } from '@/hooks/use-project'
import { useChatSidebarStore } from '@/stores/chat-sidebar-store'

export default function ProjectDetailPageClient({
  projectListHref,
}: {
  projectListHref: string
}) {
  const t = useTranslations('Project.detail')
  const params = useParams()
  const projectId = params.id as string
  const { data: project } = useProject(projectId)
  const isOpen = useChatSidebarStore((s) => s.isOpen)

  const { chatSidebarWidth, handleChatResizeStart } = useChatSidebarResize()

  const breadcrumbs = [
    { label: t('breadcrumb.projects'), href: projectListHref },
    { label: project?.name ?? '…' },
  ]

  if (!project) {
    return (
      <SidebarInset className='flex h-screen flex-col overflow-hidden'>
        <PageTopbar breadcrumbs={breadcrumbs} />
        <div className='mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8'>
          <Skeleton className='h-10 w-72' />
          <div className='grid gap-3 md:grid-cols-3'>
            <Skeleton className='h-24 rounded-xl' />
            <Skeleton className='h-24 rounded-xl' />
            <Skeleton className='h-24 rounded-xl' />
          </div>
          <Skeleton className='h-80 rounded-xl' />
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset className='flex h-screen flex-row overflow-hidden'>
      <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
        <PageTopbar breadcrumbs={breadcrumbs} actions={<ChatSidebarToggle />} />
        <div className='mx-auto min-h-0 w-full max-w-7xl flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6 lg:flex lg:flex-col lg:gap-6 lg:space-y-0 lg:overflow-hidden lg:py-8'>
          {/* 返回和项目标题 */}
          <div className='shrink-0'>
            <ProjectDetailCard />
          </div>

          {/* 项目内容标签页 */}
          <Tabs defaultValue='samples' className='w-full lg:min-h-0 lg:flex-1'>
            <TabsList className='grid h-auto shrink-0 grid-cols-2 md:inline-flex md:w-auto'>
              <TabsTrigger value='samples'>
                <TestTubeDiagonal className='size-4' />
                {t('tabs.samples')}
              </TabsTrigger>
              <TabsTrigger value='file-mappings'>
                <FileCode className='size-4' />
                {t('tabs.fileMappings')}
              </TabsTrigger>
              <TabsTrigger value='workflows'>
                <FlaskConical className='size-4' />
                {t('tabs.workflows')}
              </TabsTrigger>
              <TabsTrigger value='agent-files'>
                <FilesIcon className='size-4' />
                {t('tabs.agentArtifacts')}
              </TabsTrigger>
            </TabsList>

            {/* 样本标签页内容 */}
            <TabsContent
              value='samples'
              className='mt-4 lg:min-h-0 lg:overflow-y-auto lg:pr-2 lg:overscroll-contain lg:[scrollbar-gutter:stable]'
            >
              <SampleList projectId={projectId} />
            </TabsContent>

            {/* 全局文件标签页内容 */}
            <TabsContent
              value='file-mappings'
              className='mt-4 lg:min-h-0 lg:overflow-y-auto lg:pr-2 lg:overscroll-contain lg:[scrollbar-gutter:stable]'
            >
              <ProjectFileMappings projectId={projectId} />
            </TabsContent>

            {/* 工作流标签页内容 */}
            <TabsContent
              value='workflows'
              className='mt-4 lg:min-h-0 lg:overflow-y-auto lg:pr-2 lg:overscroll-contain lg:[scrollbar-gutter:stable]'
            >
              <ProjectWorkflowList projectId={projectId} />
            </TabsContent>

            <TabsContent
              value='agent-files'
              className='mt-4 lg:min-h-0 lg:overflow-y-auto lg:pr-2 lg:overscroll-contain lg:[scrollbar-gutter:stable]'
            >
              <ProjectAgentArtifacts projectId={projectId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {isOpen && (
        <ChatSidebar
          projectId={projectId}
          width={chatSidebarWidth}
          onResizeStartAction={handleChatResizeStart}
        />
      )}
    </SidebarInset>
  )
}
