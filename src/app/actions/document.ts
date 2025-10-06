'use server'

import { serverFetch } from '@/lib/api-server'
import type { ToolHelpDoc } from '@/types/tool'

export async function getDocument(uid: string): Promise<ToolHelpDoc> {
  return await serverFetch<ToolHelpDoc>(`/documents/${uid}`)
}

export async function createDocument(document: Omit<ToolHelpDoc, 'uid'>): Promise<ToolHelpDoc> {
  return await serverFetch<ToolHelpDoc>('/documents', {
    method: 'POST',
    body: JSON.stringify(document)
  })
}

