import { clientFetchV2 } from '@/lib/api-client'
import type {
  ContactRegion,
  PreviewMeta,
  PreviewRegion,
  RunFileNode,
  TablePreviewFilter,
  TablePreviewMeta,
  TablePreviewPage,
  TablePreviewProfile,
  TablePreviewSort,
} from '@/types/run'
import type { WorkflowDefinition } from '@/types/workflow'
import type {
  PaginatedWorkflowRunsV2,
  WorkflowRunStatisticsV2,
  WorkflowRunV2,
} from '@/types/workflow-v2'

/**
 * 创建新的运行实例
 */
export async function newRunInstance(
  workflow: WorkflowDefinition,
  template_name?: string,
): Promise<WorkflowRunV2> {
  const endpoint = template_name
    ? `/workflows/run?template_name=${encodeURIComponent(template_name)}`
    : '/workflows/run'

  return await clientFetchV2<WorkflowRunV2>(endpoint, {
    method: 'POST',
    body: JSON.stringify(workflow),
  })
}

/**
 * 获取所有运行实例（分页）
 */
export async function getRuns(
  offset: number = 0,
  limit: number = 20,
): Promise<PaginatedWorkflowRunsV2> {
  return await clientFetchV2<PaginatedWorkflowRunsV2>('/runs', {
    params: {
      offset: String(offset),
      limit: String(limit),
    },
  })
}

/**
 * 获取运行实例总数
 */
export async function getRunCount(): Promise<number> {
  return (await getRunStats()).total
}

/**
 * 获取运行实例统计信息
 */
export async function getRunStats(): Promise<WorkflowRunStatisticsV2> {
  return await clientFetchV2<WorkflowRunStatisticsV2>('/runs/statistics')
}

/**
 * 获取单个运行实例详情
 */
export async function getRun(uid: string): Promise<WorkflowRunV2> {
  return await clientFetchV2<WorkflowRunV2>(`/runs/${uid}`)
}

/**
 * 获取运行实例输出文件树
 */
export async function getRunFiles(runUid: string): Promise<RunFileNode[]> {
  return await clientFetchV2<RunFileNode[]>(`/runs/${runUid}/files`)
}

/**
 * 获取运行实例输出文件内容（文本）
 * clientFetch 会将 application/json 响应自动解析为对象，因此统一序列化为字符串
 */
export async function getRunFileContent(
  runUid: string,
  path: string,
): Promise<string> {
  const result = await clientFetchV2<unknown>(`/runs/${runUid}/files/content`, {
    method: 'POST',
    body: JSON.stringify({ path }),
  })
  if (typeof result === 'string') return result
  return JSON.stringify(result, null, 2)
}

/**
 * 获取运行实例输出图片的 Blob Object URL
 * 调用方负责在不再使用时调用 URL.revokeObjectURL() 释放内存
 */
export async function getRunFileBlobUrl(
  runUid: string,
  path: string,
): Promise<string> {
  const res = await clientFetchV2(`/runs/${runUid}/files/content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
    raw: true,
  })
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

/** Fetch only metadata; native parsing is bounded and isolated on the server. */
export async function getRunFilePreviewMeta(
  runUid: string,
  generation: number,
  path: string,
  query: string,
  signal: AbortSignal,
): Promise<PreviewMeta> {
  return clientFetchV2<PreviewMeta>(`/runs/${runUid}/files/preview/meta`, {
    method: 'POST',
    body: JSON.stringify({ path, generation, query }),
    signal,
  })
}

/** Request at most 512 signal bins or 300 interval features. */
export async function getRunFilePreviewRegion(
  runUid: string,
  generation: number,
  path: string,
  region: { chrom: string; start: number; end: number },
  signal: AbortSignal,
): Promise<PreviewRegion> {
  return clientFetchV2<PreviewRegion>(`/runs/${runUid}/files/preview/region`, {
    method: 'POST',
    body: JSON.stringify({ path, generation, ...region, bins: 512 }),
    signal,
  })
}

/** Request at most a 64 × 64 Hi-C contact grid. */
export async function getRunContactPreviewRegion(
  runUid: string,
  generation: number,
  path: string,
  first: { chrom: string; start: number; end: number },
  second: { chrom: string; start: number; end: number },
  resolution: number | null,
  signal: AbortSignal,
): Promise<ContactRegion> {
  return clientFetchV2<ContactRegion>(`/runs/${runUid}/files/preview/region`, {
    method: 'POST',
    body: JSON.stringify({
      path,
      generation,
      ...first,
      chrom2: second.chrom,
      start2: second.start,
      end2: second.end,
      resolution,
    }),
    signal,
  })
}

/** Read only the inferred schema for a CSV or TSV file. */
export async function getRunTablePreviewMeta(
  runUid: string,
  generation: number,
  path: string,
  signal: AbortSignal,
): Promise<TablePreviewMeta> {
  return clientFetchV2<TablePreviewMeta>(
    `/runs/${runUid}/files/preview/table/meta`,
    {
      method: 'POST',
      body: JSON.stringify({ path, generation }),
      signal,
    },
  )
}

/** Read one projected table page after server-side sorting and filtering. */
export async function getRunTablePreviewPage(
  runUid: string,
  generation: number,
  path: string,
  query: {
    offset: number
    limit: number
    columns: string[]
    sort: TablePreviewSort | null
    filters: TablePreviewFilter[]
  },
  signal: AbortSignal,
): Promise<TablePreviewPage> {
  return clientFetchV2<TablePreviewPage>(
    `/runs/${runUid}/files/preview/table/query`,
    {
      method: 'POST',
      body: JSON.stringify({ path, generation, ...query }),
      signal,
    },
  )
}

/** Summarize one column on demand using the active filters. */
export async function getRunTablePreviewProfile(
  runUid: string,
  generation: number,
  path: string,
  column: string,
  filters: TablePreviewFilter[],
  signal: AbortSignal,
): Promise<TablePreviewProfile> {
  return clientFetchV2<TablePreviewProfile>(
    `/runs/${runUid}/files/preview/table/profile`,
    {
      method: 'POST',
      body: JSON.stringify({ path, generation, column, filters }),
      signal,
    },
  )
}
