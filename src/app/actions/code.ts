import { clientFetch } from '@/lib/api-client'
import type {
  CodeCreate,
  CodeInfo,
  CodeMetadata,
  CodeMetadataRequest,
  CodeNodeType,
  CodeUpdate,
  PaginatedCodes,
} from '@/types/code'

export async function getCodeList({
  query = '',
  nodeType,
  offset = 0,
  limit = 20,
}: {
  query?: string
  nodeType?: CodeNodeType
  offset?: number
  limit?: number
}): Promise<PaginatedCodes> {
  const params: Record<string, string> = {
    offset: String(offset),
    limit: String(limit),
  }
  if (query.trim()) {
    params.query = query.trim()
  }
  if (nodeType) {
    params.node_type = nodeType
  }
  return await clientFetch<PaginatedCodes>('/codes', { params })
}

export async function getCode(uid: string): Promise<CodeInfo> {
  return await clientFetch<CodeInfo>(`/codes/${uid}`)
}

export async function createCode(code: CodeCreate): Promise<CodeInfo> {
  return await clientFetch<CodeInfo>('/codes', {
    method: 'POST',
    body: JSON.stringify(code),
  })
}

export async function generateCodeMetadata(
  request: CodeMetadataRequest,
): Promise<CodeMetadata> {
  return await clientFetch<CodeMetadata>('/codes/generate-metadata', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function updateCode(
  uid: string,
  code: CodeUpdate,
): Promise<CodeInfo> {
  return await clientFetch<CodeInfo>(`/codes/${uid}`, {
    method: 'PATCH',
    body: JSON.stringify(code),
  })
}

export async function deleteCode(uid: string): Promise<void> {
  await clientFetch(`/codes/${uid}`, {
    method: 'DELETE',
  })
}
