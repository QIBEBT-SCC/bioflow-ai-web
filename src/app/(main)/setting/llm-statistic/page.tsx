'use client'

import { BarChart3Icon, SettingsIcon, TrendingUpIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ModelConfigTab } from '@/components/settings/model-config-tab'
import { StatisticsTab } from '@/components/settings/statistics-tab'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function LLMStatisticPage() {
  const t = useTranslations('setting.llm_statistic')

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
              <BarChart3Icon className='size-8 text-primary' />
              <h1 className='text-4xl font-semibold text-balance'>
                {t('title')}
              </h1>
            </div>
            <p className='text-muted-foreground text-pretty'>
              {t('description')}
            </p>
          </div>

          <Tabs defaultValue='config' className='space-y-6'>
            <TabsList>
              <TabsTrigger value='config' className='gap-2'>
                <SettingsIcon className='size-4' />
                {t('tab_config')}
              </TabsTrigger>
              <TabsTrigger value='statistics' className='gap-2'>
                <TrendingUpIcon className='size-4' />
                {t('tab_statistics')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value='config' className='space-y-4'>
              <ModelConfigTab />
            </TabsContent>

            <TabsContent value='statistics' className='space-y-6'>
              <StatisticsTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </SidebarInset>
  )
}
