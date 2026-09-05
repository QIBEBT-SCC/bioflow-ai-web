import { clientFetch } from '@/lib/api-client'
import type {
  CodeAgentSession,
  CodeAgentSessionCreate,
  CodeAgentTurn,
  CodingAgentAvailability,
  CodingAgentLogin,
} from '@/types/code-agent'

export async function startCodingAgentLogin(): Promise<CodingAgentLogin> {
  return await clientFetch<CodingAgentLogin>(
    '/settings/coding-agent-account/login',
    { method: 'POST' },
  )
}

export async function cancelCodingAgentLogin(loginId: string): Promise<void> {
  await clientFetch(`/settings/coding-agent-account/login/${loginId}/cancel`, {
    method: 'POST',
  })
}

export async function getCodeAgentAvailability(): Promise<CodingAgentAvailability> {
  return await clientFetch<CodingAgentAvailability>('/code-agent/availability')
}

export async function createCodeAgentSession(
  data: CodeAgentSessionCreate,
): Promise<CodeAgentSession> {
  return await clientFetch<CodeAgentSession>('/code-agent/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function createCodeAgentTurn(
  sessionId: string,
  data: CodeAgentTurn,
): Promise<void> {
  await clientFetch(`/code-agent/sessions/${sessionId}/turns`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function cancelCodeAgentTurn(sessionId: string): Promise<void> {
  await clientFetch(`/code-agent/sessions/${sessionId}/cancel`, {
    method: 'POST',
  })
}

export async function decideCodeAgentProposal(
  sessionId: string,
  proposalId: string,
  decision: 'accept' | 'reject',
): Promise<void> {
  await clientFetch(
    `/code-agent/sessions/${sessionId}/proposals/${proposalId}/${decision}`,
    { method: 'POST' },
  )
}

export async function closeCodeAgentSession(
  sessionId: string,
  keepalive = false,
): Promise<void> {
  await clientFetch(`/code-agent/sessions/${sessionId}`, {
    method: 'DELETE',
    keepalive,
  })
}
