'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createLLMModel,
  createLLMProvider,
  deleteLLMModel,
  deleteLLMProvider,
  getLLMModel,
  getLLMModels,
  getLLMProvider,
  getLLMProviders,
  getLLMSettings,
  getLLMStatisticsDetails,
  getLLMStatisticsOverview,
  getProviderModels,
  updateLLMModel,
  updateLLMProvider,
  updateLLMSetting,
} from '@/app/actions/setting'
import type {
  LLMModelCreate,
  LLMModelUpdate,
  LLMProviderCreate,
  LLMProviderUpdate,
  LLMSettingUpdate,
} from '@/types/setting'

// ============================================
// Query Hooks
// ============================================

export function useLLMProviders() {
  return useQuery({
    queryKey: ['llm-providers'],
    queryFn: getLLMProviders,
    staleTime: 60 * 1000,
  })
}

export function useLLMModels() {
  return useQuery({
    queryKey: ['llm-models'],
    queryFn: getLLMModels,
    staleTime: 60 * 1000,
  })
}

export function useProviderModels(providerId: number) {
  return useQuery({
    queryKey: ['llm-provider-models', providerId],
    queryFn: () => getProviderModels(providerId),
    enabled: !!providerId,
  })
}

export function useLLMProvider(id: number) {
  return useQuery({
    queryKey: ['llm-provider', id],
    queryFn: () => getLLMProvider(id),
    enabled: !!id,
  })
}

export function useLLMModel(id: number) {
  return useQuery({
    queryKey: ['llm-model', id],
    queryFn: () => getLLMModel(id),
    enabled: !!id,
  })
}

// ============================================
// Global Settings Hooks
// ============================================

export function useLLMSettings() {
  return useQuery({
    queryKey: ['llm-settings'],
    queryFn: getLLMSettings,
    staleTime: 60 * 1000,
  })
}

// ============================================
// Statistics Hooks
// ============================================

export function useLLMStatisticsOverview(params?: {
  start_date?: string
  end_date?: string
}) {
  return useQuery({
    queryKey: ['llm-statistics-overview', params],
    queryFn: () => getLLMStatisticsOverview(params),
  })
}

export function useLLMStatisticsDetails(params: {
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: ['llm-statistics-details', params],
    queryFn: () => getLLMStatisticsDetails(params),
  })
}

// ============================================
// Mutation Hooks
// ============================================

// --- Providers ---

export function useCreateLLMProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LLMProviderCreate) => createLLMProvider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-providers'] })
    },
  })
}

export function useUpdateLLMProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LLMProviderUpdate }) =>
      updateLLMProvider(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-providers'] })
    },
  })
}

export function useDeleteLLMProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteLLMProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-providers'] })
    },
  })
}

// --- Models ---

export function useCreateLLMModel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LLMModelCreate) => createLLMModel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-models'] })
      queryClient.invalidateQueries({ queryKey: ['llm-provider-models'] })
    },
  })
}

export function useUpdateLLMModel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LLMModelUpdate }) =>
      updateLLMModel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-models'] })
      queryClient.invalidateQueries({ queryKey: ['llm-provider-models'] })
    },
  })
}

export function useDeleteLLMModel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteLLMModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-models'] })
      queryClient.invalidateQueries({ queryKey: ['llm-provider-models'] })
    },
  })
}

// ============================================
// Global Settings Mutations
// ============================================

export function useUpdateLLMSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LLMSettingUpdate) => updateLLMSetting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-settings'] })
    },
  })
}
