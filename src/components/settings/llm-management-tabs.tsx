'use client'

import { CpuIcon, SettingsIcon, TrendingUpIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { AddProviderDialog } from '@/components/settings/add-provider-dialog'
import { ModelConfigTab } from '@/components/settings/model-config-tab'
import { ProviderList } from '@/components/settings/provider-list'
import { StatisticsTab } from '@/components/settings/statistics-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type LLMManagementTab = 'statistics' | 'assignment' | 'providers'

interface LLMManagementTabsProps {
  initialTab: LLMManagementTab
}

export function LLMManagementTabs({ initialTab }: LLMManagementTabsProps) {
  const t = useTranslations('setting.llm_management')
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(initialTab)

  const handleTabChange = (value: string) => {
    const tab = value as LLMManagementTab
    setActiveTab(tab)
    router.push(`/setting/llm?tab=${tab}`, { scroll: false })
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className='space-y-6'
    >
      <TabsList>
        <TabsTrigger value='statistics' className='gap-2'>
          <TrendingUpIcon className='size-4' />
          {t('tab_statistics')}
        </TabsTrigger>
        <TabsTrigger value='assignment' className='gap-2'>
          <SettingsIcon className='size-4' />
          {t('tab_assignment')}
        </TabsTrigger>
        <TabsTrigger value='providers' className='gap-2'>
          <CpuIcon className='size-4' />
          {t('tab_providers')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value='statistics' className='space-y-6'>
        <StatisticsTab />
      </TabsContent>

      <TabsContent value='assignment' className='space-y-4'>
        <ModelConfigTab />
      </TabsContent>

      <TabsContent value='providers' className='space-y-4'>
        <div className='flex justify-end'>
          <AddProviderDialog />
        </div>
        <ProviderList />
      </TabsContent>
    </Tabs>
  )
}
