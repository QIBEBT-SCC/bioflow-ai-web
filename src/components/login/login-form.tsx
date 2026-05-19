'use client'

import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { useState, useTransition } from 'react'
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
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const queryClient = useQueryClient()

  const t = useTranslations('Login')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.currentTarget)
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    startTransition(async () => {
      try {
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
      }
    })
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
                    disabled={isPending}
                  />
                </div>
                <div className='grid gap-2'>
                  <div className='flex items-center'>
                    <Label htmlFor='password'>{t('password')}</Label>
                    <Link
                      href='/'
                      className='ml-auto text-sm underline-offset-4 hover:underline'
                    >
                      {t('forgot_password')}
                    </Link>
                  </div>
                  <Input
                    id='password'
                    name='password'
                    type='password'
                    required
                    disabled={isPending}
                  />
                </div>
                {error && (
                  <div className='text-sm text-destructive'>{error}</div>
                )}
                <Button type='submit' className='w-full' disabled={isPending}>
                  {isPending ? t('logging_in') : t('login')}
                </Button>
              </div>
              <div className='text-center text-sm'>
                {t('no_account')}{' '}
                <Link href='/register' className='underline'>
                  {t('signup')}
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
