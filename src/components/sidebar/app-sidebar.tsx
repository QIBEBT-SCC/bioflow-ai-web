'use client'

import Image from 'next/image'
import Link from 'next/link'
import type * as React from 'react'
import { NavMain } from '@/components/sidebar/nav-main'
import { NavSecond } from '@/components/sidebar/nav-second'
import { NavUser } from '@/components/sidebar/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { type User, UserRole } from '@/types/auth'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User | null
}

function SidebarLogo() {
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'
  return (
    <Link href='/' className='flex items-center justify-center p-0'>
      <Image
        src={collapsed ? '/logo_only.svg' : '/logo_and_text.svg'}
        alt='BioFlow AI'
        width={collapsed ? 32 : 140}
        height={32}
        className='w-[80%] h-auto'
        priority
      />
    </Link>
  )
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain role={user?.role} />
        {user && user.role >= UserRole.ADMIN && <NavSecond />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
