'use client'

import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react'
import type * as React from 'react'
import { NavMain } from '@/components/sidebar/nav-main'
import { NavSecond } from '@/components/sidebar/nav-second'
import { NavUser } from '@/components/sidebar/nav-user'
import { TeamSwitcher } from '@/components/sidebar/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import type { User } from '@/types/auth'

// This is sample data.
const data = {
  teams: [
    {
      name: 'BioFlow AI',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'BioFlow Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'BioFlow Lab.',
      logo: Command,
      plan: 'Free',
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User | null
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavSecond />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
