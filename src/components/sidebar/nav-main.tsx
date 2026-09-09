'use client'

import type { LucideIcon } from 'lucide-react'
import { ChartNoAxesGanttIcon, EditIcon, FolderOpenIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { useSidebarStore } from '@/stores/sidebar-store'
import { UserRole } from '@/types/auth'

interface NavigationItem {
  name: string
  url: string
  icon: LucideIcon
  matchPrefixes?: string[]
  minimumRole: UserRole
}

const projects: NavigationItem[] = [
  {
    name: 'projects',
    url: '/project',
    icon: FolderOpenIcon,
    minimumRole: UserRole.VISITOR,
  },
  {
    name: 'editor',
    url: '/editor',
    icon: EditIcon,
    minimumRole: UserRole.MEMBER,
  },
  {
    name: 'workflows',
    url: '/workflow',
    icon: ChartNoAxesGanttIcon,
    matchPrefixes: ['/workflow', '/task'],
    minimumRole: UserRole.MEMBER,
  },
]

export function NavMain({ role }: { role?: UserRole }) {
  const { activePage, setActivePage } = useSidebarStore()
  const pathname = usePathname()

  const t = useTranslations('Sidebar')

  useEffect(() => {
    if (pathname) {
      const currentPage = projects.find((item) =>
        (item.matchPrefixes ?? [item.url]).some((prefix) =>
          pathname.startsWith(prefix),
        ),
      )
      if (currentPage) {
        setActivePage(currentPage.name)
      }
    }
  }, [pathname, setActivePage])

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarSeparator />
        {projects.map((item) => {
          if (role === undefined || role < item.minimumRole) return null
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                isActive={item.name === activePage}
                onClick={() => setActivePage(item.name)}
                tooltip={item.name}
              >
                <Link href={item.url}>
                  <item.icon />
                  <span>{t(item.name)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
