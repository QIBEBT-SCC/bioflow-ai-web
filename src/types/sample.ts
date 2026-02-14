/**
 * 样本文件类型枚举
 */
export enum SampleFileType {
  SEQUENCING_R1 = 0,
  SEQUENCING_R2 = 1,
  SEQUENCING = 2,
  SPECTRUM = 3,
  IMAGE = 4,
}

/**
 * 样本文件对象
 */
export interface SampleFile {
  uid: string
  sample_uid: string
  data_type: SampleFileType
  file_path: string
  file_format: string
  file_size: number
  md5_checksum: string
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

/**
 * 创建样本请求
 */
export interface CreateSampleRequest {
  project_id: string
  sample_name: string
  meta_data?: Record<string, unknown>
  files?: Array<{
    data_type: SampleFileType
    file_path: string
    file_format: string
    file_size: number
    md5_checksum: string
  }>
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
  data_type: SampleFileType
  file_path: string
}
