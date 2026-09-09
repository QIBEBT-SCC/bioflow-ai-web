import { clientFetchV2 } from '@/lib/api-client'
import type { MonitorPublic, ToolOutput } from '@/types/task'
import type { NodeRunV2 } from '@/types/workflow-v2'

export async function getNodeRun(uid: string): Promise<NodeRunV2> {
  return clientFetchV2<NodeRunV2>(`/node-runs/${uid}`)
}

export async function getNodeRunResult(uid: string): Promise<ToolOutput> {
  return clientFetchV2<ToolOutput>(`/node-runs/${uid}/result`)
}

export async function getNodeRunMonitor(uid: string): Promise<MonitorPublic[]> {
  return clientFetchV2<MonitorPublic[]>(`/node-runs/${uid}/monitor`)
}

export async function getNodeRunLog(
  uid: string,
): Promise<{ content: string; offset: number }> {
  return clientFetchV2<{ content: string; offset: number }>(
    `/node-runs/${uid}/log`,
  )
}
