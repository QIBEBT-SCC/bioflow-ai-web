'use client'

import {
  EditIcon,
  FolderOpenIcon,
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
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { useSidebarStore } from '@/stores/sidebar-store'
import { UserRole } from '@/types/auth'

const projects = [
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
    icon: NetworkIcon,
    icon_rotate: true,
    minimumRole: UserRole.MEMBER,
  },
  {
    name: 'tasks',
    url: '/task',
    icon: TvMinimalIcon,
    minimumRole: UserRole.MEMBER,
  },
]

export function NavMain({ role }: { role?: UserRole }) {
  const { activePage, setActivePage } = useSidebarStore()
  const pathname = usePathname()

  const t = useTranslations('Sidebar')

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
                  {item.icon_rotate ? (
                    <item.icon className='-rotate-90' />
                  ) : (
                    <item.icon />
                  )}
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
