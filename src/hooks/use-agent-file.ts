'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAgentFileContent,
  getAgentRunArtifacts,
  getProjectAgentFiles,
  updateAgentFile,
} from '@/app/actions/agent-file'
import type { AgentFile } from '@/types/agent-file'

export const agentFileQueryKeys = {
  project: (projectId: string) =>
    ['projects', projectId, 'agent-files'] as const,
  run: (runId: string) => ['agent-runs', runId, 'artifacts'] as const,
  content: (file: AgentFile) =>
    [
      'projects',
      String(file.project_id),
      'agent-files',
      file.id,
      file.revision,
    ] as const,
}

export function useProjectAgentFiles(projectId: string) {
  return useQuery({
    queryKey: agentFileQueryKeys.project(projectId),
    queryFn: () => getProjectAgentFiles(projectId),
    enabled: Boolean(projectId),
    staleTime: 10_000,
  })
}

export function useAgentRunArtifacts(runId: string, enabled = true) {
  return useQuery({
    queryKey: agentFileQueryKeys.run(runId),
    queryFn: () => getAgentRunArtifacts(runId),
    enabled: Boolean(runId) && enabled,
    staleTime: 10_000,
  })
}

export function useAgentFileContent(file: AgentFile, enabled = true) {
  return useQuery({
    queryKey: agentFileQueryKeys.content(file),
    queryFn: () => getAgentFileContent(file.project_id, file.id),
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export function useUpdateAgentFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, content }: { file: AgentFile; content: string }) =>
      updateAgentFile(file.project_id, file.id, content, file.revision),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(
        agentFileQueryKeys.content(updated),
        variables.content,
      )
      queryClient.invalidateQueries({
        queryKey: agentFileQueryKeys.project(String(updated.project_id)),
      })
      queryClient.invalidateQueries({ queryKey: ['agent-runs'] })
    },
    onError: (_error, variables) => {
      queryClient.invalidateQueries({
        queryKey: agentFileQueryKeys.project(String(variables.file.project_id)),
      })
      queryClient.invalidateQueries({ queryKey: ['agent-runs'] })
    },
  })
}
