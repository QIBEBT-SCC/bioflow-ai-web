'use client'

import { DnaIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { GenomeManager } from '@/components/resource/genome/genome-manager'
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
                <BreadcrumbPage>{t('genome.breadcrumb')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <main className='flex-1 overflow-y-auto'>
        <div className='container mx-auto px-6 py-8 max-w-7xl space-y-8'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-2'>
              <DnaIcon className='size-8 text-primary' />
              <h1 className='text-4xl font-semibold text-balance'>
                {t('genome.title')}
              </h1>
            </div>
            <p className='text-muted-foreground'>{t('genome.description')}</p>
          </div>

          {/* 主体 */}
          <GenomeManager />
        </div>
      </main>
    </SidebarInset>
  )
}
