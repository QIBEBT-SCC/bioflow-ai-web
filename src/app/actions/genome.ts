import { clientFetch } from '@/lib/api-client'
import type {
  CeleryTaskResponse,
  GenomeDownloadResponse,
  ReferenceGenomeBuildIndexRequest,
  ReferenceGenomeDownloadRequest,
  ReferenceGenomeListItem,
  ReferenceGenomePublic,
} from '@/types/genome'

const BASE = '/references'

/**
 * 获取参考基因组列表（分页）
 */
export async function getGenomeList(
  offset: number = 0,
  limit: number = 10,
): Promise<ReferenceGenomeListItem[]> {
  return await clientFetch<ReferenceGenomeListItem[]>(BASE, {
    params: { offset: String(offset), limit: String(limit) },
  })
}

/**
 * 获取参考基因组总数
 */
export async function getGenomeCount(): Promise<number> {
  return await clientFetch<number>(`${BASE}/count`)
}

/**
 * 模糊搜索本地已有的参考基因组
 */
export async function searchGenome(
  q: string,
): Promise<ReferenceGenomeListItem[]> {
  return await clientFetch<ReferenceGenomeListItem[]>(`${BASE}/search`, {
    params: { q },
  })
}

/**
 * 获取参考基因组详情
 */
export async function getGenome(id: number): Promise<ReferenceGenomePublic> {
  return await clientFetch<ReferenceGenomePublic>(`${BASE}/${id}`)
}

/**
 * 删除参考基因组（仅管理员）
 */
export async function deleteGenome(id: number): Promise<{ message: string }> {
  return await clientFetch<{ message: string }>(`${BASE}/${id}`, {
    method: 'DELETE',
  })
}

/**
 * 触发后台下载参考基因组（含可选索引构建）
 */
export async function downloadGenome(
  data: ReferenceGenomeDownloadRequest,
): Promise<GenomeDownloadResponse> {
  return await clientFetch<GenomeDownloadResponse>(`${BASE}/download`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 为已有基因组触发索引构建
 */
export async function buildGenomeIndex(
  id: number,
  data: ReferenceGenomeBuildIndexRequest,
): Promise<CeleryTaskResponse> {
  return await clientFetch<CeleryTaskResponse>(`${BASE}/${id}/build-index`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
