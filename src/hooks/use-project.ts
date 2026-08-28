'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProject,
  createProjectTag,
  deleteProject,
  getProject,
  getProjects,
  getProjectTags,
  getRecentProjects,
  starProject,
  unstarProject,
  updateProject,
} from '@/app/actions/project'
import type {
  PaginatedProjects,
  ProjectCreateProp,
  ProjectPublic,
  ProjectSort,
  ProjectTagProp,
  ProjectUpdateProp,
  TagWithCount,
} from '@/types/project'
// ============================================
// Query Hooks (数据查询)
// ============================================
/**
 * 获取项目列表（分页）
 */
export function useProjects(
  offset: number = 0,
  limit: number = 20,
  filter?: string,
  sort: ProjectSort = 'recent',
  search?: string,
  tagId?: number | null,
) {
  return useQuery<PaginatedProjects>({
    queryKey: ['projects', offset, limit, filter, sort, search, tagId],
    queryFn: () => getProjects(offset, limit, filter, sort, search, tagId),
    staleTime: 30 * 1000,
  })
}
/**
 * 获取最近访问/创建的项目
 */
export function useRecentProjects(limit: number = 5) {
  return useQuery<ProjectPublic[]>({
    queryKey: ['projects', 'recent', limit],
    queryFn: () => getRecentProjects(limit),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}
/**
 * 获取单个项目详情
 */
export function useProject(id: string) {
  return useQuery<ProjectPublic>({
    queryKey: ['projects', id],
    queryFn: () => getProject(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

/**
 * 获取所有项目标签
 */
export function useProjectTags() {
  return useQuery<TagWithCount[]>({
    queryKey: ['project-tags'],
    queryFn: getProjectTags,
    staleTime: 5 * 60 * 1000,
  })
}
// ============================================
// Mutation Hooks (数据变更)
// ============================================
/**
 * 创建项目
 */
export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ data }: { data: ProjectCreateProp }) => createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', 'recent'] })
    },
  })
}
/**
 * 更新项目
 */
export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectUpdateProp }) =>
      updateProject(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', 'recent'] })
      queryClient.invalidateQueries({ queryKey: ['projects', String(data.id)] })
    },
  })
}
/**
 * 删除项目
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', 'recent'] })
    },
  })
}
/**
 * 收藏项目
 */
export function useStarProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => starProject(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      // 如果有列表包含收藏状态，也需要刷新
      queryClient.invalidateQueries({ queryKey: ['projects', 'recent'] })
      queryClient.invalidateQueries({ queryKey: ['projects', id] })
    },
  })
}
/**
 * 取消收藏项目
 */
export function useUnstarProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => unstarProject(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', 'recent'] })
      queryClient.invalidateQueries({ queryKey: ['projects', id] })
    },
  })
}
/**
 * 创建项目标签
 */
export function useCreateProjectTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ data }: { data: ProjectTagProp }) => createProjectTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tags'] })
    },
  })
}
