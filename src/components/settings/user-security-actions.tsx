'use client'

import {
  KeyRoundIcon,
  Loader2Icon,
  UserPlusIcon,
  UserXIcon,
} from 'lucide-react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCreateUser,
  useResetUserPassword,
  useUpdateUserStatus,
} from '@/hooks/use-user'
import { UserRole } from '@/types/auth'
import type { ManagedUser } from '@/types/user'

function passwordHint(password: string) {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score++
  return score
}

export function CreateUserDialog() {
  const t = useTranslations('setting.user_management')
  const createUser = useCreateUser()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')

  const submit = (formData: FormData) => {
    createUser.mutate(
      {
        email: String(formData.get('email') ?? ''),
        username: String(formData.get('username') ?? ''),
        password,
        role: Number(formData.get('role')) as UserRole,
      },
      {
        onSuccess: () => {
          toast.success(t('create_success'))
          setOpen(false)
          setPassword('')
        },
        onError: (error) => toast.error(error.message),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlusIcon className='size-4' />
          {t('create_user')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={submit} className='space-y-5'>
          <DialogHeader>
            <DialogTitle>{t('create_user')}</DialogTitle>
            <DialogDescription>{t('create_description')}</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='create-email'>{t('col_email')}</Label>
              <Input id='create-email' name='email' type='email' required />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='create-username'>{t('col_username')}</Label>
              <Input id='create-username' name='username' required />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='create-password'>{t('password')}</Label>
              <Input
                id='create-password'
                name='password'
                type='password'
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {password && (
                <p className='text-muted-foreground text-xs'>
                  {t('password_strength', { score: passwordHint(password) })}
                </p>
              )}
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='create-role'>{t('col_role')}</Label>
              <select
                id='create-role'
                name='role'
                defaultValue={UserRole.VISITOR}
                className='h-9 rounded-md border bg-transparent px-3 text-sm'
              >
                {[UserRole.VISITOR, UserRole.MEMBER, UserRole.ADMIN].map(
                  (role) => (
                    <option key={role} value={role}>
                      {t(`role_${role}`)}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type='submit' disabled={createUser.isPending}>
              {createUser.isPending && <Loader2Icon className='animate-spin' />}
              {t('confirm_create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function UserSecurityActions({ user }: { user: ManagedUser }) {
  const t = useTranslations('setting.user_management')
  const updateStatus = useUpdateUserStatus()
  const resetPassword = useResetUserPassword()
  const [mode, setMode] = useState<'status' | 'password' | null>(null)
  const [password, setPassword] = useState('')

  const confirm = () => {
    if (mode === 'status') {
      updateStatus.mutate(
        { userId: user.id, isActive: !user.is_active },
        {
          onSuccess: () => {
            toast.success(t('status_update_success'))
            setMode(null)
          },
          onError: (error) => toast.error(error.message),
        },
      )
      return
    }
    resetPassword.mutate(
      { userId: user.id, password },
      {
        onSuccess: () => {
          toast.success(t('password_reset_success'))
          setPassword('')
          setMode(null)
        },
        onError: (error) => toast.error(error.message),
      },
    )
  }

  const pending = updateStatus.isPending || resetPassword.isPending
  return (
    <Dialog
      open={mode !== null}
      onOpenChange={(open) => !open && setMode(null)}
    >
      <div className='flex gap-1'>
        <Button
          size='icon-sm'
          variant='outline'
          aria-label={user.is_active ? t('deactivate') : t('activate')}
          onClick={() => setMode('status')}
        >
          <UserXIcon className='size-4' />
        </Button>
        <Button
          size='icon-sm'
          variant='outline'
          aria-label={t('reset_password')}
          onClick={() => setMode('password')}
        >
          <KeyRoundIcon className='size-4' />
        </Button>
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'status'
              ? t('confirm_status_title')
              : t('reset_password')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'status'
              ? t('confirm_status_desc', { username: user.username })
              : t('reset_password_desc', { username: user.username })}
          </DialogDescription>
        </DialogHeader>
        {mode === 'password' && (
          <div className='grid gap-2'>
            <Label htmlFor={`reset-password-${user.id}`}>
              {t('new_password')}
            </Label>
            <Input
              id={`reset-password-${user.id}`}
              type='password'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {password && (
              <p className='text-muted-foreground text-xs'>
                {t('password_strength', { score: passwordHint(password) })}
              </p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={confirm}
            disabled={pending || (mode === 'password' && !password)}
          >
            {pending && <Loader2Icon className='animate-spin' />}
            {t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
