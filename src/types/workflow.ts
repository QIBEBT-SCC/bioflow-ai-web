export interface SimpleWorkflowInfo {
  uid: string
  name: string
}

// 运行实例相关类型定义
export enum Status {
  WAITING = 0,
  RUNNING = 1,
  ERROR = 2,
  SUCCESS = 3,
}

export interface TaskStat {
  total: number
  waiting?: number
  running?: number
  success?: number
  error?: number
}

export interface UserPublic {
  username: string
  email: string
  role: number
}

export interface TaskPublic4Run {
  uid: string
  name: string
  status: Status
  create_time?: string
  start_time?: string
  end_time?: string
}

export interface RunPublic {
  uid: string
  name: string
  owner: UserPublic
  status: Status
  task_stats?: TaskStat
  create_time?: string
  start_time?: string
  end_time?: string
}

export interface AutoRunPublic extends RunPublic {
  tasks: TaskPublic4Run[]
}
