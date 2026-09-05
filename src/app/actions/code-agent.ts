import { clientFetch } from '@/lib/api-client'
import type {
  CodeAgentSession,
  CodeAgentSessionCreate,
  CodeAgentTurn,
  CodingAgentAvailability,
  CodingAgentLogin,
  CodingAgentSettings,
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

export async function getCodingAgentSettings(): Promise<CodingAgentSettings> {
  return await clientFetch<CodingAgentSettings>(
    '/settings/coding-agent-account/settings',
  )
}

export async function saveCodingAgentSettings(
  data: CodingAgentSettings,
): Promise<CodingAgentSettings> {
  return await clientFetch<CodingAgentSettings>(
    '/settings/coding-agent-account/settings',
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
  )
}

export async function setCodeAgentConfig(
  sessionId: string,
  configId: string,
  value: string,
): Promise<void> {
  await clientFetch(`/code-agent/sessions/${sessionId}/config`, {
    method: 'PUT',
    body: JSON.stringify({ config_id: configId, value }),
  })
}
