// ==================== LLMProvider Schemas ====================
export interface LLMProviderCreate {
  name: string
  base_url: string
  api_key: string
  use_proxy: boolean
  /** Default: true */
  is_active?: boolean
}

export interface LLMProviderUpdate {
  name?: string
  base_url?: string
  api_key?: string
  use_proxy?: boolean
  is_active?: boolean
}

export interface LLMProviderPublic {
  id: number
  name: string
  base_url?: string
  api_key?: string
  use_proxy: boolean
  is_active: boolean
  models: LLMModelPublic[]
}

// ==================== LLMModel Schemas ====================

export interface LLMModelCreate {
  provider_id: number
  name: string
  input_price: number
  output_price: number
  cache_read_price: number
  /** Default: {} */
  extra_body?: Record<string, any>
  /** Default: true */
  is_active?: boolean
}

export interface LLMModelUpdate {
  name?: string
  input_price?: number
  output_price?: number
  cache_read_price?: number
  extra_body?: Record<string, any>
  is_active?: boolean
}

export interface LLMModelPublic {
  id: number
  provider_id: number
  name: string
  input_price: number
  output_price: number
  cache_read_price: number
  extra_body: Record<string, any>
  is_active: boolean
}

// ==================== LLMSetting Schemas ====================

export interface LLMSettingItem {
  model_id: number
  model_name: string
  provider_name: string
}

export interface LLMSettingPublic {
  chat_model: LLMSettingItem
  vision_model: LLMSettingItem
  agent_model: LLMSettingItem
  coding_model: LLMSettingItem
  simple_model: LLMSettingItem
  long_context_model: LLMSettingItem
  high_performance_model: LLMSettingItem
}

export type LLMSettingKey =
  | 'chat_model'
  | 'vision_model'
  | 'agent_model'
  | 'coding_model'
  | 'simple_model'
  | 'long_context_model'
  | 'high_performance_model'

export interface LLMSettingUpdate {
  key: LLMSettingKey
  model_id: number
}

// ==================== LLMStatistic Schemas ====================

export interface LLMStatisticSummary {
  total_input_tokens: number
  total_output_tokens: number
  total_cache_read: number
  /** Decimal mapped to number. Use string if backend serializes Decimal as string. */
  total_price: number
}

export interface LLMStatisticByAgent extends LLMStatisticSummary {
  count: number
  agent_name: string
}

export interface LLMStatisticByModel extends LLMStatisticSummary {
  count: number
  model_name: string
}

export interface LLMStatisticByType extends LLMStatisticSummary {
  count: number
  setting_key: string
}

export interface LLMStatisticByUser extends LLMStatisticSummary {
  count: number
  user_name: string
}

/** LLM 使用统计概览，包含总体统计和各维度分组 */
export interface LLMStatisticOverview {
  total: LLMStatisticSummary
  by_agent: LLMStatisticByAgent[]
  by_model: LLMStatisticByModel[]
  by_type: LLMStatisticByType[]
  by_user: LLMStatisticByUser[]
}

export interface LLMStatisticDetail {
  id: number
  agent_name: string
  model_name?: string
  setting_key?: string
  input_tokens: number
  output_tokens: number
  cache_read: number
  /** Decimal mapped to number */
  price: number
  /** ISO 8601 Date String */
  time: string
}

/** LLM 使用详细记录响应 */
export interface LLMStatisticDetailsResponse {
  total: number
  items: LLMStatisticDetail[]
}
