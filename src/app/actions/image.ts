import { clientFetch } from '@/lib/api-client'
import type {
  PaginatedToolImages,
  ToolImage,
  ToolImagePublic,
} from '@/types/tool'

/**
 * 获取镜像列表
 */
export async function getImageList(
  offset: number = 0,
  limit: number = 12,
): Promise<PaginatedToolImages> {
  return await clientFetch<PaginatedToolImages>('/images', {
    params: {
      offset: String(offset),
      limit: String(limit),
    },
  })
}

export async function searchImages(
  name: string,
  offset: number = 0,
  limit: number = 12,
): Promise<PaginatedToolImages> {
  return await clientFetch<PaginatedToolImages>('/images/search', {
    params: {
      name,
      offset: String(offset),
      limit: String(limit),
    },
  })
}

/**
 * 创建镜像
 */
export async function createImage(image: ToolImage): Promise<ToolImage> {
  return await clientFetch<ToolImage>('/images', {
    method: 'POST',
    body: JSON.stringify(image),
  })
}

/**
 * 更新镜像
 */
export async function updateImage(
  uid: string,
  image: Partial<ToolImage>,
): Promise<ToolImage> {
  return await clientFetch<ToolImage>(`/images/${uid}`, {
    method: 'PATCH',
    body: JSON.stringify(image),
  })
}

/**
 * 获取镜像详情
 */
export async function getImage(uid: string): Promise<ToolImagePublic> {
  return await clientFetch<ToolImagePublic>(`/images/${uid}`)
}

export async function runInImage(
  uid: string,
  command: string,
): Promise<{ result: string }> {
  return await clientFetch<{ result: string }>(`/images/${uid}/run`, {
    method: 'POST',
    body: JSON.stringify({ command }),
  })
}
