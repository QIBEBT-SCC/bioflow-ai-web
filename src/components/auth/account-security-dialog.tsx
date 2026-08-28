'use client'

import { Loader2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useChangePassword,
  useRevokeOtherSessions,
} from '@/hooks/use-auth-query'

export function AccountSecurityDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations('AccountSecurity')
  const changePassword = useChangePassword()
  const revokeOthers = useRevokeOtherSessions()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const submit = () => {
    if (newPassword !== confirmPassword) {
      toast.error(t('password_mismatch'))
      return
    }
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success(t('password_changed'))
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
          onOpenChange(false)
        },
        onError: (error) => toast.error(error.message),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='current-password'>{t('current_password')}</Label>
            <Input
              id='current-password'
              type='password'
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='new-password'>{t('new_password')}</Label>
            <Input
              id='new-password'
              type='password'
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <p className='text-muted-foreground text-xs'>
              {t('strength_hint')}
            </p>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='confirm-password'>{t('confirm_password')}</Label>
            <Input
              id='confirm-password'
              type='password'
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
          <Button
            variant='outline'
            disabled={revokeOthers.isPending}
            onClick={() =>
              revokeOthers.mutate(undefined, {
                onSuccess: () => toast.success(t('other_sessions_revoked')),
                onError: (error) => toast.error(error.message),
              })
            }
          >
            {revokeOthers.isPending && <Loader2Icon className='animate-spin' />}
            {t('revoke_other_sessions')}
          </Button>
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={
              changePassword.isPending ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
          >
            {changePassword.isPending && (
              <Loader2Icon className='animate-spin' />
            )}
            {t('change_password')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
