'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CodeForm } from '@/components/code/code-form'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useCode } from '@/hooks/use-code'

export default function CodeEditPageClient() {
  const params = useParams()
  const uid = params.uid as string
  const t = useTranslations('code.Edit')
  const { push } = useRouter()
  const { data: code, isLoading, isError } = useCode(uid)

  return (
    <SidebarInset className='h-screen overflow-hidden'>
      <header className='flex h-12 shrink-0 items-center gap-2 border-b px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2! h-4!' />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href='/code'>{t('breadcrumb')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/code/${uid}`}>{code?.name ?? t('loading')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className='min-h-0 flex-1 overflow-hidden'>
        {isLoading && (
          <div className='h-full space-y-4 p-6'>
            <Skeleton className='h-12 w-full' />
            <Skeleton className='h-[calc(100%_-_4rem)] w-full' />
          </div>
        )}

        {isError && (
          <div className='p-6'>
            <Empty className='border'>
              <EmptyHeader>
                <EmptyTitle>{t('notFound')}</EmptyTitle>
                <EmptyDescription>{t('notFoundDescription')}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}

        {code && (
          <CodeForm code={code} onSaved={() => push(`/code/${code.uid}`)} />
        )}
      </div>
    </SidebarInset>
  )
}
