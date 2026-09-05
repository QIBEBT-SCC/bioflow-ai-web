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
import type { CodeNodeType } from '@/types/code'

export default function CodeAddPageClient({
  nodeType,
}: {
  nodeType: CodeNodeType
}) {
  const t = useTranslations('code.Create')
  const { push } = useRouter()
  const title =
    nodeType === 'code_python'
      ? t('pythonTitle')
      : nodeType === 'code_R'
        ? t('rTitle')
        : t('bashTitle')

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
          <BreadcrumbPage>{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )

  return (
    <CodeCreateForm
      key={nodeType}
      nodeType={nodeType}
      onCreated={(uid) => {
        push(`/code/${uid}`)
      }}
    >
      {pageHeaderContent}
    </CodeCreateForm>
  )
}
