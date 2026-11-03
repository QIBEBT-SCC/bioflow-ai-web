import type { AgentEvent, AgentRun } from '@/types/agent'

export type AgentInputStatus = 'queued' | 'applied' | 'unhandled'

export function acceptsAgentInput(
  run: AgentRun | undefined,
  events: AgentEvent[],
) {
  return Boolean(
    run?.agent_name === 'workflow-builder' &&
      (run.status === 'queued' || run.status === 'running') &&
      !run.cancel_requested &&
      // Planning does not read corrections, so wait until the builder phase starts.
      events.some(
        (event) =>
          event.event_type === 'run.progress' &&
          event.payload.kind === 'workflow_phase' &&
          event.payload.phase === 'workflow_builder',
      ) &&
      !events.some((event) => event.event_type === 'run.input_closed'),
  )
}

export function agentInputStatuses(run: AgentRun, events: AgentEvent[]) {
  const statuses = new Map<string, AgentInputStatus>()
  const terminal = ['completed', 'cancelled', 'failed'].includes(run.status)
  for (const event of events) {
    const messageUid = event.payload.message_uid
    if (typeof messageUid !== 'string') continue
    if (event.event_type === 'run.input_queued') {
      statuses.set(messageUid, terminal ? 'unhandled' : 'queued')
    } else if (event.event_type === 'run.input_applied') {
      statuses.set(messageUid, 'applied')
    }
  }
  return statuses
}
