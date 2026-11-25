'use client'

import {
  KeyRoundIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  ShieldIcon,
  UserCheckIcon,
  UserPlusIcon,
  UserXIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCreateUser,
  useResetUserPassword,
  useUpdateUserProfile,
  useUpdateUserRole,
  useUpdateUserStatus,
} from '@/hooks/use-user'
import { UserRole } from '@/types/auth'
import type { ManagedUser } from '@/types/user'

const USERNAME_MAX_LENGTH = 64
const roleOptions = [UserRole.VISITOR, UserRole.MEMBER, UserRole.ADMIN] as const

type ActiveDialog =
  | { type: 'username' }
  | { type: 'role'; targetRole: UserRole }
  | { type: 'status' }
  | { type: 'password' }
  | null

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
  const [role, setRole] = useState<string>(String(UserRole.VISITOR))

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && createUser.isPending) return
    if (!nextOpen) {
      setPassword('')
      setRole(String(UserRole.VISITOR))
    }
    setOpen(nextOpen)
  }

  const submit = (formData: FormData) => {
    createUser.mutate(
      {
        email: String(formData.get('email') ?? ''),
        username: String(formData.get('username') ?? ''),
        password,
        role: Number(role) as UserRole,
      },
      {
        onSuccess: () => {
          toast.success(t('create_success'))
          setOpen(false)
          setPassword('')
          setRole(String(UserRole.VISITOR))
        },
        onError: (error) => toast.error(error.message),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              <Input
                id='create-username'
                name='username'
                maxLength={USERNAME_MAX_LENGTH}
                required
              />
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
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id='create-role' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {t(`role_${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleOpenChange(false)}
              disabled={createUser.isPending}
            >
              {t('cancel')}
            </Button>
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

export function UserRowActions({ user }: { user: ManagedUser }) {
  const t = useTranslations('setting.user_management')
  const updateProfile = useUpdateUserProfile()
  const updateRole = useUpdateUserRole()
  const updateStatus = useUpdateUserStatus()
  const resetPassword = useResetUserPassword()

  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null)
  const [usernameInput, setUsernameInput] = useState('')
  const [password, setPassword] = useState('')

  const pending =
    updateProfile.isPending ||
    updateRole.isPending ||
    updateStatus.isPending ||
    resetPassword.isPending

  const trimmedUsername = usernameInput.trim()
  const canSaveUsername =
    trimmedUsername.length > 0 &&
    trimmedUsername !== user.username &&
    !updateProfile.isPending

  const closeDialog = () => {
    if (pending) return
    setActiveDialog(null)
  }

  const handleUsernameSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSaveUsername) return

    updateProfile.mutate(
      { userId: user.id, username: trimmedUsername },
      {
        onSuccess: () => {
          toast.success(t('username_update_success'))
          setActiveDialog(null)
        },
        onError: (error) => toast.error(error.message),
      },
    )
  }

  const handleRoleConfirm = (targetRole: UserRole) => {
    updateRole.mutate(
      { userId: user.id, role: targetRole },
      {
        onSuccess: () => {
          toast.success(t('role_update_success'))
          setActiveDialog(null)
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t('role_update_failed'),
          ),
      },
    )
  }

  const handleStatusConfirm = () => {
    updateStatus.mutate(
      { userId: user.id, isActive: !user.is_active },
      {
        onSuccess: () => {
          toast.success(t('status_update_success'))
          setActiveDialog(null)
        },
        onError: (error) => toast.error(error.message),
      },
    )
  }

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!password) return

    resetPassword.mutate(
      { userId: user.id, password },
      {
        onSuccess: () => {
          toast.success(t('password_reset_success'))
          setPassword('')
          setActiveDialog(null)
        },
        onError: (error) => toast.error(error.message),
      },
    )
  }

  return (
    <Dialog
      open={activeDialog !== null}
      onOpenChange={(open) => {
        if (!open) closeDialog()
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon-sm'
            disabled={pending}
            aria-label={t('open_actions_menu')}
          >
            {pending ? (
              <Loader2Icon className='size-4 animate-spin' />
            ) : (
              <MoreHorizontalIcon className='size-4' />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={() => {
                setUsernameInput(user.username)
                setActiveDialog({ type: 'username' })
              }}
            >
              <PencilIcon />
              {t('edit_username')}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ShieldIcon />
                {t('change_role')}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className='w-40'>
                {roleOptions.map((role) => (
                  <DropdownMenuItem
                    key={role}
                    disabled={role === user.role}
                    onSelect={() =>
                      setActiveDialog({ type: 'role', targetRole: role })
                    }
                  >
                    <span>{t(`role_${role}`)}</span>
                    {role === user.role && (
                      <span className='ml-auto text-muted-foreground text-xs'>
                        {t('current')}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={() => {
                setPassword('')
                setActiveDialog({ type: 'password' })
              }}
            >
              <KeyRoundIcon />
              {t('reset_password')}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant={user.is_active ? 'destructive' : 'default'}
              onSelect={() => setActiveDialog({ type: 'status' })}
            >
              {user.is_active ? <UserXIcon /> : <UserCheckIcon />}
              {user.is_active ? t('deactivate') : t('activate')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent>
        {activeDialog?.type === 'username' && (
          <form onSubmit={handleUsernameSubmit} className='space-y-5'>
            <DialogHeader>
              <DialogTitle>{t('edit_username_title')}</DialogTitle>
              <DialogDescription>
                {t('edit_username_desc', { email: user.email })}
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-2'>
              <Label htmlFor={`edit-username-${user.id}`}>
                {t('col_username')}
              </Label>
              <Input
                id={`edit-username-${user.id}`}
                value={usernameInput}
                maxLength={USERNAME_MAX_LENGTH}
                onChange={(event) => setUsernameInput(event.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={closeDialog}
                disabled={pending}
              >
                {t('cancel')}
              </Button>
              <Button type='submit' disabled={!canSaveUsername}>
                {updateProfile.isPending && (
                  <Loader2Icon className='animate-spin' />
                )}
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        )}

        {activeDialog?.type === 'role' && (
          <>
            <DialogHeader>
              <DialogTitle>{t('confirm_role_title')}</DialogTitle>
              <DialogDescription>
                {t('confirm_role_desc', {
                  username: user.username,
                  currentRole: t(`role_${user.role}`),
                  targetRole: t(`role_${activeDialog.targetRole}`),
                })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={closeDialog}
                disabled={pending}
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={() => handleRoleConfirm(activeDialog.targetRole)}
                disabled={pending}
              >
                {updateRole.isPending && (
                  <Loader2Icon className='animate-spin' />
                )}
                {t('confirm')}
              </Button>
            </DialogFooter>
          </>
        )}

        {activeDialog?.type === 'status' && (
          <>
            <DialogHeader>
              <DialogTitle>{t('confirm_status_title')}</DialogTitle>
              <DialogDescription>
                {t('confirm_status_desc', { username: user.username })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={closeDialog}
                disabled={pending}
              >
                {t('cancel')}
              </Button>
              <Button
                variant={user.is_active ? 'destructive' : 'default'}
                onClick={handleStatusConfirm}
                disabled={pending}
              >
                {updateStatus.isPending && (
                  <Loader2Icon className='animate-spin' />
                )}
                {t('confirm')}
              </Button>
            </DialogFooter>
          </>
        )}

        {activeDialog?.type === 'password' && (
          <form onSubmit={handlePasswordSubmit} className='space-y-5'>
            <DialogHeader>
              <DialogTitle>{t('reset_password')}</DialogTitle>
              <DialogDescription>
                {t('reset_password_desc', { username: user.username })}
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-2'>
              <Label htmlFor={`reset-password-${user.id}`}>
                {t('new_password')}
              </Label>
              <Input
                id={`reset-password-${user.id}`}
                type='password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoFocus
              />
              {password && (
                <p className='text-muted-foreground text-xs'>
                  {t('password_strength', { score: passwordHint(password) })}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={closeDialog}
                disabled={pending}
              >
                {t('cancel')}
              </Button>
              <Button type='submit' disabled={pending || !password}>
                {resetPassword.isPending && (
                  <Loader2Icon className='animate-spin' />
                )}
                {t('confirm')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
