import type { Metadata } from 'next'
import ProjectDetailPageClient from '@/app/(main)/project/[id]/project-detail-page-client'
import { getProjectListHref } from '@/lib/project-navigation'

export const metadata: Metadata = {
  title: 'Project details',
  description: 'View and manage project data, samples, and workflows.',
}

type ProjectDetailPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ProjectDetailPage({
  searchParams,
}: ProjectDetailPageProps) {
  const params = await searchParams
  const from = typeof params.from === 'string' ? params.from : null

  return <ProjectDetailPageClient projectListHref={getProjectListHref(from)} />
}
