import type { Metadata } from 'next'
import CodeEditPageClient from './code-edit-page-client'

export const metadata: Metadata = {
  title: 'Edit CODE Node',
  description: 'Edit a reusable CODE node without changing its language.',
}

export default function CodeEditPage() {
  return <CodeEditPageClient />
}
