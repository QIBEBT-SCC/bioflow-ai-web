import type { AgentName, AgentRun } from '@/types/agent'

type WorkflowSuggestionAgent = Extract<
  AgentName,
  'workflow-assistant' | 'workflow-fixer'
>

export function getSuggestedWorkflowAgent(
  runs: AgentRun[],
  sourceRunUid: string,
): WorkflowSuggestionAgent | null {
  const completed = runs.filter(
    (run) =>
      run.status === 'completed' &&
      run.result_payload?.source_run_uid === sourceRunUid,
  )
  if (completed.some((run) => run.agent_name === 'workflow-fixer')) return null
  const hasDiagnosis = completed.some(
    (run) =>
      run.agent_name === 'workflow-assistant' &&
      Boolean(run.result_payload?.diagnosis_path?.trim()),
  )
  return hasDiagnosis ? 'workflow-fixer' : 'workflow-assistant'
}
