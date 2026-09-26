'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CodeCreateForm } from '@/components/code/code-create-form'
import { PageBreadcrumbs } from '@/components/layout/page-shell'
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
    <PageBreadcrumbs
      items={[{ label: t('breadcrumb'), href: '/code' }, { label: title }]}
    />
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
