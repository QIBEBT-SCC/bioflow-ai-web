'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCodeAgentAvailability,
  getCodingAgentSettings,
  saveCodingAgentSettings,
  startCodingAgentLogin,
} from '@/app/actions/code-agent'

export function useCodeAgentAvailability() {
  return useQuery({
    queryKey: ['code-agent', 'availability'],
    queryFn: getCodeAgentAvailability,
    staleTime: 60_000,
    retry: false,
  })
}

export function useStartCodingAgentLogin() {
  return useMutation({
    mutationFn: startCodingAgentLogin,
  })
}

export function useCodingAgentSettings() {
  return useQuery({
    queryKey: ['code-agent', 'settings'],
    queryFn: getCodingAgentSettings,
  })
}

export function useSaveCodingAgentSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveCodingAgentSettings,
    onSuccess: (data) =>
      queryClient.setQueryData(['code-agent', 'settings'], data),
  })
}
