'use client'

import {
  ActivityIcon,
  DollarSignIcon,
  ShieldIcon,
  UserCheckIcon,
  UsersIcon,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'
import {
  CreateUserDialog,
  UserRowActions,
} from '@/components/settings/user-security-actions'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useUsers } from '@/hooks/use-user'
import { UserRole } from '@/types/auth'
import type { ManagedUser } from '@/types/user'

const skeletonRows = [
  'user-skeleton-1',
  'user-skeleton-2',
  'user-skeleton-3',
  'user-skeleton-4',
  'user-skeleton-5',
  'user-skeleton-6',
  'user-skeleton-7',
  'user-skeleton-8',
]

function toNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function useUsdCostFormatter() {
  const locale = useLocale()

  return useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersIcon
  label: string
  value: string
}) {
  return (
    <Card className='p-5'>
      <div className='flex items-center justify-between gap-4'>
        <div className='space-y-1'>
          <p className='text-sm text-muted-foreground'>{label}</p>
          <p className='text-2xl font-semibold tabular-nums'>{value}</p>
        </div>
        <div className='flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary'>
          <Icon className='size-5' />
        </div>
      </div>
    </Card>
  )
}

function RoleBadge({ role }: { role: UserRole }) {
  const t = useTranslations('setting.user_management')
  const variants = {
    [UserRole.VISITOR]: 'secondary',
    [UserRole.MEMBER]: 'outline',
    [UserRole.ADMIN]: 'default',
  } as const

  return <Badge variant={variants[role]}>{t(`role_${role}`)}</Badge>
}

function UserIdentity({ user }: { user: ManagedUser }) {
  const fallback = user.username.slice(0, 2).toUpperCase()

  return (
    <div className='flex min-w-0 items-center gap-3'>
      <div className='flex size-9 shrink-0 items-center justify-center rounded-md bg-muted font-medium text-muted-foreground text-xs'>
        {fallback}
      </div>
      <div className='min-w-0'>
        <div className='truncate font-medium'>{user.username}</div>
        <div className='text-muted-foreground text-xs'>ID {user.id}</div>
      </div>
    </div>
  )
}

function UserTableSkeleton() {
  return skeletonRows.map((key) => (
    <TableRow key={key} className='h-16'>
      <TableCell className='px-5'>
        <div className='flex items-center gap-3'>
          <Skeleton className='size-9 rounded-md' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-28' />
            <Skeleton className='h-3 w-12' />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className='h-5 w-48' />
      </TableCell>
      <TableCell>
        <Skeleton className='h-6 w-20' />
      </TableCell>
      <TableCell>
        <Skeleton className='h-6 w-16' />
      </TableCell>
      <TableCell>
        <Skeleton className='h-5 w-24' />
      </TableCell>
      <TableCell>
        <Skeleton className='h-5 w-24' />
      </TableCell>
      <TableCell>
        <Skeleton className='h-5 w-16' />
      </TableCell>
      <TableCell className='pr-5'>
        <Skeleton className='ml-auto size-8 rounded-md' />
      </TableCell>
    </TableRow>
  ))
}

export function UserManagement() {
  const t = useTranslations('setting.user_management')
  const usersQuery = useUsers()
  const currency = useUsdCostFormatter()
  const users = usersQuery.data ?? []

  const totalCost = users.reduce(
    (sum, user) => sum + toNumber(user.total_cost),
    0,
  )
  const monthlyCost = users.reduce(
    (sum, user) => sum + toNumber(user.monthly_cost),
    0,
  )
  const runCount = users.reduce((sum, user) => sum + user.run_count, 0)
  const adminCount = users.filter((user) => user.role === UserRole.ADMIN).length
  const activeCount = users.filter((user) => user.is_active).length

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5'>
        <StatCard
          icon={UsersIcon}
          label={t('total_users')}
          value={users.length.toLocaleString()}
        />
        <StatCard
          icon={UserCheckIcon}
          label={t('active_users')}
          value={activeCount.toLocaleString()}
        />
        <StatCard
          icon={ShieldIcon}
          label={t('admin_users')}
          value={adminCount.toLocaleString()}
        />
        <StatCard
          icon={DollarSignIcon}
          label={t('monthly_cost')}
          value={currency.format(monthlyCost)}
        />
        <StatCard
          icon={ActivityIcon}
          label={t('run_count')}
          value={runCount.toLocaleString()}
        />
      </div>

      <Card className='gap-0 overflow-hidden p-0'>
        <div className='flex items-center justify-between border-b px-5 py-4'>
          <div>
            <h2 className='font-semibold'>{t('table_title')}</h2>
            <p className='text-sm text-muted-foreground'>
              {t('table_description', {
                totalCost: currency.format(totalCost),
              })}
            </p>
          </div>
          <CreateUserDialog />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='px-5'>{t('col_username')}</TableHead>
              <TableHead>{t('col_email')}</TableHead>
              <TableHead className='w-32'>{t('col_role')}</TableHead>
              <TableHead className='w-28'>{t('col_status')}</TableHead>
              <TableHead className='w-36 text-right'>
                {t('col_total_cost')}
              </TableHead>
              <TableHead className='w-36 text-right'>
                {t('col_monthly_cost')}
              </TableHead>
              <TableHead className='w-28 pr-8 text-right'>
                {t('col_runs')}
              </TableHead>
              <TableHead className='w-20 pr-5 text-right'>
                {t('col_action')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.isLoading ? (
              <UserTableSkeleton />
            ) : usersQuery.isError ? (
              <TableRow>
                <TableCell colSpan={8} className='h-32 text-center'>
                  <div className='text-muted-foreground'>
                    {t('load_failed')}
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className='h-32 text-center'>
                  <div className='text-muted-foreground'>{t('empty')}</div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className='h-16'>
                  <TableCell className='px-5'>
                    <UserIdentity user={user} />
                  </TableCell>
                  <TableCell className='max-w-64 truncate text-muted-foreground'>
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className={
                        user.is_active
                          ? 'border-success/30 bg-success/10 text-success'
                          : ''
                      }
                    >
                      {user.is_active ? t('active') : t('inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right font-medium tabular-nums'>
                    {currency.format(toNumber(user.total_cost))}
                  </TableCell>
                  <TableCell className='text-right tabular-nums text-muted-foreground'>
                    {currency.format(toNumber(user.monthly_cost))}
                  </TableCell>
                  <TableCell className='pr-8 text-right tabular-nums text-muted-foreground'>
                    {user.run_count.toLocaleString()}
                  </TableCell>
                  <TableCell className='pr-5 text-right'>
                    <UserRowActions user={user} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
