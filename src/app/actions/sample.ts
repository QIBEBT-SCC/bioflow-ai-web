import { clientFetch } from '@/lib/api-client'
import type {
  AddSampleFileRequest,
  CreateProjectFileMappingRequest,
  CreateSampleRequest,
  ProjectFileMapping,
  Sample,
  SampleFile,
  SampleListItem,
  UpdateProjectFileMappingRequest,
  UpdateSampleRequest,
} from '@/types/sample'

/**
 * 获取项目的样本列表
 */
export async function getSamples(
  projectId: string,
  offset: number = 0,
  limit: number = 20,
): Promise<SampleListItem[]> {
  return await clientFetch<SampleListItem[]>(`/projects/${projectId}/samples`, {
    params: {
      offset: String(offset),
      limit: String(limit),
    },
  })
}

/**
 * 获取项目的样本数量
 */
export async function getSampleCount(projectId: string): Promise<number> {
  return await clientFetch<number>(`/projects/${projectId}/samples/count`)
}

/**
 * 获取样本详情
 */
export async function getSample(
  projectId: string,
  sampleUid: string,
): Promise<Sample> {
  return await clientFetch<Sample>(
    `/projects/${projectId}/samples/${sampleUid}`,
  )
}

/**
 * 创建样本
 */
export async function createSample(
  projectId: string,
  data: CreateSampleRequest,
): Promise<Sample> {
  return await clientFetch<Sample>(`/projects/${projectId}/samples`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 更新样本
 */
export async function updateSample(
  projectId: string,
  sampleUid: string,
  data: UpdateSampleRequest,
): Promise<Sample> {
  return await clientFetch<Sample>(
    `/projects/${projectId}/samples/${sampleUid}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
  )
}

/**
 * 删除样本
 */
export async function deleteSample(
  projectId: string,
  sampleUid: string,
): Promise<{ message: string }> {
  return await clientFetch<{ message: string }>(
    `/projects/${projectId}/samples/${sampleUid}`,
    {
      method: 'DELETE',
    },
  )
}

/**
 * 获取样本的文件列表
 */
export async function getSampleFiles(
  projectId: string,
  sampleUid: string,
): Promise<SampleFile[]> {
  return await clientFetch<SampleFile[]>(
    `/projects/${projectId}/samples/${sampleUid}/files`,
  )
}

/**
 * 为样本添加文件
 */
export async function addSampleFile(
  projectId: string,
  sampleUid: string,
  data: AddSampleFileRequest,
): Promise<SampleFile> {
  return await clientFetch<SampleFile>(
    `/projects/${projectId}/samples/${sampleUid}/files`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  )
}

/**
 * 删除样本文件
 */
export async function deleteSampleFile(
  projectId: string,
  sampleUid: string,
  fileUid: string,
): Promise<{ message: string }> {
  return await clientFetch<{ message: string }>(
    `/projects/${projectId}/samples/${sampleUid}/files/${fileUid}`,
    {
      method: 'DELETE',
    },
  )
}

/**
 * 获取项目的文件映射列表
 */
export async function getProjectFileMappings(
  projectId: string,
): Promise<ProjectFileMapping[]> {
  return await clientFetch<ProjectFileMapping[]>(
    `/projects/${projectId}/file-mappings`,
  )
}

/**
 * 获取特定的文件映射
 */
export async function getProjectFileMapping(
  projectId: string,
  keyword: string,
): Promise<ProjectFileMapping> {
  return await clientFetch<ProjectFileMapping>(
    `/projects/${projectId}/file-mappings/${keyword}`,
  )
}

/**
 * 创建项目文件映射
 */
export async function createProjectFileMapping(
  projectId: string,
  data: CreateProjectFileMappingRequest,
): Promise<ProjectFileMapping> {
  return await clientFetch<ProjectFileMapping>(
    `/projects/${projectId}/file-mappings`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  )
}

/**
 * 更新项目文件映射
 */
export async function updateProjectFileMapping(
  projectId: string,
  mappingId: number,
  data: UpdateProjectFileMappingRequest,
): Promise<ProjectFileMapping> {
  return await clientFetch<ProjectFileMapping>(
    `/projects/${projectId}/file-mappings/${mappingId}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
  )
}

/**
 * 删除项目文件映射
 */
export async function deleteProjectFileMapping(
  projectId: string,
  mappingId: number,
): Promise<{ message: string }> {
  return await clientFetch<{ message: string }>(
    `/projects/${projectId}/file-mappings/${mappingId}`,
    {
      method: 'DELETE',
    },
  )
}
