export interface ToolMemorySummary {
  uid: string
  description: string
}

export interface ToolMemoryListItem extends ToolMemorySummary {
  tool_uid: string
  tool_name: string
  creator_username: string | null
  created_at: string
}

export interface ToolMemory extends ToolMemoryListItem {
  content: string
}

export interface ToolMemoryCreate {
  tool_uid: string
  description: string
  content: string
}

export interface ToolMemoryUpdate {
  description?: string
  content?: string
}

export interface PaginatedToolMemories {
  total: number
  offset: number
  limit: number
  has_more: boolean
  data: ToolMemoryListItem[]
}
