import type { Metadata } from 'next'
import ImagePageClient from '@/app/(main)/image/image-page-client'

export const metadata: Metadata = {
  title: 'Images',
  description: 'Browse and manage Docker images for BioFlow AI workflows.',
}

export default function ImagePage() {
  return <ImagePageClient />
}
