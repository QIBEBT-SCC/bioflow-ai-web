'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAgentArtifactContent,
  getAgentRunArtifacts,
  getProjectAgentArtifacts,
  updateAgentArtifact,
} from '@/app/actions/agent-artifact'
import type { AgentArtifact } from '@/types/agent-artifact'

export const agentArtifactQueryKeys = {
  project: (projectId: string) =>
    ['projects', projectId, 'agent-files'] as const,
  run: (runId: string) => ['agent-runs', runId, 'artifacts'] as const,
  content: (file: AgentArtifact) =>
    [
      'projects',
      String(file.project_id),
      'agent-files',
      file.id,
      file.revision,
    ] as const,
}

export function useProjectAgentArtifacts(projectId: string) {
  return useQuery({
    queryKey: agentArtifactQueryKeys.project(projectId),
    queryFn: () => getProjectAgentArtifacts(projectId),
    enabled: Boolean(projectId),
    staleTime: 10_000,
  })
}

export function useAgentRunArtifacts(runId: string, enabled = true) {
  return useQuery({
    queryKey: agentArtifactQueryKeys.run(runId),
    queryFn: () => getAgentRunArtifacts(runId),
    enabled: Boolean(runId) && enabled,
    staleTime: 10_000,
  })
}

export function useAgentArtifactContent(file: AgentArtifact, enabled = true) {
  return useQuery({
    queryKey: agentArtifactQueryKeys.content(file),
    queryFn: () => getAgentArtifactContent(file.project_id, file.id),
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export function useUpdateAgentArtifact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, content }: { file: AgentArtifact; content: string }) =>
      updateAgentArtifact(file.project_id, file.id, content, file.revision),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(
        agentArtifactQueryKeys.content(updated),
        variables.content,
      )
      queryClient.invalidateQueries({
        queryKey: agentArtifactQueryKeys.project(String(updated.project_id)),
      })
      queryClient.invalidateQueries({ queryKey: ['agent-runs'] })
    },
    onError: (_error, variables) => {
      queryClient.invalidateQueries({
        queryKey: agentArtifactQueryKeys.project(
          String(variables.file.project_id),
        ),
      })
      queryClient.invalidateQueries({ queryKey: ['agent-runs'] })
    },
  })
}
