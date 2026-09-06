'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCodeAgentAvailability,
  getCodexAgentSettings,
  getOpenCodeAgentSettings,
  saveCodexAgentSettings,
  saveOpenCodeCredentials,
  startCodexLogin,
} from '@/app/actions/code-agent'

export function useCodeAgentAvailability() {
  return useQuery({
    queryKey: ['code-agent', 'availability'],
    queryFn: getCodeAgentAvailability,
    staleTime: 60_000,
    retry: false,
  })
}

export function useStartCodexLogin() {
  return useMutation({
    mutationFn: startCodexLogin,
  })
}

export function useCodexAgentSettings() {
  return useQuery({
    queryKey: ['code-agent', 'codex', 'settings'],
    queryFn: getCodexAgentSettings,
  })
}

export function useSaveCodexAgentSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveCodexAgentSettings,
    onSuccess: (data) =>
      queryClient.setQueryData(['code-agent', 'codex', 'settings'], data),
  })
}

export function useOpenCodeAgentSettings() {
  return useQuery({
    queryKey: ['code-agent', 'opencode', 'settings'],
    queryFn: getOpenCodeAgentSettings,
  })
}

export function useSaveOpenCodeCredentials() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveOpenCodeCredentials,
    onSuccess: (data) => {
      queryClient.setQueryData(['code-agent', 'opencode', 'settings'], data)
      return queryClient.invalidateQueries({
        queryKey: ['code-agent', 'availability'],
      })
    },
  })
}
