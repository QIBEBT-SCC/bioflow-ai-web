import { BotIcon } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import {
  CodingAgentManagement,
  type CodingAgentSettingsTab,
} from '@/components/settings/coding-agent-management'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

const VALID_AGENTS: CodingAgentSettingsTab[] = ['codex', 'opencode']

interface CodingAgentPageProps {
  searchParams: Promise<{ agent?: string | string[] }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('setting.coding_agent')
  return { title: t('title'), description: t('description') }
}

export default async function CodingAgentPage({
  searchParams,
}: CodingAgentPageProps) {
  const [{ agent }, t] = await Promise.all([
    searchParams,
    getTranslations('setting.coding_agent'),
  ])
  const initialAgent =
    typeof agent === 'string' &&
    VALID_AGENTS.includes(agent as CodingAgentSettingsTab)
      ? (agent as CodingAgentSettingsTab)
      : 'codex'
  return (
    <SidebarInset className='flex h-screen flex-col'>
      <header className='flex h-12 shrink-0 items-center border-b bg-background px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mx-2 h-4!' />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{t('breadcrumb')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <main className='flex-1 overflow-y-auto'>
        <div className='container mx-auto max-w-5xl space-y-8 px-6 py-8'>
          <div>
            <div className='mb-2 flex items-center gap-3'>
              <BotIcon className='size-8 text-primary' />
              <h1 className='text-4xl font-semibold'>{t('title')}</h1>
            </div>
            <p className='text-muted-foreground'>{t('description')}</p>
          </div>
          <CodingAgentManagement
            key={initialAgent}
            initialAgent={initialAgent}
          />
        </div>
      </main>
    </SidebarInset>
  )
}
