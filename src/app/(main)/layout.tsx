'use client'

import type React from 'react'
import { AuthGuard } from '@/components/auth/auth-guard'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/hooks/use-auth-query'

function MainContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <>
      <AppSidebar user={user ?? null} />
      {children}
    </>
  )
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AuthGuard>
        <MainContent>{children}</MainContent>
      </AuthGuard>
      <Toaster />
    </SidebarProvider>
  )
}
