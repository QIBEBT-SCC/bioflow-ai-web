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

export interface ChatSessionPage {
  /** 每页数量 */
  limit: number
  /** 是否还有更多数据 */
  has_more: boolean
  /** 下一页游标, 为最后一条记录的 update_time; 无更多数据时为 null */
  next_cursor: string | null
  /** 聊天会话列表 */
  data: ChatSessionPublic[]
}
