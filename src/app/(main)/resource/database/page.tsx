'use client'

import { useTranslations } from 'next-intl'
import { DatabasesManager } from '@/components/resource/databases/database-manager'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

export default function ResourcePage() {
  const t = useTranslations('resource')

  return (
    <SidebarInset className='h-screen flex flex-col'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center gap-2 px-4 h-12 bg-background'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2! h-4!' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbPage>{t('title')}</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbPage>{t('databases')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className='flex-1 overflow-y-auto'>
        <div className='container mx-auto py-6'>
          <div className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6'>
            <div>
              <h1 className='text-2xl font-semibold tracking-tight'>
                {t('title')}
              </h1>
              <p className='text-muted-foreground'>{t('description')}</p>
            </div>
          </div>
          <DatabasesManager />
        </div>
      </div>
    </SidebarInset>
  )
}
