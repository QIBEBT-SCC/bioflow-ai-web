'use client'

import { Loader2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth-query'

interface AuthGuardProps {
  children: React.ReactNode
}

/**
 * 保护需要登录的路由。
 * 未登录时自动重定向到 /login。
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <Loader2Icon className='h-8 w-8 animate-spin text-primary' />
          <p className='text-sm text-muted-foreground'>验证身份中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}

/**
 * 保护仅限访客的路由（如登录页）。
 * 已登录时自动重定向到 /chat。
 */
export function GuestGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.push('/chat')
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <Loader2Icon className='h-8 w-8 animate-spin text-primary' />
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
