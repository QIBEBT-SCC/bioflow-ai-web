'use client'

import { useQuery } from '@tanstack/react-query'
import { getWorkflowMonitorRuns } from '@/app/actions/workflow-monitor'
import type {
  PaginatedWorkflowRunsV2,
  WorkflowRunStatusV2,
} from '@/types/workflow-v2'

export function useWorkflowMonitorRuns(
  offset: number,
  limit: number,
  status?: WorkflowRunStatusV2,
  refetchInterval?: number | false,
) {
  return useQuery<PaginatedWorkflowRunsV2>({
    queryKey: ['runs', 'monitor', offset, limit, status],
    queryFn: () => getWorkflowMonitorRuns(offset, limit, status),
    staleTime: 30 * 1000,
    refetchInterval,
  })
}
