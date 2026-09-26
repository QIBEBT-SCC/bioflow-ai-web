'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  buildGenomeIndex,
  deleteGenome,
  downloadGenome,
  getGenome,
  getGenomeCount,
  getGenomeList,
  searchGenome,
} from '@/app/actions/genome'
import type {
  ReferenceGenomeBuildIndexRequest,
  ReferenceGenomeDownloadRequest,
} from '@/types/genome'

// ============================================
// Query Hooks
// ============================================

/**
 * 基因组列表（分页）
 */
export const useGenomeList = (offset: number = 0, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['genomes', 'list', offset],
    queryFn: () => getGenomeList(offset, 10),
    enabled,
    staleTime: 30 * 1000, // 30s，因为 building 状态会变化
  })
}

/**
 * 基因组总数
 */
export const useGenomeCount = () => {
  return useQuery({
    queryKey: ['genomes', 'count'],
    queryFn: () => getGenomeCount(),
    staleTime: 30 * 1000,
  })
}

/**
 * 搜索本地基因组
 */
export const useSearchGenome = (q: string) => {
  return useQuery({
    queryKey: ['genomes', 'search', q],
    queryFn: () => searchGenome(q),
    enabled: q.trim().length > 0,
    staleTime: 15 * 1000,
  })
}

/**
 * 单个基因组详情
 */
export const useGenome = (id: number | null) => {
  return useQuery({
    queryKey: ['genome', id],
    queryFn: () => getGenome(id ?? -1),
    enabled: id !== null,
    staleTime: 15 * 1000,
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * 删除基因组
 */
export const useDeleteGenome = () => {
  const t = useTranslations('Toast.genome')
  const tUnknown = useTranslations('Toast')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteGenome(id),
    onSuccess: (_, id) => {
      toast.success(t('deleteSuccess'))
      queryClient.invalidateQueries({ queryKey: ['genomes', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['genomes', 'count'] })
      queryClient.removeQueries({ queryKey: ['genome', id] })
    },
    onError: (error: Error) => {
      toast.error(
        t('deleteFailed', {
          message: error.message || tUnknown('unknownError'),
        }),
      )
    },
  })
}

/**
 * 下载新基因组（触发后台任务）
 */
export const useDownloadGenome = () => {
  const t = useTranslations('Toast.genome')
  const tUnknown = useTranslations('Toast')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ReferenceGenomeDownloadRequest) => downloadGenome(data),
    onSuccess: (resp) => {
      if (resp.task_id) {
        toast.success(
          t('downloadSubmitted', {
            species: resp.species_name,
            accession: resp.ncbi_accession,
          }),
        )
      } else {
        toast.info(t('alreadyExists', { species: resp.species_name }))
      }
      queryClient.invalidateQueries({ queryKey: ['genomes', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['genomes', 'count'] })
    },
    onError: (error: Error & { status?: number }) => {
      if (error.status === 404) {
        toast.error(t('notFound'))
      } else {
        toast.error(
          t('downloadFailed', {
            message: error.message || tUnknown('unknownError'),
          }),
        )
      }
    },
  })
}

/**
 * 为已有基因组构建索引
 */
export const useBuildGenomeIndex = () => {
  const t = useTranslations('Toast.genome')
  const tUnknown = useTranslations('Toast')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: ReferenceGenomeBuildIndexRequest
    }) => buildGenomeIndex(id, data),
    onSuccess: (resp, { id }) => {
      toast.success(t('buildSubmitted', { message: resp.message }))
      // 刷新详情缓存（状态会变 building）
      queryClient.invalidateQueries({ queryKey: ['genome', id] })
      queryClient.invalidateQueries({ queryKey: ['genomes', 'list'] })
    },
    onError: (error: Error) => {
      toast.error(
        t('buildFailed', {
          message: error.message || tUnknown('unknownError'),
        }),
      )
    },
  })
}
