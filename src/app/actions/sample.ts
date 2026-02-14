'use server'

import { serverFetch } from '@/lib/api-server'
import type {
  AddSampleFileRequest,
  CreateSampleRequest,
  Sample,
  SampleFile,
  SampleListItem,
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
  return await serverFetch<SampleListItem[]>(
    `/projects/${projectId}/samples`,
    {
      params: {
        offset: String(offset),
        limit: String(limit),
      },
    },
  )
}

/**
 * 获取项目的样本数量
 */
export async function getSampleCount(projectId: string): Promise<number> {
  return await serverFetch<number>(`/projects/${projectId}/samples/count`)
}

/**
 * 获取样本详情
 */
export async function getSample(
  projectId: string,
  sampleUid: string,
): Promise<Sample> {
  return await serverFetch<Sample>(
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
  return await serverFetch<Sample>(`/projects/${projectId}/samples`, {
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
  return await serverFetch<Sample>(
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
  return await serverFetch<{ message: string }>(
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
  return await serverFetch<SampleFile[]>(
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
  return await serverFetch<SampleFile>(
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
  return await serverFetch<{ message: string }>(
    `/projects/${projectId}/samples/${sampleUid}/files/${fileUid}`,
    {
      method: 'DELETE',
    },
  )
}
