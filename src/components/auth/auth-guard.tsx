'use client'

import { Loader2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth-query'

/**
 * 保护需要登录的路由。
 * 纯副作用组件，未登录时自动重定向到 /login，不渲染任何 UI。
 */
export function AuthGuard() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  return null
}

/**
 * 保护仅限访客的路由（如登录页）。
 * 已登录时自动重定向到 /chat。
 */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.push('/')
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <Loader2Icon className='size-8 animate-spin text-primary' />
          <p className='text-sm text-muted-foreground'>验证身份中...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return <>{children}</>
}
