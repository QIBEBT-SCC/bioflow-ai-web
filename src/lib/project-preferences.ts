import type { ProjectSort, ProjectViewMode } from '@/types/project'

export const PROJECT_SORT_COOKIE = 'project-sort'
export const PROJECT_VIEW_COOKIE = 'project-view'

export function getProjectSortPreference(
  value: string | undefined,
): ProjectSort {
  return value === 'nameAsc' || value === 'nameDesc' ? value : 'recent'
}

export function getProjectViewPreference(
  value: string | undefined,
): ProjectViewMode {
  return value === 'grid' ? 'grid' : 'list'
}
