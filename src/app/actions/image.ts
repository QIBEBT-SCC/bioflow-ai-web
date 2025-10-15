'use server'

import { revalidatePath } from 'next/cache'
import { serverFetch } from '@/lib/api-server'
import type { SimpleToolDoc, ToolImage } from '@/types/tool'

/**
 * 获取镜像列表
 */
export async function getImageList(
  offset: number = 0,
  limit: number = 12,
): Promise<ToolImage[]> {
  return await serverFetch<ToolImage[]>('/images', {
    params: { offset, limit },
  })
}

/**
 * 获取镜像总数
 */
export async function getImageCount(): Promise<number> {
  return await serverFetch<number>('/images/count')
}

export async function searchImages(name: string): Promise<ToolImage[]> {
  return await serverFetch<ToolImage[]>(
    `/images/search?name=${encodeURIComponent(name)}`,
  )
}

export async function createImage(image: ToolImage): Promise<ToolImage> {
  const response = await serverFetch<ToolImage>('/images', {
    method: 'POST',
    body: JSON.stringify(image),
  })

  revalidatePath('/tool')
  revalidatePath('/tool/add')

  return response
}

export async function getImageDocs(uid: string): Promise<SimpleToolDoc[]> {
  return await serverFetch<SimpleToolDoc[]>(`/images/${uid}/documents`)
}

export async function runInImage(
  uid: string,
  command: string,
): Promise<{ result: string }> {
  return await serverFetch<{ result: string }>(`/images/${uid}/run`, {
    method: 'POST',
    body: JSON.stringify({ command }),
  })
}
