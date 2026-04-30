'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClientApiError, clientFetch } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import type { User } from '@/types/auth'

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  const t = useTranslations('Login')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    try {
      // 调用 FastAPI 登录接口
      const res = await fetch(`/api/v1/auth/token`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username,
          password,
        }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          setError('用户名或密码错误')
          return
        }
        const data = await res.json().catch(() => null)
        throw new ClientApiError(
          data?.detail || `登录失败 (${res.status})`,
          res.status,
          data,
        )
      }

      // 登录成功：后端已通过 Set-Cookie 设置 HttpOnly Cookie
      // 立即获取用户信息写入 Query 缓存，使 GuestGuard 能立即感知登录状态
      try {
        const user = await clientFetch<User>('/auth/me')
        queryClient.setQueryData(['auth', 'me'], user)
      } catch {
        // 即使失败，cookie 已设置，跳转后 AuthGuard 会正常处理
      }

      router.push('/')
    } catch (err) {
      console.error('Login error:', err)
      if (err instanceof ClientApiError) {
        setError(err.message)
      } else {
        setError('网络错误，请稍后重试')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className='text-center'>
          <CardTitle className='text-xl'>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className='grid gap-6'>
              <div className='grid gap-6'>
                <div className='grid gap-2'>
                  <Label htmlFor='username'>{t('username')}</Label>
                  <Input
                    id='username'
                    name='username'
                    type='text'
                    placeholder={t('username')}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className='grid gap-2'>
                  <div className='flex items-center'>
                    <Label htmlFor='password'>{t('password')}</Label>
                    <a
                      href='/'
                      className='ml-auto text-sm underline-offset-4 hover:underline'
                    >
                      {t('forgot_password')}
                    </a>
                  </div>
                  <Input
                    id='password'
                    name='password'
                    type='password'
                    required
                    disabled={isLoading}
                  />
                </div>
                {error && (
                  <div className='text-sm text-destructive'>{error}</div>
                )}
                <Button type='submit' className='w-full' disabled={isLoading}>
                  {isLoading ? t('logging_in') : t('login')}
                </Button>
              </div>
              <div className='text-center text-sm'>
                {t('no_account')}{' '}
                <a href='/register' className='underline'>
                  {t('signup')}
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
