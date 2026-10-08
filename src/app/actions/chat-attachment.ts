import { clientFetch } from '@/lib/api-client'
import type { AgentImagePart } from '@/types/agent'

export async function prepareAgentImage(file: File, signal?: AbortSignal) {
  const body = new FormData()
  body.append('file', file)
  return clientFetch<AgentImagePart>('/agent-sessions/images/prepare', {
    method: 'POST',
    body,
    signal,
  })
}
