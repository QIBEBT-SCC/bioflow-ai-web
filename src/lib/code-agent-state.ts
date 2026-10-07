import type {
  CodeAgentEvent,
  CodeAgentProposal,
  CodeAgentSession,
  CodeAgentTool,
} from '@/types/code-agent'

export function eventSequence(id: string) {
  return Number(id.split('-')[0])
}
export function codingEventState(
  state: CodeAgentSession,
  event: CodeAgentEvent,
): CodeAgentSession {
  if (event.type === 'session.closed')
    return { ...state, status: 'closed', proposal: null }
  if (eventSequence(event.id) <= eventSequence(state.last_event_id))
    return state
  const next = { ...state, last_event_id: event.id }
  const turnId = String(event.data.turn_id ?? '')
  switch (event.type) {
    case 'turn.queued':
      return {
        ...next,
        status: 'queued',
        turn_id: turnId,
        error: null,
        transcript: [
          ...state.transcript,
          { role: 'user', text: String(event.data.prompt), turn_id: turnId },
        ],
      }
    case 'turn.started':
      return { ...next, status: 'running' }
    case 'turn.cancel_requested':
      return { ...next, status: 'cancelling' }
    case 'message.delta': {
      const transcript = state.transcript.map((message) => ({ ...message }))
      const last = transcript.at(-1)
      if (last?.role === 'assistant' && last.turn_id === turnId)
        last.text += String(event.data.text)
      else
        transcript.push({
          role: 'assistant',
          turn_id: turnId,
          text: String(event.data.text),
        })
      return { ...next, transcript }
    }
    case 'tool.updated': {
      const tool = event.data as unknown as CodeAgentTool
      const previous = state.tools.find((item) => item.call_id === tool.call_id)
      return {
        ...next,
        tools: previous
          ? state.tools.map((item) =>
              item === previous
                ? { ...item, ...tool, detail: tool.detail || item.detail }
                : item,
            )
          : [...state.tools, tool],
      }
    }
    case 'turn.completed':
      return {
        ...next,
        status: event.data.status === 'proposal' ? 'proposal' : 'ready',
      }
    case 'proposal.ready':
      return {
        ...next,
        status: 'proposal',
        proposal: event.data as unknown as CodeAgentProposal,
      }
    case 'proposal.decided':
      return { ...next, status: 'ready', proposal: null }
    case 'turn.failed':
      return {
        ...next,
        status: 'ready',
        proposal: null,
        error: String(event.data.message),
      }
    case 'turn.cancelled':
      return { ...next, status: 'ready', proposal: null, error: null }
    default:
      return next
  }
}

export function codingSnapshotState(
  previous: CodeAgentSession | null,
  snapshot: CodeAgentSession,
) {
  if (previous?.status === 'closed') return previous
  return previous &&
    eventSequence(previous.last_event_id) >
      eventSequence(snapshot.last_event_id)
    ? previous
    : snapshot
}
