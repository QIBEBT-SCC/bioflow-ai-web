import type { Metadata } from 'next'
import type { CodeNodeType } from '@/types/code'
import CodeAddPageClient from './code-add-page-client'

export const metadata: Metadata = {
  title: 'Create CODE Node',
  description: 'Create a reusable Bash or Python CODE node.',
}

interface CodeAddPageProps {
  searchParams: Promise<{
    type?: string | string[]
  }>
}

export default async function CodeAddPage({ searchParams }: CodeAddPageProps) {
  const typeParam = (await searchParams).type
  const typeValue = Array.isArray(typeParam) ? typeParam[0] : typeParam
  const nodeType: CodeNodeType =
    typeValue === 'code_python' ? 'code_python' : 'code_bash'

  return <CodeAddPageClient nodeType={nodeType} />
}
