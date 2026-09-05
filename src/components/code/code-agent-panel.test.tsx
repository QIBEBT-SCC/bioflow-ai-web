import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CodeAgentPanel } from '@/components/code/code-agent-panel'
import {
  readCodeAgentPreferences,
  saveCodeAgentPreferences,
} from '@/components/code/code-agent-preferences'

const actions = vi.hoisted(() => ({
  createSession: vi.fn(),
  createTurn: vi.fn(),
  cancelTurn: vi.fn(),
  decideProposal: vi.fn(),
  closeSession: vi.fn(),
  setConfig: vi.fn(),
}))

const translate = (key: string) => key

vi.mock('next-intl', () => ({ useTranslations: () => translate }))
vi.mock('@/app/actions/code-agent', () => ({
  createCodeAgentSession: actions.createSession,
  createCodeAgentTurn: actions.createTurn,
  cancelCodeAgentTurn: actions.cancelTurn,
  decideCodeAgentProposal: actions.decideProposal,
  closeCodeAgentSession: actions.closeSession,
  setCodeAgentConfig: actions.setConfig,
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
    localStorage.clear()
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
    actions.setConfig.mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('uses ACP model options and refreshes reasoning after the agent confirms a change', async () => {
    render(
      <CodeAgentPanel
        nodeType='code_python'
        source=''
        dependencies={[]}
        onApply={vi.fn()}
        onLockedChange={vi.fn()}
        onProposalChange={vi.fn()}
        width={384}
        onResizeStartAction={vi.fn()}
      />,
    )
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))
    const events = FakeEventSource.instances[0]
    const model = {
      id: 'provider-model',
      name: 'Model',
      type: 'select',
      category: 'model',
      currentValue: 'a',
      options: [
        { value: 'a', name: 'Model A' },
        { value: 'b', name: 'Model B' },
      ],
    }
    act(() => {
      events.emit('config.updated', { configOptions: [model] })
      events.emit('session.ready', {})
    })
    fireEvent.keyDown(screen.getByRole('button', { name: 'model' }), {
      key: 'ArrowDown',
    })
    fireEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Model B' }),
    )
    expect(actions.setConfig).toHaveBeenCalledWith(
      'session-1',
      'provider-model',
      'b',
    )
    expect(screen.getByRole('button', { name: 'model' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'send' })).toBeDisabled()
    act(() =>
      events.emit('config.completed', {
        configOptions: [
          { ...model, currentValue: 'b' },
          {
            id: 'effort',
            name: 'Effort',
            type: 'select',
            category: 'thought_level',
            currentValue: 'high',
            options: [{ value: 'high', name: 'High' }],
          },
        ],
      }),
    )
    expect(readCodeAgentPreferences()).toEqual({
      model: 'b',
      thought_level: 'high',
    })
    expect(screen.getByRole('button', { name: 'model' })).toHaveTextContent(
      'Model B',
    )
    expect(screen.getByRole('button', { name: 'reasoning' })).toHaveTextContent(
      'High',
    )
    fireEvent.keyDown(screen.getByRole('button', { name: 'model' }), {
      key: 'ArrowDown',
    })
    fireEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Model A' }),
    )
    act(() => events.emit('config.failed', { message: 'Unavailable' }))
    expect(screen.getByRole('button', { name: 'model' })).toBeEnabled()
    expect(readCodeAgentPreferences()).toEqual({
      model: 'b',
      thought_level: 'high',
    })
    expect(screen.getByRole('button', { name: 'model' })).toHaveTextContent(
      'Model B',
    )
  })

  it('restores model before reasoning using fresh ACP options', async () => {
    const model = {
      id: 'model',
      category: 'model',
      type: 'select',
      name: 'Model',
      currentValue: 'b',
      options: [
        { value: 'a', name: 'A' },
        { value: 'b', name: 'B' },
      ],
    }
    const effort = {
      id: 'effort',
      category: 'thought_level',
      type: 'select',
      name: 'Effort',
      currentValue: 'high',
      options: [
        { value: 'low', name: 'Low' },
        { value: 'high', name: 'High' },
      ],
    }
    saveCodeAgentPreferences([model, effort])
    render(
      <CodeAgentPanel
        nodeType='code_python'
        source=''
        dependencies={[]}
        onApply={vi.fn()}
        onLockedChange={vi.fn()}
        onProposalChange={vi.fn()}
        width={384}
        onResizeStartAction={vi.fn()}
      />,
    )
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))
    const events = FakeEventSource.instances[0]
    act(() =>
      events.emit('config.updated', {
        configOptions: [{ ...model, currentValue: 'a' }],
      }),
    )
    expect(actions.setConfig).not.toHaveBeenCalled()
    act(() => events.emit('session.ready', {}))
    expect(actions.setConfig).toHaveBeenLastCalledWith(
      'session-1',
      'model',
      'b',
    )
    act(() =>
      events.emit('config.completed', {
        configOptions: [model, { ...effort, currentValue: 'low' }],
      }),
    )
    expect(actions.setConfig).toHaveBeenLastCalledWith(
      'session-1',
      'effort',
      'high',
    )
    expect(screen.getByRole('button', { name: 'model' })).toBeDisabled()
    act(() =>
      events.emit('config.completed', { configOptions: [model, effort] }),
    )
    expect(screen.getByRole('button', { name: 'reasoning' })).toHaveTextContent(
      'High',
    )
    expect(screen.getByRole('button', { name: 'model' })).toBeEnabled()
    expect(actions.setConfig).toHaveBeenCalledTimes(2)
  })

  it('creates only one session in Strict Mode and closes it on unmount', async () => {
    const view = render(
      <StrictMode>
        <CodeAgentPanel
          nodeType='code_python'
          source=''
          dependencies={[]}
          onApply={vi.fn()}
          onLockedChange={vi.fn()}
          onProposalChange={vi.fn()}
          width={384}
          onResizeStartAction={vi.fn()}
        />
      </StrictMode>,
    )

    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))
    expect(actions.createSession).toHaveBeenCalledTimes(1)

    view.unmount()

    await waitFor(() =>
      expect(actions.closeSession).toHaveBeenCalledWith('session-1', true),
    )
    expect(actions.createSession).toHaveBeenCalledTimes(1)
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
      events.emit('session.event', { name: 'available_commands_update' })
      events.emit('session.info', { title: 'Clean GTF records' })
      events.emit('session.usage', { used: 1200, size: 10000 })
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
    expect(
      screen.queryByText('available_commands_update'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('activity')).not.toBeInTheDocument()
    expect(screen.getByText('Clean GTF records')).toBeInTheDocument()
    expect(screen.getByText('contextUsage 12%')).toBeInTheDocument()
    const taskHeaders = screen.getAllByRole('button', { name: 'taskDetails' })
    expect(taskHeaders).toHaveLength(1)
    fireEvent.click(taskHeaders[0])
    expect(
      screen.getByText('Checking the existing implementation.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('usage_update')).not.toBeInTheDocument()
    expect(screen.queryByText('session_info_update')).not.toBeInTheDocument()
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
