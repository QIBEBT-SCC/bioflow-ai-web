'use client'

import { ArrowLeftIcon } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { BreadcrumbLink } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'

export function ProjectListBreadcrumbLink({
  children,
  href,
}: {
  children: ReactNode
  href: string
}) {
  return (
    <BreadcrumbLink asChild>
      <Link href={href}>{children}</Link>
    </BreadcrumbLink>
  )
}

export function ProjectListBackLink({ href }: { href: string }) {
  const t = useTranslations('Project.detail')

  return (
    <Button variant='ghost' size='sm' className='-ml-2' asChild>
      <Link href={href}>
        <ArrowLeftIcon className='size-4' />
        {t('backToList')}
      </Link>
    </Button>
  )
}
