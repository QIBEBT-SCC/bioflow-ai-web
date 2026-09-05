import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CodeAgentPanel } from '@/components/code/code-agent-panel'

const actions = vi.hoisted(() => ({
  createSession: vi.fn(),
  createTurn: vi.fn(),
  cancelTurn: vi.fn(),
  decideProposal: vi.fn(),
  closeSession: vi.fn(),
}))

const translate = (key: string) => key

vi.mock('next-intl', () => ({ useTranslations: () => translate }))
vi.mock('@/app/actions/code-agent', () => ({
  createCodeAgentSession: actions.createSession,
  createCodeAgentTurn: actions.createTurn,
  cancelCodeAgentTurn: actions.cancelTurn,
  decideCodeAgentProposal: actions.decideProposal,
  closeCodeAgentSession: actions.closeSession,
}))

class FakeEventSource {
  static instances: FakeEventSource[] = []
  listeners = new Map<string, Array<(event: MessageEvent<string>) => void>>()
  onerror: (() => void) | null = null

  constructor(
    readonly url: string,
    readonly options?: EventSourceInit,
  ) {
    FakeEventSource.instances.push(this)
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const callback = listener as (event: MessageEvent<string>) => void
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), callback])
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ) {
    const callback = listener as (event: MessageEvent<string>) => void
    this.listeners.set(
      type,
      (this.listeners.get(type) ?? []).filter((item) => item !== callback),
    )
  }

  emit(type: string, data: object) {
    const event = new MessageEvent(type, { data: JSON.stringify(data) })
    for (const listener of this.listeners.get(type) ?? []) listener(event)
  }

  close() {}
}

describe('CodeAgentPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    FakeEventSource.instances = []
    vi.stubGlobal('EventSource', FakeEventSource)
    actions.createSession.mockResolvedValue({
      id: 'session-1',
      status: 'starting',
    })
    actions.createTurn.mockResolvedValue(undefined)
    actions.cancelTurn.mockResolvedValue(undefined)
    actions.decideProposal.mockResolvedValue(undefined)
    actions.closeSession.mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('streams a turn, supports stop, and applies the whole proposal without saving', async () => {
    const onApply = vi.fn()
    const onLockedChange = vi.fn()
    const onProposalChange = vi.fn()
    render(
      <CodeAgentPanel
        nodeType='code_python'
        source={'print("before")\n'}
        dependencies={['polars']}
        onApply={onApply}
        onLockedChange={onLockedChange}
        onProposalChange={onProposalChange}
        width={384}
        onResizeStartAction={vi.fn()}
      />,
    )

    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))
    const events = FakeEventSource.instances[0]
    expect(events.options).toEqual({ withCredentials: true })
    act(() => events.emit('session.ready', {}))

    fireEvent.change(screen.getByPlaceholderText('placeholder'), {
      target: { value: 'Update it' },
    })
    fireEvent.click(screen.getByLabelText('send'))
    await waitFor(() =>
      expect(actions.createTurn).toHaveBeenCalledWith('session-1', {
        prompt: 'Update it',
        source: 'print("before")\n',
        dependencies: ['polars'],
      }),
    )
    await waitFor(() => expect(onLockedChange).toHaveBeenLastCalledWith(true))

    fireEvent.click(screen.getByLabelText('stop'))
    expect(actions.cancelTurn).toHaveBeenCalledWith('session-1')

    act(() => {
      events.emit('message.delta', { text: 'Inspecting first.' })
      events.emit('thought.delta', {
        message_id: 'thought-1',
        text: 'Checking the existing ',
      })
      events.emit('tool.updated', {
        kind: 'agent_thought_chunk',
        detail: {
          sessionUpdate: 'agent_thought_chunk',
          messageId: 'thought-1',
          content: { type: 'text', text: 'implementation.' },
        },
      })
      events.emit('session.event', { name: 'usage_update' })
      events.emit('tool.updated', {
        kind: 'session_info_update',
        detail: { sessionUpdate: 'session_info_update' },
      })
      events.emit('plan.updated', {
        sessionUpdate: 'plan',
        entries: [{ content: 'Inspect the source', status: 'in_progress' }],
      })
      events.emit('tool.updated', {
        sessionUpdate: 'tool_call',
        toolCallId: 'tool-1',
        title: 'Read script.py',
        kind: 'read',
        status: 'in_progress',
        locations: [{ path: '/workspace/script.py' }],
      })
      events.emit('tool.updated', {
        sessionUpdate: 'tool_call_update',
        toolCallId: 'tool-1',
        title: 'Read script.py',
        kind: 'read',
        status: 'completed',
        rawOutput: 'print("before")',
      })
      events.emit('message.delta', { text: 'Done' })
      events.emit('proposal.ready', {
        id: 'proposal-1',
        base_hash: 'hash',
        source: 'print("after")\n',
        dependencies: ['polars', 'pandas'],
        diff: '-before\n+after',
        warnings: [],
      })
    })
    expect(screen.getByText('Inspecting first.')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
    const thoughtHeaders = screen.getAllByText('thought')
    expect(thoughtHeaders).toHaveLength(2)
    fireEvent.click(thoughtHeaders[0])
    expect(
      screen.getByText('Checking the existing implementation.'),
    ).toBeInTheDocument()
    expect(screen.getByText('usage_update')).toBeInTheDocument()
    expect(screen.getByText('session_info_update')).toBeInTheDocument()
    expect(
      screen.queryByText('activityLabels.other.running'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText('activityLabels.read.completed'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('script.py')).toHaveLength(1)
    fireEvent.click(screen.getByText('script.py'))
    expect(screen.getByText('print("before")')).toBeInTheDocument()
    expect(onProposalChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'proposal-1' }),
    )
    fireEvent.click(screen.getByText('accept'))

    await waitFor(() =>
      expect(actions.decideProposal).toHaveBeenCalledWith(
        'session-1',
        'proposal-1',
        'accept',
      ),
    )
    expect(onApply).toHaveBeenCalledWith('print("after")\n', [
      'polars',
      'pandas',
    ])
    expect(onProposalChange).toHaveBeenLastCalledWith(undefined)
  })

  it('discards a proposal without changing the editor baseline', async () => {
    const onApply = vi.fn()
    render(
      <CodeAgentPanel
        nodeType='code_bash'
        source={'echo before\n'}
        dependencies={[]}
        onApply={onApply}
        onLockedChange={vi.fn()}
        onProposalChange={vi.fn()}
        width={384}
        onResizeStartAction={vi.fn()}
      />,
    )
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))
    act(() => {
      FakeEventSource.instances[0].emit('proposal.ready', {
        id: 'proposal-2',
        base_hash: 'hash',
        source: 'echo after\n',
        dependencies: [],
        diff: '-before\n+after',
        warnings: [],
      })
    })
    fireEvent.click(screen.getByText('reject'))
    await waitFor(() =>
      expect(actions.decideProposal).toHaveBeenCalledWith(
        'session-1',
        'proposal-2',
        'reject',
      ),
    )
    expect(onApply).not.toHaveBeenCalled()
  })
})
