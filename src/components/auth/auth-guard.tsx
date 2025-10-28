'use client'

import { useRouter } from 'next/navigation'
import type React from 'react'
import { useEffect, useState } from 'react'
import { clientFetch, getToken } from '@/lib/api-client'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken()
      if (!token) {
        router.push('/login')
        return
      }

      try {
        // 验证 token 有效性
        await clientFetch('/auth/me')
        setIsAuthenticated(true)
      } catch (error) {
        // Token 无效，清除并跳转登录
        console.error('Auth check failed:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
