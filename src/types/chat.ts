export interface ChatSessionUpdate {
  uid: string
  description?: string
  update_time?: string
}

export interface ChatSessionPublic {
  uid: string
  description: string
  checkpoint_uid: string
  interrupted: boolean
  create_time: string
  update_time: string
}

export interface PaginatedChatResponse {
  /** 总记录数 */
  total: number
  /** 当前偏移量 */
  offset: number
  /** 每页数量 */
  limit: number
  /** 是否还有更多数据 */
  has_more: boolean
  /** 聊天会话列表 */
  data: ChatSessionPublic[]
}
