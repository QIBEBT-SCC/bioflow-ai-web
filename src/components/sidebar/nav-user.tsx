'use client'

import {
  ChevronsUpDown,
  LanguagesIcon,
  LogOut,
  PaletteIcon,
  ShieldCheckIcon,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { setUserLocale } from '@/app/actions/locale'
import { AccountSecurityDialog } from '@/components/auth/account-security-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccent } from '@/hooks/use-accent'
import { useLogout } from '@/hooks/use-auth-query'
import { type Locale, localeNames, locales } from '@/i18n/config'
import { accentColors, isAccentColor } from '@/lib/theme'
import type { User } from '@/types/auth'

interface NavUserProps {
  user: User | null
}

function UserIdentity({ user }: { user: User }) {
  return (
    <>
      <Avatar className='size-8 rounded-lg'>
        <AvatarFallback className='rounded-lg bg-primary/10 font-medium text-primary'>
          {user.username.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className='grid flex-1 text-left text-sm leading-tight'>
        <span className='truncate font-semibold'>{user.username}</span>
        <span className='truncate text-xs text-muted-foreground'>
          {user.email}
        </span>
      </div>
    </>
  )
}

/** Swatch that previews an accent by scoping `data-accent` to itself. */
function AccentSwatch({ accent }: { accent: string }) {
  return (
    <span
      data-accent={accent}
      aria-hidden
      className='size-3.5 shrink-0 rounded-full bg-primary ring-1 ring-black/10 ring-inset'
    />
  )
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar()
  const currentLocale = useLocale() as Locale
  const logout = useLogout()
  const [securityOpen, setSecurityOpen] = useState(false)
  const t = useTranslations()
  const [accent, setAccent] = useAccent(t('UserMenu.accentSaveFailed'))

  const handleLocaleChange = async (value: string) => {
    const locale = value as Locale
    if (locale === currentLocale) return
    await setUserLocale(locale)
    window.location.reload()
  }

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' className='cursor-default'>
            <Skeleton className='size-8 rounded-lg' />
            <div className='grid flex-1 gap-1'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-3 w-32' />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <UserIdentity user={user} />
              <ChevronsUpDown className='ml-auto size-4 text-muted-foreground' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5'>
                <UserIdentity user={user} />
                <Badge variant='secondary' className='shrink-0'>
                  {t(`setting.user_management.role_${user.role}`)}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => setSecurityOpen(true)}>
                <ShieldCheckIcon />
                {t('AccountSecurity.menu')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <PaletteIcon />
                  {t('UserMenu.accentColor')}
                  <span className='ml-auto'>
                    <AccentSwatch accent={accent} />
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className='min-w-40'>
                    <DropdownMenuRadioGroup
                      value={accent}
                      onValueChange={(value) => {
                        if (isAccentColor(value)) setAccent(value)
                      }}
                    >
                      {accentColors.map((color) => (
                        <DropdownMenuRadioItem
                          key={color}
                          value={color}
                          onSelect={(event) => event.preventDefault()}
                        >
                          <AccentSwatch accent={color} />
                          {t(`UserMenu.accent.${color}`)}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <LanguagesIcon />
                  {t('Language.language')}
                  <span className='ml-auto text-xs text-muted-foreground'>
                    {localeNames[currentLocale]}
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className='min-w-36'>
                    <DropdownMenuRadioGroup
                      value={currentLocale}
                      onValueChange={handleLocaleChange}
                    >
                      {locales.map((locale) => (
                        <DropdownMenuRadioItem key={locale} value={locale}>
                          {localeNames[locale]}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut />
              {logout.isPending
                ? t('UserMenu.loggingOut')
                : t('UserMenu.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <AccountSecurityDialog
          open={securityOpen}
          onOpenChange={setSecurityOpen}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
