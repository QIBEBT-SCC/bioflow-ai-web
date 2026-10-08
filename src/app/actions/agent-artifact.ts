import { clientFetch } from '@/lib/api-client'
import type { AgentArtifact } from '@/types/agent-artifact'

function artifactEndpoint(projectId: string | number, artifactId: string) {
  return `/projects/${projectId}/agent-files/${encodeURIComponent(artifactId)}`
}

export async function getProjectAgentArtifacts(projectId: string) {
  return await clientFetch<AgentArtifact[]>(
    `/projects/${projectId}/agent-files`,
  )
}

export async function getAgentRunArtifacts(runId: string) {
  return await clientFetch<AgentArtifact[]>(`/agent-runs/${runId}/artifacts`)
}

export async function getAgentArtifactContent(
  projectId: string | number,
  artifactId: string,
) {
  return await clientFetch<string>(artifactEndpoint(projectId, artifactId))
}

export async function getAgentArtifactDownload(
  projectId: string | number,
  artifactId: string,
) {
  const response = await clientFetch(artifactEndpoint(projectId, artifactId), {
    params: { download: 'true' },
    raw: true,
  })
  return await response.blob()
}

export async function updateAgentArtifact(
  projectId: string | number,
  artifactId: string,
  content: string,
  expectedRevision: string,
) {
  return await clientFetch<AgentArtifact>(
    artifactEndpoint(projectId, artifactId),
    {
      method: 'PATCH',
      body: JSON.stringify({
        content,
        expected_revision: expectedRevision,
      }),
    },
  )
}
