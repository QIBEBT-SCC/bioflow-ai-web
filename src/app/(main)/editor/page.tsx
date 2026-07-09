import type { Metadata } from 'next'
import { Suspense } from 'react'
import { EditorPageClient } from '@/app/(main)/editor/editor-page-client'

export const metadata: Metadata = {
  title: 'Workflow Editor',
  description: 'Build, save, load, and run BioFlow AI workflows.',
}

export default function EditorPage() {
  return (
    <Suspense>
      <EditorPageClient />
    </Suspense>
  )
}
