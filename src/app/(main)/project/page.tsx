import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import ProjectsPageClient from '@/app/(main)/project/project-page-client'
import {
  getProjectSortPreference,
  getProjectViewPreference,
  PROJECT_SORT_COOKIE,
  PROJECT_VIEW_COOKIE,
} from '@/lib/project-preferences'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Manage user projects in BioFlow AI workflows.',
}

type ProjectsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getSingleParam(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : undefined
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const [cookieStore, params] = await Promise.all([cookies(), searchParams])
  const initialSort = getProjectSortPreference(
    cookieStore.get(PROJECT_SORT_COOKIE)?.value,
  )
  const initialViewMode = getProjectViewPreference(
    cookieStore.get(PROJECT_VIEW_COOKIE)?.value,
  )
  const tabParam = getSingleParam(params.tab)
  const activeTab =
    tabParam === 'starred' || tabParam === 'my' ? tabParam : 'all'
  const search = getSingleParam(params.q) ?? ''
  const tagParam = Number(getSingleParam(params.tag) ?? '')
  const selectedTagId =
    Number.isInteger(tagParam) && tagParam > 0 ? tagParam : null
  const pageParam = Number(getSingleParam(params.page) ?? '1')
  const currentPage =
    Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1

  const listParams = new URLSearchParams()
  if (activeTab !== 'all') listParams.set('tab', activeTab)
  if (search) listParams.set('q', search)
  if (selectedTagId) listParams.set('tag', String(selectedTagId))
  if (currentPage > 1) listParams.set('page', String(currentPage))
  const query = listParams.toString()
  const projectListHref = query ? `/project?${query}` : '/project'

  return (
    <ProjectsPageClient
      activeTab={activeTab}
      search={search}
      selectedTagId={selectedTagId}
      currentPage={currentPage}
      projectListHref={projectListHref}
      initialSort={initialSort}
      initialViewMode={initialViewMode}
    />
  )
}
