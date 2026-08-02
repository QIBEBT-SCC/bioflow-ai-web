import { clientFetch } from '@/lib/api-client'
import type {
  SkillCatalog,
  SkillCreate,
  SkillDetail,
  SkillResource,
  SkillResourceUpdate,
  SkillUpdate,
} from '@/types/skill'

function encodePath(value: string) {
  return value
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

export async function getSkillCatalog(): Promise<SkillCatalog> {
  return await clientFetch<SkillCatalog>('/skills')
}

export async function getSkill(
  agentName: string,
  skillName: string,
): Promise<SkillDetail> {
  return await clientFetch<SkillDetail>(
    `/skills/${encodeURIComponent(agentName)}/${encodeURIComponent(skillName)}`,
  )
}

export async function createSkill(
  agentName: string,
  data: SkillCreate,
): Promise<SkillDetail> {
  return await clientFetch<SkillDetail>(
    `/skills/${encodeURIComponent(agentName)}`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  )
}

export async function updateSkill(
  agentName: string,
  skillName: string,
  data: SkillUpdate,
): Promise<SkillDetail> {
  return await clientFetch<SkillDetail>(
    `/skills/${encodeURIComponent(agentName)}/${encodeURIComponent(skillName)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  )
}

export async function getSkillResource(
  agentName: string,
  skillName: string,
  resourcePath: string,
): Promise<SkillResource> {
  return await clientFetch<SkillResource>(
    `/skills/${encodeURIComponent(agentName)}/${encodeURIComponent(skillName)}/resources/${encodePath(resourcePath)}`,
  )
}

export async function updateSkillResource(
  agentName: string,
  skillName: string,
  resourcePath: string,
  data: SkillResourceUpdate,
): Promise<SkillResource> {
  return await clientFetch<SkillResource>(
    `/skills/${encodeURIComponent(agentName)}/${encodeURIComponent(skillName)}/resources/${encodePath(resourcePath)}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
  )
}
