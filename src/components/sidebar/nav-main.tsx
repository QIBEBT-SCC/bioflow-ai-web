'use client'

import type { LucideIcon } from 'lucide-react'
import {
  ChartNoAxesGanttIcon,
  EditIcon,
  FolderOpenIcon,
  LayersIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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

const knowledgeItems: NavigationItem[] = [
  {
    name: 'node_library',
    url: '/library',
    icon: LayersIcon,
    matchPrefixes: ['/library'],
    minimumRole: UserRole.VISITOR,
  },
]

const workspaceItems: NavigationItem[] = [
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

const allNavItems = [...knowledgeItems, ...workspaceItems]

function NavGroupList({
  items,
  role,
  activePage,
  onSelect,
  t,
}: {
  items: NavigationItem[]
  role?: UserRole
  activePage: string
  onSelect: (name: string) => void
  t: (key: string) => string
}) {
  return (
    <SidebarMenu>
      {items.map((item) => {
        if (role === undefined || role < item.minimumRole) return null
        return (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              isActive={item.name === activePage}
              onClick={() => onSelect(item.name)}
              tooltip={t(item.name)}
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
  )
}

export function NavMain({ role }: { role?: UserRole }) {
  const { activePage, setActivePage } = useSidebarStore()
  const pathname = usePathname()
  const t = useTranslations('Sidebar')

  useEffect(() => {
    if (pathname) {
      const currentPage = allNavItems.find((item) =>
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
    <>
      <SidebarSeparator />
      <SidebarGroup>
        <SidebarGroupLabel>{t('group_knowledge')}</SidebarGroupLabel>
        <SidebarGroupContent>
          <NavGroupList
            items={knowledgeItems}
            role={role}
            activePage={activePage}
            onSelect={setActivePage}
            t={t}
          />
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>{t('group_workspace')}</SidebarGroupLabel>
        <SidebarGroupContent>
          <NavGroupList
            items={workspaceItems}
            role={role}
            activePage={activePage}
            onSelect={setActivePage}
            t={t}
          />
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}
