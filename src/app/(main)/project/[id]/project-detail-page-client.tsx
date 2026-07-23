'use client'

import { FileCode, FlaskConical, TestTubeDiagonal } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { ChatSidebarToggle } from '@/components/chat/chat-sidebar-toggle'
import { ProjectDetailCard } from '@/components/project/project-detail-card'
import { ProjectFileMappings } from '@/components/project/project-file-mappings'
import { ProjectListBreadcrumbLink } from '@/components/project/project-list-navigation'
import { ProjectWorkflowList } from '@/components/project-workflow/project-workflow-list'
import { SampleList } from '@/components/sample/sample-list'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
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

  if (!project) {
    return (
      <SidebarInset>
        <header className='flex flex-col shrink-0 border-b'>
          <div className='flex items-center gap-2 px-4 h-12 bg-background'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2! h-4!' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <ProjectListBreadcrumbLink href={projectListHref}>
                    {t('breadcrumb.projects')}
                  </ProjectListBreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className='hidden md:block' />
                <BreadcrumbItem>
                  <BreadcrumbPage>--</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div></div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset className='flex h-screen flex-row overflow-hidden'>
      <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
        <header className='flex flex-col shrink-0 border-b'>
          <div className='flex items-center gap-2 px-4 h-12 bg-background'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2! h-4!' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <ProjectListBreadcrumbLink href={projectListHref}>
                    {t('breadcrumb.projects')}
                  </ProjectListBreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className='hidden md:block' />
                <BreadcrumbItem>
                  <BreadcrumbPage>{project.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className='ml-auto'>
              <ChatSidebarToggle />
            </div>
          </div>
        </header>
        <div className='container mx-auto min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-6'>
          {/* 返回和项目标题 */}
          <ProjectDetailCard projectListHref={projectListHref} />

          {/* 项目内容标签页 */}
          <Tabs defaultValue='samples' className='w-full'>
            <TabsList className='grid grid-cols-3 md:inline-flex md:w-auto'>
              <TabsTrigger value='samples' className='flex items-center'>
                <TestTubeDiagonal className='size-4 mr-2' />
                {t('tabs.samples')}
              </TabsTrigger>
              <TabsTrigger value='file-mappings' className='flex items-center'>
                <FileCode className='size-4 mr-2' />
                {t('tabs.fileMappings')}
              </TabsTrigger>
              <TabsTrigger value='workflows' className='flex items-center'>
                <FlaskConical className='size-4 mr-2' />
                {t('tabs.workflows')}
              </TabsTrigger>
            </TabsList>

            {/* 样本标签页内容 */}
            <TabsContent value='samples' className='mt-6'>
              <SampleList projectId={projectId} />
            </TabsContent>

            {/* 全局文件标签页内容 */}
            <TabsContent value='file-mappings' className='mt-6'>
              <ProjectFileMappings projectId={projectId} />
            </TabsContent>

            {/* 工作流标签页内容 */}
            <TabsContent value='workflows' className='mt-6'>
              <ProjectWorkflowList projectId={projectId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {isOpen && (
        <ChatSidebar
          pageKey={`project-${projectId}`}
          width={chatSidebarWidth}
          onResizeStartAction={handleChatResizeStart}
        />
      )}
    </SidebarInset>
  )
}
