'use client'

import { FileCode, FlaskConical, TestTubeDiagonal } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { ChatSidebarToggle } from '@/components/chat/chat-sidebar-toggle'
import { ProjectDetailCard } from '@/components/project/project-detail-card'
import { ProjectFileMappings } from '@/components/project/project-file-mappings'
import { ProjectWorkflowList } from '@/components/project-workflow/project-workflow-list'
import { SampleList } from '@/components/sample/sample-list'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
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

export default function ProjectDetailPage() {
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
            <Separator orientation='vertical' className='!mr-2 !h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbLink asChild>
                    <Link href='/project'>Projects</Link>
                  </BreadcrumbLink>
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
    <SidebarInset className='h-screen flex flex-row'>
      <div className='flex-1 flex flex-col min-w-0'>
        <header className='flex flex-col shrink-0 border-b'>
          <div className='flex items-center gap-2 px-4 h-12 bg-background'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='!mr-2 !h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbLink asChild>
                    <Link href='/project'>Projects</Link>
                    {/*Projects*/}
                  </BreadcrumbLink>
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
        <div className='container mx-auto px-4 py-6 space-y-6'>
          {/* 返回和项目标题 */}
          <ProjectDetailCard />

          {/* 项目内容标签页 */}
          <Tabs defaultValue='samples' className='w-full'>
            <TabsList className='grid grid-cols-4 md:w-auto md:inline-flex'>
              <TabsTrigger value='samples' className='flex items-center'>
                <TestTubeDiagonal className='size-4 mr-2' />
                样本
              </TabsTrigger>
              <TabsTrigger value='file-mappings' className='flex items-center'>
                <FileCode className='size-4 mr-2' />
                全局文件
              </TabsTrigger>
              <TabsTrigger value='workflows' className='flex items-center'>
                <FlaskConical className='size-4 mr-2' />
                工作流
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
