import { clientFetch, clientFetchV2 } from '@/lib/api-client'
import type {
  AddWorkflowRequest,
  ProjectWorkflow,
  WorkflowRunResult,
} from '@/types/project-workflow'
import type {
  PaginatedWorkflowRunsV2,
  ProjectWorkflowRunRequestV2,
  WorkflowRunStatisticsV2,
  WorkflowRunV2,
} from '@/types/workflow-v2'

/**
 * 添加工作流到项目
 */
export async function addWorkflowToProject(
  projectId: string,
  data: AddWorkflowRequest,
): Promise<ProjectWorkflow> {
  return await clientFetch<ProjectWorkflow>(
    `/projects/${projectId}/workflows`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  )
}

/**
 * 获取项目的工作流列表
 */
export async function getProjectWorkflows(
  projectId: string,
  offset: number = 0,
  limit: number = 20,
): Promise<ProjectWorkflow[]> {
  return await clientFetch<ProjectWorkflow[]>(
    `/projects/${projectId}/workflows`,
    {
      params: {
        offset: String(offset),
        limit: String(limit),
      },
    },
  )
}

/**
 * 从项目移除工作流
 */
export async function removeWorkflowFromProject(
  projectId: string,
  workflowUid: string,
): Promise<{ message: string }> {
  return await clientFetch<{ message: string }>(
    `/projects/${projectId}/workflows/${workflowUid}`,
    {
      method: 'DELETE',
    },
  )
}

/**
 * 运行工作流
 */
export async function runWorkflow(
  projectId: string,
  workflowUid: string,
  data: ProjectWorkflowRunRequestV2,
): Promise<WorkflowRunResult> {
  return await clientFetchV2<WorkflowRunResult>(
    `/projects/${projectId}/workflows/${workflowUid}/run`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  )
}

/**
 * 获取项目的运行历史
 */
export async function getProjectRuns(
  projectId: string,
  offset: number = 0,
  limit: number = 20,
): Promise<PaginatedWorkflowRunsV2> {
  return await clientFetchV2<PaginatedWorkflowRunsV2>(
    `/projects/${projectId}/runs`,
    {
      params: {
        offset: String(offset),
        limit: String(limit),
      },
    },
  )
}

/**
 * 获取项目运行实例数量
 */
export async function getProjectRunCount(projectId: string): Promise<number> {
  return (await getProjectRunStats(projectId)).total
}

/**
 * 获取项目运行实例统计信息
 */
export async function getProjectRunStats(
  projectId: string,
): Promise<WorkflowRunStatisticsV2> {
  return await clientFetchV2<WorkflowRunStatisticsV2>(
    `/projects/${projectId}/runs/stats`,
  )
}

/**
 * 下载工作流所有运行结果打包（zip）
 */
export async function downloadWorkflowPackage(
  projectId: string,
  workflowUid: string,
): Promise<{ blob: Blob; filename: string }> {
  const res = await clientFetchV2(
    `/projects/${projectId}/workflows/${workflowUid}/package`,
    { raw: true },
  )

  const blob = await res.blob()
  const disposition = res.headers.get('content-disposition') ?? ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match?.[1] ?? `${workflowUid}_results.zip`
  return { blob, filename }
}

/**
 * 获取运行实例详情
 */
export async function getProjectRun(
  _projectId: string,
  runUid: string,
): Promise<WorkflowRunV2> {
  return await clientFetchV2<WorkflowRunV2>(`/runs/${runUid}`)
}
