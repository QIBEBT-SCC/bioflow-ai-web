export interface SkillSummary {
  name: string
  description: string
  resource_count: number
}

export interface AgentSkills {
  agent_name: string
  skills: SkillSummary[]
}

export interface SkillCatalog {
  agents: AgentSkills[]
}

export interface SkillDetail {
  agent_name: string
  name: string
  description: string
  content: string
  resources: string[]
}

export interface SkillCreate {
  name: string
  content: string
}

export interface SkillUpdate {
  content: string
}

export interface SkillResource {
  path: string
  content: string
}

export interface SkillResourceUpdate {
  content: string
}
