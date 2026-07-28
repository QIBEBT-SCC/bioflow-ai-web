import type { Metadata } from 'next'
import { Suspense } from 'react'
import type { CodeNodeType } from '@/types/code'
import CodePageClient from './code-page-client'

export const metadata: Metadata = {
  title: 'CODE Nodes',
  description: 'Manage reusable CODE nodes for BioFlow AI workflows.',
}

interface CodePageProps {
  searchParams: Promise<{
    q?: string | string[]
    type?: string | string[]
    page?: string | string[]
  }>
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function CodePage({ searchParams }: CodePageProps) {
  const params = await searchParams
  const query = firstParam(params.q) ?? ''
  const typeParam = firstParam(params.type)
  const nodeType: CodeNodeType | undefined =
    typeParam === 'code_bash' || typeParam === 'code_python'
      ? typeParam
      : undefined
  const parsedPage = Number(firstParam(params.page) ?? '1')
  const currentPage =
    Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1

  return (
    <Suspense>
      <CodePageClient
        query={query}
        nodeType={nodeType}
        currentPage={currentPage}
      />
    </Suspense>
  )
}
