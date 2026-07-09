import {clientFetch} from '@/lib/api-client'
import type {
  BioDb,
  BioDbCreate,
  BioDbDownloadResponse,
  BioDbDownloadStatusResponse,
  PaginatedBioDbs,
  PaginatedBioDbSimple,
} from '@/types/resource'

/**
 * 获取数据库列表
 */
export async function getDBList(
  offset: number = 0,
  limit: number = 8,
): Promise<PaginatedBioDbSimple> {
  return await clientFetch<PaginatedBioDbSimple>('/bio_dbs', {
    params: {
      offset: String(offset),
      limit: String(limit),
    },
  })
}

/**
 * 获取数据库详情
 */
export async function getDB(id: number): Promise<BioDb> {
  return await clientFetch(`/bio_dbs/${id}`)
}

/**
 * 创建数据库
 */
export async function createDB(data: BioDbCreate): Promise<BioDb> {
  return await clientFetch<BioDb>('/bio_dbs', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 删除数据库
 */
export async function deleteDB(id: number): Promise<void> {
  await clientFetch(`/bio_dbs/${id}`, {
    method: 'DELETE',
  })
}

/**
 * 提交数据库下载任务
 */
export async function downloadDB(id: number): Promise<BioDbDownloadResponse> {
  return await clientFetch<BioDbDownloadResponse>(`/bio_dbs/${id}/download`, {
    method: 'POST',
  })
}

/**
 * 获取数据库下载状态
 */
export async function getDownloadStatus(
  id: number,
): Promise<BioDbDownloadStatusResponse> {
  return await clientFetch<BioDbDownloadStatusResponse>(
    `/bio_dbs/${id}/download/status`,
  )
}

/**
 * 搜索数据库
 */
export async function searchDB(
  name: string,
  offset: number = 0,
  limit: number = 10,
): Promise<PaginatedBioDbs> {
  return await clientFetch<PaginatedBioDbs>('/bio_dbs/search', {
    params: {
      name: name,
      offset: String(offset),
      limit: String(limit),
    },
  })
}
