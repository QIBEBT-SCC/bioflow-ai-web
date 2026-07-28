'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CodeCreateForm } from '@/components/code/code-create-form'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import type { CodeNodeType } from '@/types/code'

export default function CodeAddPageClient({
  nodeType,
}: {
  nodeType: CodeNodeType
}) {
  const t = useTranslations('code.Create')
  const { push } = useRouter()
  const title = nodeType === 'code_python' ? t('pythonTitle') : t('bashTitle')

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
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className='min-h-0 flex-1 overflow-hidden'>
        <CodeCreateForm
          key={nodeType}
          nodeType={nodeType}
          onCreated={(uid) => {
            push(`/code/${uid}`)
          }}
        />
      </div>
    </SidebarInset>
  )
}
