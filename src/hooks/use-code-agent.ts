'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import {
  getCodeAgentAvailability,
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
