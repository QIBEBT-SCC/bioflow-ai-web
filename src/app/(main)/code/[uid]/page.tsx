import type { Metadata } from 'next'
import CodeDetailPageClient from './code-detail-page-client'

export const metadata: Metadata = {
  title: 'CODE Node Details',
  description: 'Inspect a reusable CODE node definition.',
}

export default function CodeDetailPage() {
  return <CodeDetailPageClient />
}
