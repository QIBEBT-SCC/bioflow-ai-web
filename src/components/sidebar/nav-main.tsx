'use client'

import {
  Bot,
  EditIcon,
  HomeIcon,
  NetworkIcon,
  TvMinimalIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useSidebarStore } from '@/stores/sidebar-store'

const projects = [
  {
    name: 'chat',
    url: '/chat',
    icon: Bot,
  },
  {
    name: 'projects',
    url: '/project',
    icon: HomeIcon,
  },
  {
    name: 'editor',
    url: '/editor',
    icon: EditIcon,
  },
  {
    name: 'workflows',
    url: '/workflow',
    icon: NetworkIcon,
    icon_rotate: true,
  },
  {
    name: 'tasks',
    url: '/task',
    icon: TvMinimalIcon,
  },
]

export function NavMain() {
  const { activePage, setActivePage } = useSidebarStore()
  const pathname = usePathname()

  const t = useTranslations('Sidebar')

  // 根据当前路径自动设置活动页面
  useEffect(() => {
    if (pathname) {
      const currentPage = projects.find((p) => pathname.startsWith(p.url))
      if (currentPage) {
        setActivePage(currentPage.name)
      }
    }
  }, [pathname, setActivePage])

  return (
    <SidebarGroup>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              isActive={item.name === activePage}
              onClick={() => setActivePage(item.name)}
              tooltip={item.name}
            >
              <Link href={item.url}>
                {item.icon_rotate ? (
                  <item.icon className='-rotate-90' />
                ) : (
                  <item.icon />
                )}
                <span>{t(item.name)}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
