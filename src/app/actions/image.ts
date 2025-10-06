'use server'

import { serverFetch } from '@/lib/api-server'
import type { SimpleToolDoc, ToolImage } from '@/types/tool'
import { revalidatePath } from 'next/cache'

export async function searchImages(name: string): Promise<ToolImage[]> {
  return await serverFetch<ToolImage[]>(`/images?name=${encodeURIComponent(name)}`)
}

export async function createImage(image: ToolImage): Promise<ToolImage> {
  const response = await serverFetch<ToolImage>('/images', {
    method: 'POST',
    body: JSON.stringify(image)
  })
  
  revalidatePath('/tool')
  revalidatePath('/tool/add')
  
  return response
}

export async function getImageDocs(uid: string): Promise<SimpleToolDoc[]> {
  return await serverFetch<SimpleToolDoc[]>(`/images/${uid}/documents`)
}

export async function runInImage(uid: string, command: string): Promise<{ result: string }> {
  return await serverFetch<{ result: string }>(`/images/${uid}/run`, {
    method: 'POST',
    body: JSON.stringify({ command })
  })
}

