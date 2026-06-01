import type { Metadata } from 'next'
import AddToolPageClient from './add-tool-page-client'

export const metadata: Metadata = {
  title: 'Add Tool',
  description: 'Create a Docker tool for BioFlow AI workflows.',
}

export default function AddToolPage() {
  return <AddToolPageClient />
}
