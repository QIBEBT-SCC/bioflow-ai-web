import type { User } from '@/types/auth'

export type ProjectSort = 'recent' | 'nameAsc' | 'nameDesc'

export interface ProjectTagProp {
  name: string
  color: string
}

export interface ProjectTag extends ProjectTagProp {
  id: number
}

export interface TagWithCount extends ProjectTag {
  project_count: number
}

export interface ProjectCreateProp {
  name: string
  description: string
  public: boolean
  tag_ids: number[]
}

export interface ProjectUpdateProp {
  name?: string
  description?: string
  tags?: ProjectTag[]
}

export interface ProjectPublic {
  id: number
  name: string
  description: string
  starred: boolean
  public: boolean
  create_time: string
  update_time: string
  owner: User
  tags: ProjectTag[]
}

export interface PaginatedProjects {
  total: number
  offset: number
  limit: number
  has_more: boolean
  data: ProjectPublic[]
}
