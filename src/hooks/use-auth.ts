'use client'

import { useEffect, useState } from 'react'
import { clientFetch } from '@/lib/api-client'
import type { User } from '@/types/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await clientFetch<User>('/auth/me')
        setUser(userData)
      } catch (error) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { user, loading }
}
