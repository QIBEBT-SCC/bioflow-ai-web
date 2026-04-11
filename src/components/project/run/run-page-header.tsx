import Link from 'next/link'
import { ChatSidebarToggle } from '@/components/chat/chat-sidebar-toggle'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

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
  return (
    <header className='flex flex-col shrink-0 border-b'>
      <div className='flex h-12 items-center gap-2 bg-background px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='!mr-2 !h-4' />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Link
                href='/project'
                className='text-muted-foreground hover:text-foreground text-sm'
              >
                项目
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Link
                href={`/project/${projectId}`}
                className='text-muted-foreground hover:text-foreground text-sm'
              >
                {projectName ?? projectId}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{runName ?? runUid}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className='ml-auto'>
          <ChatSidebarToggle />
        </div>
      </div>
    </header>
  )
}
