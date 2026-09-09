import { clientFetchV2 } from '@/lib/api-client'
import type {
  PaginatedWorkflowRunsV2,
  WorkflowRunStatusV2,
} from '@/types/workflow-v2'

export async function getWorkflowMonitorRuns(
  offset: number,
  limit: number,
  status?: WorkflowRunStatusV2,
): Promise<PaginatedWorkflowRunsV2> {
  const params: Record<string, string> = {
    offset: String(offset),
    limit: String(limit),
  }
  if (status) params.status = status
  return await clientFetchV2<PaginatedWorkflowRunsV2>('/runs', { params })
}
