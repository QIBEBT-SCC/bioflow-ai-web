export interface BioDbCreate {
  name: string
  description?: string
  path: string
  last_update: string
}

export interface BioDbSimple {
  id: number
  name: string
}

export interface BioDb {
  id: number
  name: string
  description?: string
  path: string
  size: string
  last_update: string
}

export interface PaginatedBioDbs {
  total: number
  offset: number
  limit: number
  has_more: boolean
  data: BioDb[]
}

export interface PaginatedBioDbSimple {
  total: number
  offset: number
  limit: number
  has_more: boolean
  data: BioDbSimple[]
}
