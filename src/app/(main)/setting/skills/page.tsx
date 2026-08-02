import { BookOpenIcon } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SkillManagement } from '@/components/settings/skill-management'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('setting.skill_management')
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function SkillManagementPage() {
  const t = await getTranslations('setting.skill_management')

  return (
    <SidebarInset className='flex h-screen flex-col'>
      <header className='flex shrink-0 flex-col border-b'>
        <div className='flex h-12 items-center justify-between bg-background px-4'>
          <div className='flex items-center gap-2'>
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
        </div>
      </header>
      <main className='flex-1 overflow-y-auto'>
        <div className='container mx-auto max-w-7xl space-y-8 px-6 py-8'>
          <div className='mb-8'>
            <div className='mb-2 flex items-center gap-3'>
              <BookOpenIcon className='size-8 text-primary' />
              <h1 className='text-balance text-4xl font-semibold'>
                {t('title')}
              </h1>
            </div>
            <p className='text-pretty text-muted-foreground'>
              {t('description')}
            </p>
          </div>
          <SkillManagement />
        </div>
      </main>
    </SidebarInset>
  )
}
