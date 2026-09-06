import { clientFetch } from '@/lib/api-client'
import type {
  CodeAgentSession,
  CodeAgentSessionCreate,
  CodeAgentTurn,
  CodexAgentSettings,
  CodexLogin,
  CodingAgentAvailability,
  OpenCodeAgentSettings,
  OpenCodeCredentialsInput,
} from '@/types/code-agent'

export async function startCodexLogin(): Promise<CodexLogin> {
  return await clientFetch<CodexLogin>(
    '/settings/coding-agents/providers/codex/login',
    { method: 'POST' },
  )
}

export async function cancelCodexLogin(loginId: string): Promise<void> {
  await clientFetch(
    `/settings/coding-agents/providers/codex/login/${loginId}/cancel`,
    {
      method: 'POST',
    },
  )
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

export async function getCodexAgentSettings(): Promise<CodexAgentSettings> {
  return await clientFetch<CodexAgentSettings>(
    '/settings/coding-agents/providers/codex/settings',
  )
}

export async function saveCodexAgentSettings(
  data: CodexAgentSettings,
): Promise<CodexAgentSettings> {
  return await clientFetch<CodexAgentSettings>(
    '/settings/coding-agents/providers/codex/settings',
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

export async function getOpenCodeAgentSettings(): Promise<OpenCodeAgentSettings> {
  return await clientFetch<OpenCodeAgentSettings>(
    '/settings/coding-agents/providers/opencode/settings',
  )
}

export async function saveOpenCodeCredentials(
  data: OpenCodeCredentialsInput,
): Promise<OpenCodeAgentSettings> {
  return await clientFetch<OpenCodeAgentSettings>(
    '/settings/coding-agents/providers/opencode/credentials',
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
  )
}
