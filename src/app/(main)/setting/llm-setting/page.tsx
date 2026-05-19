'use client'

import { SettingsIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AddProviderDialog } from '@/components/settings/add-provider-dialog'
import { ProviderList } from '@/components/settings/provider-list'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

export default function LLMSettingPage() {
  const t = useTranslations('setting.llm_setting')

  return (
    <SidebarInset className='h-screen flex flex-col'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center justify-between px-4 h-12 bg-background'>
          <div className='flex items-center gap-2'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='!mr-2 !h-4' />
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
        <div className='container mx-auto px-6 py-8 max-w-7xl space-y-8'>
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-2'>
              <SettingsIcon className='size-8 text-primary' />
              <h1 className='text-4xl font-bold text-balance'>{t('title')}</h1>
            </div>
            <p className='text-muted-foreground text-pretty'>
              {t('description')}
            </p>
          </div>
          <div className='space-y-4'>
            <div className='flex justify-end'>
              <AddProviderDialog />
            </div>
            <ProviderList />
          </div>
        </div>
      </main>
    </SidebarInset>
  )
}
