import { act, renderHook, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '@/app/actions/code-agent'
import { codingEventState } from '@/lib/code-agent-state'
import type {
  CodeAgentEvent,
  CodeAgentProposal,
  CodeAgentSession,
} from '@/types/code-agent'
import { codeBaselineHash, useCodeAgent } from './use-code-agent'

vi.mock('@/app/actions/code-agent', () => ({
  createCodingSession: vi.fn(),
  getCodingAvailability: vi.fn(),
  getCodingSession: vi.fn(),
  closeCodingSession: vi.fn(),
  sendCodingTurn: vi.fn(),
  stopCodingTurn: vi.fn(),
  decideCodingProposal: vi.fn(),
  streamCodingEvents: vi.fn(),
}))
const session: CodeAgentSession = {
  id: 'session',
  node_type: 'code_python',
  status: 'ready',
  turn_id: null,
  transcript: [],
  tools: [],
  proposal: null,
  error: null,
  last_event_id: '1-0',
}
let emit: (event: CodeAgentEvent) => void
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.createCodingSession).mockResolvedValue({ ...session })
  vi.mocked(api.getCodingAvailability).mockResolvedValue({
    available: true,
    model_name: 'central',
  })
  vi.mocked(api.getCodingSession).mockResolvedValue({ ...session })
  vi.mocked(api.closeCodingSession).mockResolvedValue(undefined)
  vi.mocked(api.streamCodingEvents).mockImplementation(
    async (_id, _cursor, signal, callback) => {
      emit = callback
      await new Promise<void>((resolve) =>
        signal.addEventListener('abort', () => resolve(), { once: true }),
      )
    },
  )
})

describe('temporary native coding conversation', () => {
  it('creates once in Strict Mode and closes on unmount', async () => {
    const hook = renderHook(
      () =>
        useCodeAgent({
          enabled: true,
          nodeType: 'code_python',
          source: '',
          dependencies: [],
          onApply: vi.fn(),
        }),
      { wrapper: StrictMode },
    )
    await waitFor(() => expect(hook.result.current.connected).toBe(true))
    expect(api.createCodingSession).toHaveBeenCalledTimes(1)
    hook.unmount()
    expect(api.closeCodingSession).toHaveBeenCalledWith('session')
  })
  it('closes a creation that returns after the page is gone', async () => {
    let resolve!: (value: CodeAgentSession) => void
    vi.mocked(api.createCodingSession).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    const hook = renderHook(() =>
      useCodeAgent({
        enabled: true,
        nodeType: 'code_python',
        source: '',
        dependencies: [],
        onApply: vi.fn(),
      }),
    )
    await waitFor(() => expect(api.createCodingSession).toHaveBeenCalled())
    hook.unmount()
    await act(async () => resolve(session))
    expect(api.closeCodingSession).toHaveBeenCalledWith('session')
  })
  it('uses the latest manual editor baseline and central configuration for every turn', async () => {
    vi.mocked(api.sendCodingTurn).mockResolvedValue({
      ...session,
      status: 'queued',
      last_event_id: '2-0',
    })
    const hook = renderHook(
      ({ source }) =>
        useCodeAgent({
          enabled: true,
          nodeType: 'code_python',
          source,
          dependencies: ['pandas'],
          onApply: vi.fn(),
        }),
      { initialProps: { source: 'old' } },
    )
    await waitFor(() => expect(hook.result.current.connected).toBe(true))
    hook.rerender({ source: 'manually edited' })
    await act(() => hook.result.current.send('edit', 'zh'))
    expect(api.sendCodingTurn).toHaveBeenCalledWith(
      'session',
      { source: 'manually edited', dependencies: ['pandas'] },
      'edit',
      'zh',
    )
    expect(hook.result.current.locked).toBe(true)
    expect(api.getCodingAvailability).toHaveBeenCalledTimes(2)
    hook.unmount()
  })
  it('accepts only into the unsaved form and records rejection without applying', async () => {
    // Use a fixed fingerprint from the backend's SHA-256 contract.
    const baseline = { source: 'print(1)\n', dependencies: [] }
    const hash = await codeBaselineHash('code_python', baseline)
    const proposal: CodeAgentProposal = {
      id: 'proposal',
      turn_id: 'turn',
      baseline_hash: hash,
      source: 'print(2)\n',
      dependencies: ['pandas'],
      diff: 'diff',
      warnings: [],
    }
    const onApply = vi.fn()
    vi.mocked(api.decideCodingProposal).mockResolvedValue({
      ...session,
      last_event_id: '4-0',
    })
    const hook = renderHook(() =>
      useCodeAgent({
        enabled: true,
        nodeType: 'code_python',
        ...baseline,
        onApply,
      }),
    )
    await waitFor(() => expect(hook.result.current.connected).toBe(true))
    act(() =>
      emit({ id: '3-0', type: 'proposal.ready', data: { ...proposal } }),
    )
    expect(hook.result.current.locked).toBe(true)
    await act(() => hook.result.current.decide('accept'))
    expect(onApply).toHaveBeenCalledWith(proposal)
    act(() =>
      emit({
        id: '5-0',
        type: 'proposal.ready',
        data: { ...proposal, id: 'next' },
      }),
    )
    await act(() => hook.result.current.decide('reject'))
    expect(onApply).toHaveBeenCalledTimes(1)
    hook.unmount()
  })
  it('blocks a proposal after the editor changed and ignores late events after close', async () => {
    const onApply = vi.fn()
    const proposal = {
      id: 'proposal',
      turn_id: 'turn',
      baseline_hash: 'old',
      source: 'candidate',
      dependencies: [],
      diff: '',
      warnings: [],
    }
    const hook = renderHook(() =>
      useCodeAgent({
        enabled: true,
        nodeType: 'code_python',
        source: 'changed',
        dependencies: [],
        onApply,
      }),
    )
    await waitFor(() => expect(hook.result.current.connected).toBe(true))
    act(() => emit({ id: '2-0', type: 'proposal.ready', data: proposal }))
    await act(() => hook.result.current.decide('accept'))
    expect(api.decideCodingProposal).not.toHaveBeenCalled()
    expect(hook.result.current.error).toBe('EDITOR_CHANGED')
    hook.unmount()
    act(() => emit({ id: '3-0', type: 'proposal.ready', data: proposal }))
    expect(onApply).not.toHaveBeenCalled()
  })
  it('reconnects with a recovered proposal and tool output without closing the session', async () => {
    const proposal = {
      id: 'p',
      turn_id: 't',
      baseline_hash: '',
      source: 'new',
      dependencies: [],
      diff: '',
      warnings: [],
    }
    vi.mocked(api.streamCodingEvents).mockRejectedValueOnce(
      new Error('disconnected'),
    )
    vi.mocked(api.getCodingSession)
      .mockResolvedValueOnce(session)
      .mockResolvedValue({
        ...session,
        status: 'proposal',
        proposal,
        last_event_id: '9-0',
      })
    const hook = renderHook(() =>
      useCodeAgent({
        enabled: true,
        nodeType: 'code_python',
        source: '',
        dependencies: [],
        onApply: vi.fn(),
      }),
    )
    await waitFor(
      () => expect(hook.result.current.session?.proposal?.id).toBe('p'),
      { timeout: 2500 },
    )
    expect(api.streamCodingEvents).toHaveBeenLastCalledWith(
      'session',
      '9-0',
      expect.any(AbortSignal),
      expect.any(Function),
    )
    expect(api.closeCodingSession).not.toHaveBeenCalled()
    hook.unmount()
  })
  it('deduplicates replayed deltas and does not let an older snapshot overwrite progress', () => {
    const changed = codingEventState(session, {
      id: '2-0',
      type: 'message.delta',
      data: { turn_id: 't', text: 'hello' },
    })
    expect(
      codingEventState(changed, {
        id: '2-0',
        type: 'message.delta',
        data: { turn_id: 't', text: 'hello' },
      }).transcript[0].text,
    ).toBe('hello')
  })
})

it('matches the backend fingerprint for Unicode source and ordered dependencies', async () => {
  expect(
    await codeBaselineHash('code_python', {
      source: 'print("中文")\n',
      dependencies: ['numpy>=2', 'pandas'],
    }),
  ).toBe('81105fe68b532516dabfebaf419884a6bc3cdb5f5e8c61907899eb4370a4cddb')
})

it('never applies an acceptance response arriving after sidebar closure', async () => {
  const baseline = { source: 'original', dependencies: [] }
  const proposal: CodeAgentProposal = {
    id: 'p',
    turn_id: 't',
    baseline_hash: await codeBaselineHash('code_python', baseline),
    source: 'candidate',
    dependencies: [],
    diff: '',
    warnings: [],
  }
  let resolve!: (value: CodeAgentSession) => void
  vi.mocked(api.decideCodingProposal).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  const onApply = vi.fn()
  const hook = renderHook(() =>
    useCodeAgent({
      enabled: true,
      nodeType: 'code_python',
      ...baseline,
      onApply,
    }),
  )
  await waitFor(() => expect(hook.result.current.connected).toBe(true))
  act(() => emit({ id: '2-0', type: 'proposal.ready', data: { ...proposal } }))
  let pending!: Promise<boolean>
  act(() => {
    pending = hook.result.current.decide('accept')
  })
  await waitFor(() => expect(api.decideCodingProposal).toHaveBeenCalled())
  hook.unmount()
  resolve({ ...session, last_event_id: '3-0' })
  await pending
  expect(onApply).not.toHaveBeenCalled()
})
