import { clientFetch } from '@/lib/api-client'
import type { AgentFile } from '@/types/agent-file'

function fileEndpoint(projectId: string | number, fileId: string) {
  return `/projects/${projectId}/agent-files/${encodeURIComponent(fileId)}`
}

export async function getProjectAgentFiles(projectId: string) {
  return await clientFetch<AgentFile[]>(`/projects/${projectId}/agent-files`)
}

export async function getAgentRunArtifacts(runId: string) {
  return await clientFetch<AgentFile[]>(`/agent-runs/${runId}/artifacts`)
}

export async function getAgentFileContent(
  projectId: string | number,
  fileId: string,
) {
  return await clientFetch<string>(fileEndpoint(projectId, fileId))
}

export async function getAgentFileDownload(
  projectId: string | number,
  fileId: string,
) {
  const response = await clientFetch(fileEndpoint(projectId, fileId), {
    params: { download: 'true' },
    raw: true,
  })
  return await response.blob()
}

export async function updateAgentFile(
  projectId: string | number,
  fileId: string,
  content: string,
  expectedRevision: string,
) {
  return await clientFetch<AgentFile>(fileEndpoint(projectId, fileId), {
    method: 'PATCH',
    body: JSON.stringify({
      content,
      expected_revision: expectedRevision,
    }),
  })
}
