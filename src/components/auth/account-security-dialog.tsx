'use client'

import { Loader2Icon, ShieldCheckIcon, UserIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useChangePassword,
  useRevokeOtherSessions,
  useUpdateProfile,
} from '@/hooks/use-auth-query'
import type { User } from '@/types/auth'

const USERNAME_MAX_LENGTH = 64

export function AccountSecurityDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations('AccountSecurity')
  const tRole = useTranslations('setting.user_management')
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const revokeOthers = useRevokeOtherSessions()

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
  const [usernameDraft, setUsernameDraft] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const username = usernameDraft ?? user.username
  const trimmedUsername = username.trim()
  const previewName = trimmedUsername || user.username
  const isProfileDirty = trimmedUsername !== user.username
  const canSaveProfile =
    trimmedUsername.length > 0 && isProfileDirty && !updateProfile.isPending

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setActiveTab('profile')
      setUsernameDraft(null)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    onOpenChange(nextOpen)
  }

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!trimmedUsername) {
      toast.error(t('username_required'))
      return
    }
    if (!isProfileDirty) return

    updateProfile.mutate(
      { username: trimmedUsername },
      {
        onSuccess: () => {
          toast.success(t('profile_updated'))
          setUsernameDraft(null)
        },
        onError: (error) => toast.error(error.message),
      },
    )
  }

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
        },
        onError: (error) => toast.error(error.message),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value === 'security' ? 'security' : 'profile')
          }
          className='gap-4'
        >
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='profile'>
              <UserIcon />
              {t('tab_profile')}
            </TabsTrigger>
            <TabsTrigger value='security'>
              <ShieldCheckIcon />
              {t('tab_security')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='profile' className='space-y-4'>
            <div className='flex items-center gap-3 rounded-lg border bg-muted/40 p-3'>
              <Avatar className='size-10 rounded-lg'>
                <AvatarFallback className='rounded-lg bg-primary/10 font-medium text-primary'>
                  {previewName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='truncate font-medium'>{previewName}</span>
                  <Badge variant='secondary' className='shrink-0'>
                    {tRole(`role_${user.role}`)}
                  </Badge>
                </div>
                <p className='truncate text-muted-foreground text-xs'>
                  {user.email}
                </p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className='space-y-4'>
              <div className='grid gap-2'>
                <Label htmlFor='account-email'>{t('email')}</Label>
                <Input id='account-email' value={user.email} disabled />
                <p className='text-muted-foreground text-xs'>
                  {t('email_readonly_hint')}
                </p>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='account-username'>{t('username')}</Label>
                <Input
                  id='account-username'
                  value={username}
                  maxLength={USERNAME_MAX_LENGTH}
                  placeholder={t('username_placeholder')}
                  onChange={(event) => setUsernameDraft(event.target.value)}
                />
              </div>

              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => handleOpenChange(false)}
                  disabled={updateProfile.isPending}
                >
                  {t('cancel')}
                </Button>
                <Button type='submit' disabled={!canSaveProfile}>
                  {updateProfile.isPending && (
                    <Loader2Icon className='animate-spin' />
                  )}
                  {t('save_profile')}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value='security' className='space-y-5'>
            <form onSubmit={handlePasswordSubmit} className='grid gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='current-password'>
                  {t('current_password')}
                </Label>
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
                <Label htmlFor='confirm-password'>
                  {t('confirm_password')}
                </Label>
                <Input
                  id='confirm-password'
                  type='password'
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <div className='flex justify-end'>
                <Button
                  type='submit'
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
              </div>
            </form>

            <Separator />

            <div className='flex items-center justify-between gap-4 rounded-lg border p-3'>
              <div className='space-y-0.5'>
                <p className='font-medium text-sm'>{t('sessions_title')}</p>
                <p className='text-muted-foreground text-xs'>
                  {t('sessions_description')}
                </p>
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='shrink-0'
                disabled={revokeOthers.isPending}
                onClick={() =>
                  revokeOthers.mutate(undefined, {
                    onSuccess: () => toast.success(t('other_sessions_revoked')),
                    onError: (error) => toast.error(error.message),
                  })
                }
              >
                {revokeOthers.isPending && (
                  <Loader2Icon className='animate-spin' />
                )}
                {t('revoke_other_sessions')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
