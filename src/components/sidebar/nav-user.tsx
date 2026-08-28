'use client'

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LanguagesIcon,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { setUserLocale } from '@/app/actions/locale'
import { AccountSecurityDialog } from '@/components/auth/account-security-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
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
import { useLogout } from '@/hooks/use-auth-query'
import { type Locale, localeNames, locales } from '@/i18n/config'
import type { User } from '@/types/auth'

interface NavUserProps {
  user: User | null
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar()
  const currentLocale = useLocale() as Locale
  const logout = useLogout()
  const [securityOpen, setSecurityOpen] = useState(false)

  const t = useTranslations()

  const handleLocaleChange = async (locale: Locale) => {
    if (locale === currentLocale) return
    await setUserLocale(locale)
    window.location.reload()
  }

  const handleLogout = () => {
    logout.mutate()
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
        <div className='flex items-center gap-1 px-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex-1'
              >
                <Avatar className='size-8 rounded-lg'>
                  <AvatarFallback className='rounded-lg'>
                    {user?.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>
                    {user?.username}
                  </span>
                  <span className='truncate text-xs'>{user?.email}</span>
                </div>
                <ChevronsUpDown className='ml-auto size-4' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
              side={isMobile ? 'bottom' : 'right'}
              align='end'
              sideOffset={4}
            >
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                  <Avatar className='size-8 rounded-lg'>
                    <AvatarFallback className='rounded-lg'>
                      {user?.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-semibold'>
                      {user?.username}
                    </span>
                    <span className='truncate text-xs'>{user?.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Sparkles />
                  Upgrade to Pro
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setSecurityOpen(true)}>
                  <BadgeCheck />
                  {t('AccountSecurity.menu')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell />
                  Notifications
                </DropdownMenuItem>

                {/*语言切换*/}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <LanguagesIcon />
                    {t('Language.language')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {locales.map((locale) => (
                        <DropdownMenuItem
                          key={locale}
                          onClick={() => handleLocaleChange(locale)}
                          className={
                            currentLocale === locale ? 'bg-accent' : ''
                          }
                        >
                          {localeNames[locale]}
                          {currentLocale === locale && ' ✓'}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={logout.isPending}
              >
                <LogOut />
                {logout.isPending ? '退出中...' : 'Log out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AccountSecurityDialog
            open={securityOpen}
            onOpenChange={setSecurityOpen}
          />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
