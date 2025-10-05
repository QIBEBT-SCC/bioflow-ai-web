'use server'

import { revalidatePath } from 'next/cache'
import { serverFetch } from '@/lib/api-server'
import type { BioDb, BioDbCreate, BioDbSimple } from '@/types/resource'

/**
 * 获取数据库列表
 */
export async function getDBList(
  offset: number = 0,
  limit: number = 8,
): Promise<BioDbSimple[]> {
  return await serverFetch('/bio_dbs', {
    params: { offset, limit },
  })
}

/**
 * 获取数据库总数
 */
export async function getDBCount(): Promise<number> {
  return await serverFetch('/bio_dbs/count')
}

/**
 * 获取数据库详情
 */
export async function getDB(id: number): Promise<BioDb> {
  return await serverFetch(`/bio_dbs/${id}`)
}

/**
 * 创建数据库
 */
export async function createDB(data: BioDbCreate): Promise<BioDb> {
  const result = await serverFetch<BioDb>('/bio_dbs', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  revalidatePath('/resource')
  return result
}

/**
 * 删除数据库
 */
export async function deleteDB(id: number): Promise<void> {
  await serverFetch(`/bio_dbs/${id}`, {
    method: 'DELETE',
  })
  revalidatePath('/resource')
}

/**
 * 搜索数据库
 */
export async function searchDB(
  name: string,
  offset: number = 0,
  limit: number = 10,
): Promise<BioDb[]> {
  return await serverFetch('/bio_dbs/search', {
    params: { name, offset, limit },
  })
}
