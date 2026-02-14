'use client'

import { Loader2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth-query'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    // 仅在加载完成且无用户时跳转
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
