'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  createCode,
  deleteCode,
  generateCodeMetadata,
  getCode,
  getCodeList,
  updateCode,
} from '@/app/actions/code'
import type {
  CodeCreate,
  CodeInfo,
  CodeMetadataRequest,
  CodeNodeType,
  CodeUpdate,
  PaginatedCodes,
} from '@/types/code'

export function useCodeList({
  query,
  nodeType,
  offset,
  limit,
}: {
  query: string
  nodeType?: CodeNodeType
  offset: number
  limit: number
}) {
  return useQuery<PaginatedCodes>({
    queryKey: ['codes', query, nodeType, offset, limit],
    queryFn: () => getCodeList({ query, nodeType, offset, limit }),
    staleTime: 2 * 60 * 1000,
  })
}

export function useCode(uid: string) {
  return useQuery<CodeInfo>({
    queryKey: ['code', uid],
    queryFn: () => getCode(uid),
    enabled: !!uid,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateCode() {
  const queryClient = useQueryClient()
  const t = useTranslations('code.Toast')

  return useMutation({
    mutationFn: (code: CodeCreate) => createCode(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codes'] })
      toast.success(t('createSuccess'))
    },
    onError: (error: Error) => {
      toast.error(t('createError', { message: error.message }))
    },
  })
}

export function useGenerateCodeMetadata() {
  const t = useTranslations('code.Toast')

  return useMutation({
    mutationFn: (request: CodeMetadataRequest) => generateCodeMetadata(request),
    onError: (error: Error) => {
      toast.error(t('generateError', { message: error.message }))
    },
  })
}

export function useUpdateCode() {
  const queryClient = useQueryClient()
  const t = useTranslations('code.Toast')

  return useMutation({
    mutationFn: ({ uid, code }: { uid: string; code: CodeUpdate }) =>
      updateCode(uid, code),
    onSuccess: (updatedCode) => {
      queryClient.setQueryData(['code', updatedCode.uid], updatedCode)
      queryClient.invalidateQueries({ queryKey: ['codes'] })
      toast.success(t('updateSuccess'))
    },
    onError: (error: Error) => {
      toast.error(t('updateError', { message: error.message }))
    },
  })
}

export function useDeleteCode() {
  const queryClient = useQueryClient()
  const t = useTranslations('code.Toast')

  return useMutation({
    mutationFn: (uid: string) => deleteCode(uid),
    onSuccess: (_data, uid) => {
      queryClient.removeQueries({ queryKey: ['code', uid] })
      queryClient.invalidateQueries({ queryKey: ['codes'] })
      toast.success(t('deleteSuccess'))
    },
    onError: (error: Error) => {
      toast.error(t('deleteError', { message: error.message }))
    },
  })
}
