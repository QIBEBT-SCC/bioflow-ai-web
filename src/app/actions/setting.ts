import { clientFetch } from '@/lib/api-client'
import type {
  LLMModelCreate,
  LLMModelPublic,
  LLMModelUpdate,
  LLMProviderCreate,
  LLMProviderPublic,
  LLMProviderUpdate,
  LLMSettingPublic,
  LLMSettingUpdate,
  LLMStatisticDetailsResponse,
  LLMStatisticOverview,
} from '@/types/setting'

// ============================================
// Providers
// ============================================

export async function getLLMProviders(): Promise<LLMProviderPublic[]> {
  return await clientFetch<LLMProviderPublic[]>('/settings/providers')
}

export async function getLLMProvider(id: number): Promise<LLMProviderPublic> {
  return await clientFetch<LLMProviderPublic>(`/settings/providers/${id}`)
}

export async function createLLMProvider(
  data: LLMProviderCreate,
): Promise<LLMProviderPublic> {
  return await clientFetch<LLMProviderPublic>('/settings/providers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateLLMProvider(
  id: number,
  data: LLMProviderUpdate,
): Promise<LLMProviderPublic> {
  return await clientFetch<LLMProviderPublic>(`/settings/providers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteLLMProvider(id: number): Promise<void> {
  return await clientFetch<void>(`/settings/providers/${id}`, {
    method: 'DELETE',
  })
}

// ============================================
// Models
// ============================================

export async function getLLMModels(): Promise<LLMModelPublic[]> {
  return await clientFetch<LLMModelPublic[]>('/settings/models')
}

export async function getLLMModel(id: number): Promise<LLMModelPublic> {
  return await clientFetch<LLMModelPublic>(`/settings/models/${id}`)
}

export async function getProviderModels(
  providerId: number,
): Promise<LLMModelPublic[]> {
  return await clientFetch<LLMModelPublic[]>(
    `/settings/providers/${providerId}/models`,
  )
}

export async function createLLMModel(
  data: LLMModelCreate,
): Promise<LLMModelPublic> {
  return await clientFetch<LLMModelPublic>('/settings/models', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateLLMModel(
  id: number,
  data: LLMModelUpdate,
): Promise<LLMModelPublic> {
  return await clientFetch<LLMModelPublic>(`/settings/models/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteLLMModel(id: number): Promise<void> {
  return await clientFetch<void>(`/settings/models/${id}`, {
    method: 'DELETE',
  })
}

// ============================================
// Global Settings
// ============================================

export async function getLLMSettings(): Promise<LLMSettingPublic> {
  return await clientFetch<LLMSettingPublic>('/settings/settings')
}

export async function updateLLMSetting(data: LLMSettingUpdate): Promise<void> {
  return await clientFetch<void>('/settings/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// ============================================
// Statistics
// ============================================

export async function getLLMStatisticsOverview(params?: {
  start_date?: string
  end_date?: string
}): Promise<LLMStatisticOverview> {
  const searchParams = new URLSearchParams()
  if (params?.start_date) searchParams.set('start_date', params.start_date)
  if (params?.end_date) searchParams.set('end_date', params.end_date)

  const queryString = searchParams.toString()
  const url = `/settings/statistics/overview${queryString ? `?${queryString}` : ''}`

  return await clientFetch<LLMStatisticOverview>(url)
}

export async function getLLMStatisticsDetails(params: {
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}): Promise<LLMStatisticDetailsResponse> {
  const searchParams = new URLSearchParams()
  if (params.start_date) searchParams.set('start_date', params.start_date)
  if (params.end_date) searchParams.set('end_date', params.end_date)
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.offset) searchParams.set('offset', params.offset.toString())

  const queryString = searchParams.toString()
  const url = `/settings/statistics/details${queryString ? `?${queryString}` : ''}`

  return await clientFetch<LLMStatisticDetailsResponse>(url)
}

export async function downloadLLMStatisticsDetails(params?: {
  start_date?: string
  end_date?: string
}): Promise<{ content: string; filename: string }> {
  const searchParams = new URLSearchParams()
  if (params?.start_date) searchParams.set('start_date', params.start_date)
  if (params?.end_date) searchParams.set('end_date', params.end_date)

  const queryString = searchParams.toString()
  const url = `/settings/statistics/details/download${queryString ? `?${queryString}` : ''}`

  const res = await clientFetch(url, { raw: true })
  const disposition = res.headers.get('content-disposition')
  const filename =
    disposition?.match(/filename="(.+)"/)?.[1] ?? 'statistics.csv'
  const content = await res.text()
  return { content, filename }
}
