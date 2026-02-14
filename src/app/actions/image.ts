'use server'

import { revalidatePath } from 'next/cache'
import { serverFetch } from '@/lib/api-server'
import type { ToolImage, ToolImagePublic } from '@/types/tool'

/**
 * 获取镜像列表
 */
export async function getImageList(
  offset: number = 0,
  limit: number = 12,
): Promise<ToolImage[]> {
  return await serverFetch<ToolImage[]>('/images', {
    params: {
      offset: String(offset),
      limit: String(limit),
    },
  })
}

/**
 * 获取镜像总数
 */
export async function getImageCount(): Promise<number> {
  return await serverFetch<number>('/images/count')
}

export async function searchImages(name: string): Promise<ToolImage[]> {
  return await serverFetch<ToolImage[]>('/images/search', {
    params: { name },
  })
}

/**
 * 创建镜像
 */
export async function createImage(image: ToolImage): Promise<ToolImage> {
  const response = await serverFetch<ToolImage>('/images', {
    method: 'POST',
    body: JSON.stringify(image),
  })

  revalidatePath('/tool')
  revalidatePath('/tool/add')
  revalidatePath('/image')

  return response
}

/**
 * 更新镜像
 */
export async function updateImage(
  uid: string,
  image: Partial<ToolImage>,
): Promise<ToolImage> {
  const response = await serverFetch<ToolImage>(`/images/${uid}`, {
    method: 'PATCH',
    body: JSON.stringify(image),
  })

  revalidatePath('/tool')
  revalidatePath(`/tool/${uid}`)

  return response
}

/**
 * 获取镜像详情
 */
export async function getImage(uid: string): Promise<ToolImagePublic> {
  return await serverFetch<ToolImagePublic>(`/images/${uid}`)
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
