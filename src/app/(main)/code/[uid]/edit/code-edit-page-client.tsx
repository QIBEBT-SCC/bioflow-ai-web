'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CodeForm } from '@/components/code/code-form'
import { CodePageHeader } from '@/components/code/code-page-header'
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
import { SidebarInset } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useCode } from '@/hooks/use-code'

export default function CodeEditPageClient() {
  const params = useParams()
  const uid = params.uid as string
  const t = useTranslations('code.Edit')
  const { push } = useRouter()
  const { data: code, isLoading, isError } = useCode(uid)

  const pageHeaderContent = (
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
  )

  if (isLoading || isError || !code) {
    return (
      <SidebarInset className='h-screen overflow-hidden'>
        <CodePageHeader>{pageHeaderContent}</CodePageHeader>
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
                  <EmptyDescription>
                    {t('notFoundDescription')}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </div>
      </SidebarInset>
    )
  }

  return (
    <CodeForm code={code} onSaved={() => push(`/code/${code.uid}`)}>
      {pageHeaderContent}
    </CodeForm>
  )
}
