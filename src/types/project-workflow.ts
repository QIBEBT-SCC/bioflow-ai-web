import type { ExecutionScope } from '@/types/workflow'

/**
 * 项目工作流信息
 */
export interface ProjectWorkflow {
  workflow_uid: string
  workflow_name: string
  import_time: string
  enabled: boolean
  execution_scope?: ExecutionScope
}

/**
 * 添加工作流到项目请求
 */
export interface AddWorkflowRequest {
  workflow_uid: string
}

/**
 * 工作流运行结果
 */
export interface WorkflowRunResult {
  run_uids: string[]
  count: number
}
