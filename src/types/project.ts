import type { User } from '@/types/auth'

export interface ProjectTag {
  id?: number
  name: string
  color: string
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
