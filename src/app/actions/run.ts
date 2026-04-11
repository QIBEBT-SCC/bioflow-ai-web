import { clearToken, clientFetch, getToken } from '@/lib/api-client'
import type { RunFileNode, RunPublic, Statistics } from '@/types/run'
import type { WorkflowDefinition } from '@/types/workflow'

/**
 * 创建新的运行实例
 */
export async function newRunInstance(
  workflow: WorkflowDefinition,
  template_name?: string,
): Promise<string> {
  const endpoint = template_name
    ? `/workflows/run?template_name=${encodeURIComponent(template_name)}`
    : '/workflows/run'

  return await clientFetch<string>(endpoint, {
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
): Promise<RunPublic[]> {
  return await clientFetch<RunPublic[]>('/runs', {
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
  return await clientFetch<number>('/runs/count')
}

/**
 * 获取运行实例统计信息
 */
export async function getRunStats(): Promise<Statistics> {
  return await clientFetch<Statistics>('/runs/statistics')
}

/**
 * 获取单个运行实例详情
 */
export async function getRun(uid: string): Promise<RunPublic> {
  return await clientFetch<RunPublic>(`/runs/${uid}`)
}

/**
 * 获取运行实例输出文件树
 */
export async function getRunFiles(runUid: string): Promise<RunFileNode[]> {
  return await clientFetch<RunFileNode[]>(`/runs/${runUid}/files`)
}

/**
 * 获取运行实例输出文件内容（文本）
 * clientFetch 会将 application/json 响应自动解析为对象，因此统一序列化为字符串
 */
export async function getRunFileContent(
  runUid: string,
  path: string,
): Promise<string> {
  const result = await clientFetch<unknown>(`/runs/${runUid}/files/content`, {
    method: 'POST',
    body: JSON.stringify({ path }),
  })
  if (typeof result === 'string') return result
  return JSON.stringify(result, null, 2)
}

/**
 * 获取运行实例输出文件的 Blob Object URL（用于图片、PDF 等二进制文件）
 * 调用方负责在不再使用时调用 URL.revokeObjectURL() 释放内存
 */
export async function getRunFileBlobUrl(
  runUid: string,
  path: string,
): Promise<string> {
  const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1'
  const token = getToken()
  const res = await fetch(`${FASTAPI_URL}/runs/${runUid}/files/content`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ path }),
  })
  if (res.status === 401) {
    clearToken()
    throw new Error('Unauthorized')
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
