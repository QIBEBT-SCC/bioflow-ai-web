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

/**
 * Suggest building once the session's planner has produced an approved plan.
 *
 * Planning and building are separate runs: the builder only reads the planner's
 * PLAN.md and SAMPLES.md, so it is offered after the latest completed planner
 * run until a builder run has been started from it.
 */
export function shouldSuggestBuild(runs: AgentRun[], hasProjectPlan: boolean) {
  if (!hasProjectPlan) return false
  const plannedAt = runs
    .filter(
      (run) =>
        run.agent_name === 'project-planner' && run.status === 'completed',
    )
    .reduce<string | null>(
      (latest, run) =>
        latest === null || run.create_time > latest ? run.create_time : latest,
      null,
    )
  if (plannedAt === null) return false
  return !runs.some(
    (run) =>
      run.agent_name === 'workflow-builder' && run.create_time > plannedAt,
  )
}
