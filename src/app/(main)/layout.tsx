import type React from 'react'
import { getCurrentUser } from '@/app/actions/auth'
import { QueryProvider } from '@/components/providers/query-provider'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 获取当前用户信息（middleware 已经确保用户已登录）
  const user = await getCurrentUser()

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
