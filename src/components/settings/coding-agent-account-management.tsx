'use client'

import { useQueryClient } from '@tanstack/react-query'
import {
  BotIcon,
  CheckCircle2Icon,
  CopyIcon,
  ExternalLinkIcon,
  Loader2Icon,
  LogInIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { cancelCodingAgentLogin } from '@/app/actions/code-agent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useCodeAgentAvailability,
  useStartCodingAgentLogin,
} from '@/hooks/use-code-agent'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1'

interface DeviceCode {
  verificationUrl: string
  userCode: string
  message: string
}

export function CodingAgentAccountManagement() {
  const t = useTranslations('setting.coding_agent')
  const queryClient = useQueryClient()
  const {
    data: availability,
    isLoading,
    error,
    refetch,
  } = useCodeAgentAvailability()
  const loginMutation = useStartCodingAgentLogin()
  const [loginId, setLoginId] = useState<string>()
  const [deviceCode, setDeviceCode] = useState<DeviceCode>()
  const [loginError, setLoginError] = useState<string>()
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!loginId) return
    const events = new EventSource(
      `${API_URL}/settings/coding-agent-account/login/${loginId}/events`,
      { withCredentials: true },
    )
    const handleCode = (event: Event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        verification_url?: string
        user_code?: string
        message?: string
      }
      if (!payload.verification_url) return
      setDeviceCode({
        verificationUrl: payload.verification_url,
        userCode: payload.user_code ?? '',
        message: payload.message ?? '',
      })
    }
    const handleCompleted = () => {
      setCompleted(true)
      setLoginError(undefined)
      events.close()
      void refetch()
      void queryClient.invalidateQueries({
        queryKey: ['code-agent', 'availability'],
      })
    }
    const handleFailed = (event: Event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        message?: string
      }
      setLoginError(payload.message ?? t('loginFailed'))
      events.close()
      void refetch()
    }
    const handleCancelled = () => {
      events.close()
      setLoginId(undefined)
      setDeviceCode(undefined)
      void refetch()
    }
    events.addEventListener('login.code', handleCode)
    events.addEventListener('login.completed', handleCompleted)
    events.addEventListener('login.failed', handleFailed)
    events.addEventListener('login.cancelled', handleCancelled)
    return () => {
      events.removeEventListener('login.code', handleCode)
      events.removeEventListener('login.completed', handleCompleted)
      events.removeEventListener('login.failed', handleFailed)
      events.removeEventListener('login.cancelled', handleCancelled)
      events.close()
    }
  }, [loginId, queryClient, refetch, t])

  const startLogin = async () => {
    setDeviceCode(undefined)
    setLoginError(undefined)
    setCompleted(false)
    try {
      const login = await loginMutation.mutateAsync()
      setLoginId(login.id)
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : t('loginFailed'))
    }
  }

  const closeDialog = async () => {
    if (loginId && !completed) {
      await cancelCodingAgentLogin(loginId).catch(() => undefined)
    }
    setLoginId(undefined)
    setDeviceCode(undefined)
    setLoginError(undefined)
    setCompleted(false)
  }

  const copyCode = async () => {
    if (!deviceCode?.userCode) return
    await navigator.clipboard.writeText(deviceCode.userCode)
    toast.success(t('codeCopied'))
  }

  if (isLoading) return <Loader2Icon className='size-5 animate-spin' />
  if (error) return <p className='text-sm text-destructive'>{error.message}</p>

  return (
    <>
      <Card>
        <CardHeader className='flex-row items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-primary/10 p-2 text-primary'>
              <BotIcon className='size-5' />
            </div>
            <div>
              <CardTitle className='text-base'>Codex</CardTitle>
              <p className='text-xs text-muted-foreground'>ACP v1</p>
            </div>
          </div>
          {availability?.available ? (
            <div className='flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400'>
              <CheckCircle2Icon className='size-4' />
              {t('connected')}
            </div>
          ) : (
            <span className='text-sm text-muted-foreground'>
              {t('disconnected')}
            </span>
          )}
        </CardHeader>
        <CardContent className='space-y-5'>
          <div className='rounded-lg border bg-muted/30 p-4 text-sm'>
            <p className='text-muted-foreground'>
              {availability?.available ? t('connectedHelp') : t('accountHelp')}
            </p>
            <p className='mt-2 text-xs text-muted-foreground'>
              {t('credentialHelp')}
            </p>
          </div>
          {!availability?.available && (
            <div className='flex justify-end'>
              <Button
                type='button'
                onClick={() => void startLogin()}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending && (
                  <Loader2Icon className='size-4 animate-spin' />
                )}
                {!loginMutation.isPending && <LogInIcon className='size-4' />}
                {t('login')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(loginId)}
        onOpenChange={(open) => !open && void closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deviceTitle')}</DialogTitle>
            <DialogDescription>{t('deviceDescription')}</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            {!deviceCode && !completed && !loginError && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Loader2Icon className='size-4 animate-spin' />
                {t('preparingCode')}
              </div>
            )}
            {deviceCode && !completed && (
              <>
                <div className='rounded-lg border bg-muted/30 p-5 text-center'>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                    {t('deviceCode')}
                  </p>
                  <p className='mt-2 font-mono text-3xl font-semibold tracking-widest'>
                    {deviceCode.userCode || deviceCode.message}
                  </p>
                  {deviceCode.userCode && (
                    <Button
                      type='button'
                      size='sm'
                      variant='ghost'
                      className='mt-2'
                      onClick={() => void copyCode()}
                    >
                      <CopyIcon className='size-4' />
                      {t('copyCode')}
                    </Button>
                  )}
                </div>
                <Button asChild className='w-full'>
                  <a
                    href={deviceCode.verificationUrl}
                    target='_blank'
                    rel='noreferrer'
                  >
                    <ExternalLinkIcon className='size-4' />
                    {t('openVerification')}
                  </a>
                </Button>
                <p className='text-center text-xs text-muted-foreground'>
                  {t('loginWaiting')}
                </p>
              </>
            )}
            {completed && (
              <div className='flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'>
                <CheckCircle2Icon className='size-5' />
                {t('loginSucceeded')}
              </div>
            )}
            {loginError && (
              <p className='rounded-lg bg-destructive/10 p-4 text-sm text-destructive'>
                {loginError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => void closeDialog()}
            >
              {completed || loginError ? t('close') : t('cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
