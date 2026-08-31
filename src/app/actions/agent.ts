import type { Locale } from '@/i18n/config'
import { clientFetch } from '@/lib/api-client'
import type {
  AgentEvent,
  AgentMessage,
  AgentName,
  AgentRun,
  AgentSession,
  AgentSessionPage,
} from '@/types/agent'

export type AgentScope =
  | { scope: 'global'; projectId?: never }
  | { scope: 'project'; projectId: string }

export async function getAgentSessions(
  scope: AgentScope,
  cursor: string | null = null,
  limit: number = 8,
) {
  const params: Record<string, string> = {
    scope: scope.scope,
    limit: String(limit),
  }
  if (scope.projectId) params.project_id = scope.projectId
  if (cursor) params.cursor = cursor
  return await clientFetch<AgentSessionPage>('/agent-sessions', { params })
}

export async function createAgentSession(scope: AgentScope) {
  return await clientFetch<AgentSession>('/agent-sessions', {
    method: 'POST',
    body: JSON.stringify({
      project_id: scope.projectId ? Number(scope.projectId) : null,
    }),
  })
}

export async function getAgentSession(sessionId: string) {
  return await clientFetch<AgentSession>(`/agent-sessions/${sessionId}`)
}

export async function updateAgentSession(sessionId: string, title: string) {
  return await clientFetch<AgentSession>(`/agent-sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  })
}

export async function deleteAgentSession(sessionId: string) {
  await clientFetch(`/agent-sessions/${sessionId}`, { method: 'DELETE' })
}

export async function getAgentMessages(sessionId: string) {
  return await clientFetch<AgentMessage[]>(
    `/agent-sessions/${sessionId}/messages`,
  )
}

export async function getAgentSessionRuns(sessionId: string) {
  return await clientFetch<AgentRun[]>(`/agent-sessions/${sessionId}/runs`)
}

export async function createAgentRun(
  sessionId: string,
  agentName: AgentName,
  text: string,
  language?: Locale,
  sourceRunUid?: string,
) {
  return await clientFetch<AgentRun>(`/agent-sessions/${sessionId}/runs`, {
    method: 'POST',
    body: JSON.stringify({
      agent_name: agentName,
      text,
      language: language ?? null,
      source_run_uid: sourceRunUid ?? null,
    }),
  })
}

export async function getAgentRun(runId: string) {
  return await clientFetch<AgentRun>(`/agent-runs/${runId}`)
}

export async function getAgentEvents(runId: string, afterId: number = 0) {
  return await clientFetch<AgentEvent[]>(`/agent-runs/${runId}/events`, {
    params: { after_id: String(afterId) },
  })
}

export async function streamAgentEvents(
  runId: string,
  afterId: number = 0,
  signal?: AbortSignal,
) {
  return await clientFetch(`/agent-runs/${runId}/stream`, {
    params: { after_id: String(afterId) },
    headers: { Accept: 'text/event-stream' },
    signal,
    raw: true,
  })
}

export async function resumeAgentRun(
  runId: string,
  approved: boolean,
  language?: Locale,
  feedback?: string,
) {
  return await clientFetch<AgentRun>(`/agent-runs/${runId}/resume`, {
    method: 'POST',
    body: JSON.stringify({
      approved,
      language: language ?? null,
      feedback: feedback || null,
    }),
  })
}

export async function cancelAgentRun(runId: string) {
  return await clientFetch<AgentRun>(`/agent-runs/${runId}/cancel`, {
    method: 'POST',
  })
}

export async function retryAgentRun(runId: string, language?: Locale) {
  return await clientFetch<AgentRun>(`/agent-runs/${runId}/retry`, {
    method: 'POST',
    body: JSON.stringify({ language: language ?? null }),
  })
}
