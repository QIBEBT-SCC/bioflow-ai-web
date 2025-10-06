'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { useState, useTransition } from 'react'
import { loginAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [error, setError] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const t = useTranslations('Login')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await loginAction(formData)

      if (!result.success) {
        setError(result.error || t('common.error'))
      } else {
        // 登录成功，重定向到聊天页
        router.push('/chat')
        router.refresh()
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
                <a href='/register' className='underline'>
                  {t('signup')}
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      {/*<div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">*/}
      {/*  By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}*/}
      {/*  and <a href="#">Privacy Policy</a>.*/}
      {/*</div>*/}
    </div>
  )
}
