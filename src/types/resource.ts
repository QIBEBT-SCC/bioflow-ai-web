export interface BioDbCreate {
  name: string
  description?: string
  path?: string
  last_update?: string
  download_command?: string
  download_image?: string
}

export interface BioDbSimple {
  id: number
  name: string
  path?: string | null
  size?: string | null
}

export interface BioDb {
  id: number
  name: string
  description?: string
  path?: string | null
  size?: string | null
  last_update?: string | null
  download_command?: string | null
  download_image?: string | null
}

export type BioDbDownloadStatus = 'not_downloaded' | 'downloading' | 'ready'

export interface BioDbDownloadStatusResponse {
  status: BioDbDownloadStatus
  message?: string | null
}

export interface BioDbDownloadResponse {
  task_id: string
  message: string
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
