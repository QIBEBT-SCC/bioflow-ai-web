'use client'

import {
  ChevronRightIcon,
  ServerCogIcon,
  SettingsIcon,
  WrenchIcon,
} from 'lucide-react'
import Link from 'next/link'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { useSidebarStore } from '@/stores/sidebar-store'
import { useTranslations } from 'next-intl'

const projects = [
  {
    name: 'tool_config',
    icon: WrenchIcon,
    items: [
      { name: 'images', url: '/image' },
      { name: 'tools', url: '/tool' },
    ],
  },
  {
    name: 'resource',
    url: '/resource',
    icon: ServerCogIcon,
  },
  {
    name: 'setting',
    icon: SettingsIcon,
    items: [
      { name: 'llm_statistic', url: '/setting/llm-statistic' },
      { name: 'llm_setting', url: '/setting/llm-setting' },
    ],
  },
]

export function NavSecond() {
  const { activePage, setActivePage } = useSidebarStore()
  const t = useTranslations('Sidebar')

  return (
    <SidebarGroup className='group-data-[collapsible=icon]:hidden'>
      <SidebarGroupLabel>{t('admin')}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {projects.map((item) =>
            item.items ? (
              <Collapsible
                key={item.name}
                asChild
                defaultOpen={item.name === activePage}
                className='group/collapsible'
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton onClick={() => setActivePage(item.name)}>
                      {item.icon && <item.icon />}
                      <span>{t(item.name)}</span>
                      <ChevronRightIcon className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.name}>
                          <SidebarMenuSubButton asChild>
                            <Link href={subItem.url ?? '/'}>
                              <span>{t(subItem.name)}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={item.name === activePage}
                  onClick={() => setActivePage(item.name)}
                >
                  <Link href={item.url ?? '/'}>
                    {item.icon && <item.icon />}
                    <span>{t(item.name)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ),
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
