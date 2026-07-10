import { clientFetch } from '@/lib/api-client'
import type {
  PaginatedProjects,
  ProjectCreateProp,
  ProjectPublic,
  ProjectTag,
  ProjectTagProp,
  ProjectUpdateProp,
  TagWithCount,
} from '@/types/project'

/**
 * 获取项目列表（分页）
 */
export async function getProjects(
  offset: number = 0,
  limit: number = 20,
  filter?: string,
): Promise<PaginatedProjects> {
  const params: Record<string, string> = {
    offset: String(offset),
    limit: String(limit),
  }
  if (filter) {
    params.filter = filter
  }
  return await clientFetch<PaginatedProjects>('/projects', {
    params,
  })
}

/**
 * 获取最近访问/创建的项目
 */
export async function getRecentProjects(
  limit: number = 5,
): Promise<ProjectPublic[]> {
  return await clientFetch<ProjectPublic[]>('/projects/recent', {
    params: {
      limit: String(limit),
    },
  })
}

/**
 * 获取单个项目详情
 */
export async function getProject(id: string): Promise<ProjectPublic> {
  return await clientFetch<ProjectPublic>(`/projects/${id}`)
}

/**
 * 创建项目
 */
export async function createProject(
  data: ProjectCreateProp,
): Promise<ProjectPublic> {
  return await clientFetch<ProjectPublic>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 更新项目
 */
export async function updateProject(
  id: string,
  data: ProjectUpdateProp,
): Promise<ProjectPublic> {
  return await clientFetch<ProjectPublic>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * 删除项目
 */
export async function deleteProject(id: string): Promise<void> {
  return await clientFetch<void>(`/projects/${id}`, {
    method: 'DELETE',
  })
}

/**
 * 收藏项目
 */
export async function starProject(id: string): Promise<void> {
  return await clientFetch<void>(`/projects/${id}/star`, {
    method: 'POST',
  })
}

/**
 * 取消收藏项目
 */
export async function unstarProject(id: string): Promise<void> {
  return await clientFetch<void>(`/projects/${id}/unstar`, {
    method: 'POST',
  })
}

/**
 * 创建项目标签
 */
export async function createProjectTag(
  data: ProjectTagProp,
): Promise<ProjectTag> {
  return await clientFetch<ProjectTag>('/project-tags', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 获取所有项目标签
 */
export async function getProjectTags(): Promise<TagWithCount[]> {
  return await clientFetch<TagWithCount[]>('/project-tags')
}
