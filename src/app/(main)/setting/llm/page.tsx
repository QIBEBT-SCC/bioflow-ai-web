import { SettingsIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import {
  type LLMManagementTab,
  LLMManagementTabs,
} from '@/components/settings/llm-management-tabs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

const VALID_TABS: LLMManagementTab[] = ['statistics', 'assignment', 'providers']

interface LLMManagementPageProps {
  searchParams: Promise<{ tab?: string | string[] }>
}

export default async function LLMManagementPage({
  searchParams,
}: LLMManagementPageProps) {
  const [{ tab }, t] = await Promise.all([
    searchParams,
    getTranslations('setting.llm_management'),
  ])
  const initialTab =
    typeof tab === 'string' && VALID_TABS.includes(tab as LLMManagementTab)
      ? (tab as LLMManagementTab)
      : 'statistics'

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
              <h1 className='text-4xl font-semibold text-balance'>
                {t('title')}
              </h1>
            </div>
            <p className='text-muted-foreground text-pretty'>
              {t('description')}
            </p>
          </div>

          <LLMManagementTabs key={initialTab} initialTab={initialTab} />
        </div>
      </main>
    </SidebarInset>
  )
}
