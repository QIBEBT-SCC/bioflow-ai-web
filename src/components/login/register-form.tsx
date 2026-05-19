'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClientApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'

type StrengthLevel = 0 | 1 | 2 | 3 | 4

function getPasswordStrength(password: string): StrengthLevel {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return Math.min(4, score) as StrengthLevel
}

const STRENGTH_CONFIG: Record<
  StrengthLevel,
  { bars: number; color: string; labelKey: string }
> = {
  0: { bars: 0, color: 'bg-muted', labelKey: '' },
  1: { bars: 1, color: 'bg-destructive', labelKey: 'strength_weak' },
  2: { bars: 2, color: 'bg-orange-400', labelKey: 'strength_fair' },
  3: { bars: 3, color: 'bg-yellow-400', labelKey: 'strength_good' },
  4: { bars: 4, color: 'bg-green-500', labelKey: 'strength_strong' },
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function RegisterForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const router = useRouter()
  const t = useTranslations('Register')

  const emailValid = isValidEmail(email)
  const passwordsMatch = confirmPassword === '' || password === confirmPassword
  const canSubmit =
    emailValid && password !== '' && password === confirmPassword

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.currentTarget)
    const username =
      (formData.get('username') as string).trim() || email.split('@')[0]

    setIsLoading(true)

    try {
      const res = await fetch('/api/v1/user', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        if (res.status === 422) {
          setError(t('invalid_params'))
          return
        }
        throw new ClientApiError(
          data?.detail || `${t('register_failed')} (${res.status})`,
          res.status,
          data,
        )
      }

      router.push('/login')
    } catch (err) {
      console.error('Register error:', err)
      if (err instanceof ClientApiError) {
        setError(err.message)
      } else {
        setError(t('network_error'))
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
                  <Label htmlFor='email'>{t('email')}</Label>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    placeholder={t('email_placeholder')}
                    required
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    className={cn(
                      emailTouched &&
                        email &&
                        !emailValid &&
                        'focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-destructive',
                    )}
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='username'>
                    {t('username')}
                    <span className='ml-1 text-xs text-muted-foreground'>
                      {t('username_optional')}
                    </span>
                  </Label>
                  <Input
                    id='username'
                    name='username'
                    type='text'
                    placeholder={email ? email.split('@')[0] : t('username')}
                    disabled={isLoading}
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='password'>{t('password')}</Label>
                  <Input
                    id='password'
                    name='password'
                    type='password'
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      password &&
                        getPasswordStrength(password) <= 1 &&
                        'focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-destructive',
                    )}
                  />
                  {password && (
                    <PasswordStrengthBar password={password} t={t} />
                  )}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='confirmPassword'>
                    {t('confirm_password')}
                  </Label>
                  <Input
                    id='confirmPassword'
                    name='confirmPassword'
                    type='password'
                    required
                    disabled={isLoading}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      confirmPassword &&
                        !passwordsMatch &&
                        'focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-destructive',
                    )}
                  />
                  {confirmPassword && !passwordsMatch && (
                    <p className='text-xs text-destructive'>
                      {t('password_mismatch')}
                    </p>
                  )}
                </div>
                {error && (
                  <div className='text-sm text-destructive'>{error}</div>
                )}
                <Button
                  type='submit'
                  className='w-full'
                  disabled={isLoading || !canSubmit}
                >
                  {isLoading ? t('registering') : t('register')}
                </Button>
              </div>
              <div className='text-center text-sm'>
                {t('have_account')}{' '}
                <Link href='/login' className='underline'>
                  {t('login')}
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function PasswordStrengthBar({
  password,
  t,
}: {
  password: string
  t: ReturnType<typeof useTranslations<'Register'>>
}) {
  const level = getPasswordStrength(password)
  const { bars, color, labelKey } = STRENGTH_CONFIG[level]

  return (
    <div className='grid gap-1'>
      <div className='flex gap-1'>
        {([0, 1, 2, 3] as const).map((i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static list of 4 fixed items
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              i < bars ? color : 'bg-muted',
            )}
          />
        ))}
      </div>
      {labelKey && (
        <p className={cn('text-xs', color.replace('bg-', 'text-'))}>
          {t(labelKey as Parameters<typeof t>[0])}
        </p>
      )}
    </div>
  )
}
