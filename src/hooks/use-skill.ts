'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSkill,
  getSkill,
  getSkillCatalog,
  getSkillResource,
  updateSkill,
  updateSkillResource,
} from '@/app/actions/skill'
import type {
  SkillCreate,
  SkillResourceUpdate,
  SkillUpdate,
} from '@/types/skill'

export function useSkillCatalog() {
  return useQuery({
    queryKey: ['skill-catalog'],
    queryFn: getSkillCatalog,
  })
}

export function useSkill(agentName: string, skillName: string) {
  return useQuery({
    queryKey: ['skill', agentName, skillName],
    queryFn: () => getSkill(agentName, skillName),
    enabled: Boolean(agentName && skillName),
  })
}

export function useSkillResource(
  agentName: string,
  skillName: string,
  resourcePath: string,
) {
  return useQuery({
    queryKey: ['skill-resource', agentName, skillName, resourcePath],
    queryFn: () => getSkillResource(agentName, skillName, resourcePath),
    enabled: Boolean(agentName && skillName && resourcePath),
  })
}

export function useCreateSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      agentName,
      data,
    }: {
      agentName: string
      data: SkillCreate
    }) => createSkill(agentName, data),
    onSuccess: (skill) => {
      queryClient.setQueryData(['skill', skill.agent_name, skill.name], skill)
      queryClient.invalidateQueries({ queryKey: ['skill-catalog'] })
    },
  })
}

export function useUpdateSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      agentName,
      skillName,
      data,
    }: {
      agentName: string
      skillName: string
      data: SkillUpdate
    }) => updateSkill(agentName, skillName, data),
    onSuccess: (skill) => {
      queryClient.setQueryData(['skill', skill.agent_name, skill.name], skill)
      queryClient.invalidateQueries({ queryKey: ['skill-catalog'] })
    },
  })
}

export function useUpdateSkillResource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      agentName,
      skillName,
      resourcePath,
      data,
    }: {
      agentName: string
      skillName: string
      resourcePath: string
      data: SkillResourceUpdate
    }) => updateSkillResource(agentName, skillName, resourcePath, data),
    onSuccess: (resource, variables) => {
      queryClient.setQueryData(
        [
          'skill-resource',
          variables.agentName,
          variables.skillName,
          variables.resourcePath,
        ],
        resource,
      )
      queryClient.invalidateQueries({
        queryKey: ['skill', variables.agentName, variables.skillName],
      })
      queryClient.invalidateQueries({ queryKey: ['skill-catalog'] })
    },
  })
}
