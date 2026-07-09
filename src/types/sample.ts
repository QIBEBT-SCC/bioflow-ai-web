/**
 * 样本文件对象
 */
export interface SampleFile {
  uid: string
  sample_uid: string
  file_path: string
  file_format: string
  file_size: number
  md5_checksum: string
  tag: string
  uploaded_time: string
}

export interface Sample {
  uid: string
  owner_id: number
  project_id: string
  sample_name: string
  meta_data: Record<string, unknown>
  create_time: string
  files: SampleFile[]
}

/**
 * 样本列表项
 */
export interface SampleListItem {
  uid: string
  project_id: string
  sample_name: string
  meta_data: Record<string, unknown>
  create_time: string
  file_count: number
}

export interface PaginatedSamples {
  total: number
  offset: number
  limit: number
  has_more: boolean
  data: SampleListItem[]
}

/**
 * 创建样本请求
 */
export interface CreateSampleRequest {
  project_id: string
  sample_name: string
  meta_data?: Record<string, unknown>
}

/**
 * 更新样本请求
 */
export interface UpdateSampleRequest {
  sample_name?: string
  meta_data?: Record<string, unknown>
}

/**
 * 添加样本文件请求
 */
export interface AddSampleFileRequest {
  file_path: string
  tag: string
}

/**
 * 项目文件映射
 */
export interface ProjectFileMapping {
  id: number
  project_id: number
  keyword: string
  file_path: string
  description: string
  create_time: string
  update_time: string
}

/**
 * 创建项目文件映射请求
 */
export interface CreateProjectFileMappingRequest {
  keyword: string
  file_path: string
  description: string
}

/**
 * 更新项目文件映射请求
 */
export interface UpdateProjectFileMappingRequest {
  file_path?: string
  description?: string
}
