'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addSampleFile,
  createSample,
  deleteSample,
  deleteSampleFile,
  getSample,
  getSampleCount,
  getSampleFiles,
  getSamples,
  updateSample,
} from '@/app/actions/sample'
import type {
  AddSampleFileRequest,
  CreateSampleRequest,
  Sample,
  SampleFile,
  SampleListItem,
  UpdateSampleRequest,
} from '@/types/sample'

// ============================================
// Query Hooks (数据查询)
// ============================================

/**
 * 获取项目的样本列表
 */
export function useSamples(
  projectId: string,
  offset: number = 0,
  limit: number = 20,
) {
  return useQuery<SampleListItem[]>({
    queryKey: ['samples', projectId, offset, limit],
    queryFn: () => getSamples(projectId, offset, limit),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  })
}

/**
 * 获取项目的样本数量
 */
export function useSampleCount(projectId: string) {
  return useQuery<number>({
    queryKey: ['samples', projectId, 'count'],
    queryFn: () => getSampleCount(projectId),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  })
}

/**
 * 获取样本详情
 */
export function useSample(projectId: string, sampleUid: string) {
  return useQuery<Sample>({
    queryKey: ['samples', projectId, sampleUid],
    queryFn: () => getSample(projectId, sampleUid),
    enabled: !!projectId && !!sampleUid,
    staleTime: 30 * 1000,
  })
}

/**
 * 获取样本的文件列表
 */
export function useSampleFiles(projectId: string, sampleUid: string) {
  return useQuery<SampleFile[]>({
    queryKey: ['samples', projectId, sampleUid, 'files'],
    queryFn: () => getSampleFiles(projectId, sampleUid),
    enabled: !!projectId && !!sampleUid,
    staleTime: 30 * 1000,
  })
}

// ============================================
// Mutation Hooks (数据变更)
// ============================================

/**
 * 创建样本
 */
export function useCreateSample() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string
      data: CreateSampleRequest
    }) => createSample(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['samples', projectId] })
    },
  })
}

/**
 * 更新样本
 */
export function useUpdateSample() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      sampleUid,
      data,
    }: {
      projectId: string
      sampleUid: string
      data: UpdateSampleRequest
    }) => updateSample(projectId, sampleUid, data),
    onSuccess: (_, { projectId, sampleUid }) => {
      queryClient.invalidateQueries({ queryKey: ['samples', projectId] })
      queryClient.invalidateQueries({
        queryKey: ['samples', projectId, sampleUid],
      })
    },
  })
}

/**
 * 删除样本
 */
export function useDeleteSample() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      sampleUid,
    }: {
      projectId: string
      sampleUid: string
    }) => deleteSample(projectId, sampleUid),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['samples', projectId] })
    },
  })
}

/**
 * 添加样本文件
 */
export function useAddSampleFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      sampleUid,
      data,
    }: {
      projectId: string
      sampleUid: string
      data: AddSampleFileRequest
    }) => addSampleFile(projectId, sampleUid, data),
    onSuccess: (_, { projectId, sampleUid }) => {
      queryClient.invalidateQueries({
        queryKey: ['samples', projectId, sampleUid],
      })
      queryClient.invalidateQueries({
        queryKey: ['samples', projectId, sampleUid, 'files'],
      })
    },
  })
}

/**
 * 删除样本文件
 */
export function useDeleteSampleFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      sampleUid,
      fileUid,
    }: {
      projectId: string
      sampleUid: string
      fileUid: string
    }) => deleteSampleFile(projectId, sampleUid, fileUid),
    onSuccess: (_, { projectId, sampleUid }) => {
      queryClient.invalidateQueries({
        queryKey: ['samples', projectId, sampleUid],
      })
      queryClient.invalidateQueries({
        queryKey: ['samples', projectId, sampleUid, 'files'],
      })
    },
  })
}
