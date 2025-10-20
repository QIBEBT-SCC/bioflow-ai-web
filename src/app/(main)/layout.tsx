import { getServerSession } from 'next-auth'
import type React from 'react'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { QueryProvider } from '@/components/providers/query-provider'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'

import type { User } from '@/types/auth'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 获取当前用户session
  const session = await getServerSession(authOptions)

  // 将session转换为User类型
  const user: User | null = session
    ? {
        username: session.user.name || '',
        email: session.user.email || '',
        role: session.user.role || 0,
      }
    : null

  return (
    <QueryProvider>
      <SidebarProvider>
        <AppSidebar user={user} />
        {children}
        <Toaster />
      </SidebarProvider>
    </QueryProvider>
  )
}
