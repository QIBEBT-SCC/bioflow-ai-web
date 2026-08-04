import { BellRingIcon } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { NotificationManagement } from '@/components/settings/notification-management'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('setting.notification_management')
  return { title: t('title'), description: t('description') }
}

export default async function NotificationManagementPage() {
  const t = await getTranslations('setting.notification_management')

  return (
    <SidebarInset className='flex h-screen flex-col'>
      <header className='flex shrink-0 flex-col border-b'>
        <div className='flex h-12 items-center bg-background px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2! h-4!' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbPage>{t('breadcrumb')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <main className='flex-1 overflow-y-auto'>
        <div className='container mx-auto max-w-5xl space-y-8 px-6 py-8'>
          <div className='mb-8'>
            <div className='mb-2 flex items-center gap-3'>
              <BellRingIcon className='size-8 text-primary' />
              <h1 className='text-balance text-4xl font-semibold'>
                {t('title')}
              </h1>
            </div>
            <p className='text-pretty text-muted-foreground'>
              {t('description')}
            </p>
          </div>
          <NotificationManagement />
        </div>
      </main>
    </SidebarInset>
  )
}
