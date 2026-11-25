import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import LibraryPageClient from '@/app/(main)/library/library-page-client'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Library.meta')
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default function LibraryPage() {
  return <LibraryPageClient />
}
