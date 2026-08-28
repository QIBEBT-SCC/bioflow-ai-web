'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClientApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import type { User } from '@/types/auth'

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [error, setError] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const { push } = useRouter()
  const queryClient = useQueryClient()

  const t = useTranslations('Login')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    startTransition(async () => {
      try {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        if (!res.ok) {
          if (res.status === 401) {
            setError(t('invalid_credentials'))
            return
          }
          if (res.status === 429) {
            setError(t('too_many_attempts'))
            return
          }
          const data = await res.json().catch(() => null)
          throw new ClientApiError(
            data?.detail || t('login_failed', { status: res.status }),
            res.status,
            data,
          )
        }

        const user = (await res.json()) as User
        queryClient.setQueryData(['auth', 'me'], user)

        push('/')
      } catch (err) {
        console.error('Login error:', err)
        if (err instanceof ClientApiError) {
          setError(err.message)
        } else {
          setError(t('network_error'))
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
                  <Label htmlFor='email'>{t('email')}</Label>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    placeholder={t('email_placeholder')}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='password'>{t('password')}</Label>
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
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
