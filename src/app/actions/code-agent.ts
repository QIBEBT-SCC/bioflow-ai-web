import { clientFetch } from '@/lib/api-client'
import type { CodeNodeType } from '@/types/code'
import type {
  CodeAgentAvailability,
  CodeAgentBaseline,
  CodeAgentEvent,
  CodeAgentSession,
} from '@/types/code-agent'

const root = '/code-agent'
export const getCodingAvailability = () =>
  clientFetch<CodeAgentAvailability>(`${root}/availability`)
export const createCodingSession = (nodeType: CodeNodeType) =>
  clientFetch<CodeAgentSession>(`${root}/sessions`, {
    method: 'POST',
    body: JSON.stringify({ node_type: nodeType }),
  })
export const getCodingSession = (id: string) =>
  clientFetch<CodeAgentSession>(`${root}/sessions/${id}`)
export const closeCodingSession = (id: string) =>
  clientFetch(`${root}/sessions/${id}`, { method: 'DELETE', keepalive: true })
export const sendCodingTurn = (
  id: string,
  baseline: CodeAgentBaseline,
  prompt: string,
  language: 'zh' | 'en',
) =>
  clientFetch<CodeAgentSession>(`${root}/sessions/${id}/turns`, {
    method: 'POST',
    body: JSON.stringify({ ...baseline, prompt, language }),
  })
export const stopCodingTurn = (id: string) =>
  clientFetch<CodeAgentSession>(`${root}/sessions/${id}/stop`, {
    method: 'POST',
  })
export const decideCodingProposal = (
  id: string,
  proposalId: string,
  decision: 'accept' | 'reject',
  baseline: CodeAgentBaseline,
) =>
  clientFetch<CodeAgentSession>(
    `${root}/sessions/${id}/proposals/${proposalId}`,
    { method: 'POST', body: JSON.stringify({ ...baseline, decision }) },
  )

export async function streamCodingEvents(
  id: string,
  cursor: string,
  signal: AbortSignal,
  onEvent: (event: CodeAgentEvent) => void,
) {
  const response = await clientFetch(`${root}/sessions/${id}/events`, {
    raw: true,
    signal,
    params: { after: cursor },
  })
  if (!response.body) throw new Error('Empty event stream')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read()
      if (done) break
      buffer = (buffer + decoder.decode(value, { stream: true })).replace(
        /\r\n/g,
        '\n',
      )
      let boundary = buffer.indexOf('\n\n')
      while (boundary >= 0) {
        const frame = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        const data = frame
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n')
        if (data) onEvent(JSON.parse(data) as CodeAgentEvent)
        boundary = buffer.indexOf('\n\n')
      }
    }
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
