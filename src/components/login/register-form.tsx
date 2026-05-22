'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { useReducer, useTransition } from 'react'
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

type FormState = {
  error: string
  email: string
  emailTouched: boolean
  password: string
  confirmPassword: string
}
type FormAction =
  | { type: 'SET_ERROR'; value: string }
  | { type: 'SET_EMAIL'; value: string }
  | { type: 'TOUCH_EMAIL' }
  | { type: 'SET_PASSWORD'; value: string }
  | { type: 'SET_CONFIRM'; value: string }

const INITIAL_FORM: FormState = {
  error: '',
  email: '',
  emailTouched: false,
  password: '',
  confirmPassword: '',
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_ERROR':
      return { ...state, error: action.value }
    case 'SET_EMAIL':
      return { ...state, email: action.value }
    case 'TOUCH_EMAIL':
      return { ...state, emailTouched: true }
    case 'SET_PASSWORD':
      return { ...state, password: action.value }
    case 'SET_CONFIRM':
      return { ...state, confirmPassword: action.value }
  }
}

export function RegisterForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [{ error, email, emailTouched, password, confirmPassword }, dispatch] =
    useReducer(formReducer, INITIAL_FORM)
  const [isPending, startTransition] = useTransition()
  const { push } = useRouter()
  const t = useTranslations('Register')

  const emailValid = isValidEmail(email)
  const passwordsMatch = confirmPassword === '' || password === confirmPassword
  const canSubmit =
    emailValid && password !== '' && password === confirmPassword

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    dispatch({ type: 'SET_ERROR', value: '' })

    const formData = new FormData(e.currentTarget)
    const username =
      (formData.get('username') as string).trim() || email.split('@')[0]

    startTransition(async () => {
      try {
        const res = await fetch('/api/v1/user', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, username, password }),
        })

        if (!res.ok) {
          if (res.status === 422) {
            dispatch({ type: 'SET_ERROR', value: t('invalid_params') })
            return
          }
          const data = await res.json().catch(() => null)
          throw new ClientApiError(
            data?.detail || `${t('register_failed')} (${res.status})`,
            res.status,
            data,
          )
        }

        push('/login')
      } catch (err) {
        console.error('Register error:', err)
        if (err instanceof ClientApiError) {
          dispatch({ type: 'SET_ERROR', value: err.message })
        } else {
          dispatch({ type: 'SET_ERROR', value: t('network_error') })
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
                    value={email}
                    onChange={(e) =>
                      dispatch({ type: 'SET_EMAIL', value: e.target.value })
                    }
                    onBlur={() => dispatch({ type: 'TOUCH_EMAIL' })}
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
                    value={password}
                    onChange={(e) =>
                      dispatch({ type: 'SET_PASSWORD', value: e.target.value })
                    }
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
                    disabled={isPending}
                    value={confirmPassword}
                    onChange={(e) =>
                      dispatch({ type: 'SET_CONFIRM', value: e.target.value })
                    }
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
                  disabled={isPending || !canSubmit}
                >
                  {isPending ? t('registering') : t('register')}
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
        {([0, 1, 2, 3] as const).map((barLevel) => (
          <div
            key={barLevel}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              barLevel < bars ? color : 'bg-muted',
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
