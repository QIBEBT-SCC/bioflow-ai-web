import type { Statistics, Status } from '@/types/run'
import type { User } from '@/types/auth'

/**
 * 项目工作流信息
 */
export interface ProjectWorkflow {
  workflow_uid: string
  workflow_name: string
  import_time: string
  enabled: boolean
}

/**
 * 添加工作流到项目请求
 */
export interface AddWorkflowRequest {
  workflow_uid: string
}

/**
 * 运行工作流请求
 */
export interface RunWorkflowRequest {
  sample_uids: string[]
  run_name_prefix?: string
}

/**
 * 工作流运行结果
 */
export interface WorkflowRunResult {
  run_uids: string[]
  count: number
}

/**
 * 运行实例信息(项目模式)
 */
export interface RunInstance {
  uid: string
  name: string
  owner: User
  project_id: number | null
  workflow_uid: string | null
  sample_uid: string | null
  status: Status
  task_statistics: Statistics | null
  create_time: string
  start_time: string | null
  end_time: string | null
}
