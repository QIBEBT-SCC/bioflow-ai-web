import type { Metadata } from 'next'
import { Suspense } from 'react'
import ToolPageClient from './tool-page-client'

export const metadata: Metadata = {
  title: 'Tools',
  description: 'Browse and manage workflow tools for BioFlow AI.',
}

export default function ToolsPage() {
  return (
    <Suspense>
      <ToolPageClient />
    </Suspense>
  )
}
