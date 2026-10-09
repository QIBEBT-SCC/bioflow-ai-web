import { clientFetch } from '@/lib/api-client'
import type { AgentImagePart, AgentPDFPart } from '@/types/agent'

export function getChatAttachmentPreviewUrl(url: string) {
  if (url.startsWith('data:')) return url
  return `${process.env.NEXT_PUBLIC_API_URL ?? '/api/v1'}${url}`
}

export async function prepareAgentImage(file: File, signal?: AbortSignal) {
  const body = new FormData()
  body.append('file', file)
  return clientFetch<AgentImagePart>('/agent-sessions/images/prepare', {
    method: 'POST',
    body,
    signal,
  })
}

export async function uploadAgentPDF(file: File, signal?: AbortSignal) {
  const body = new FormData()
  body.append('file', file)
  return clientFetch<AgentPDFPart>('/agent-sessions/pdfs', {
    method: 'POST',
    body,
    signal,
  })
}
