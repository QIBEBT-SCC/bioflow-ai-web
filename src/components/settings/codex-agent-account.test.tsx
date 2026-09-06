import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CodexAgentAccount } from '@/components/settings/codex-agent-account'

const mocks = vi.hoisted(() => ({
  translate: (key: string) => key,
  refetch: vi.fn(),
  startLogin: vi.fn(),
  cancelLogin: vi.fn(),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => mocks.translate,
}))

vi.mock('@/hooks/use-code-agent', () => ({
  useCodeAgentAvailability: () => ({
    data: {
      provider: 'codex',
      name: 'Codex',
      available: false,
    },
    isLoading: false,
    error: null,
    refetch: mocks.refetch,
  }),
  useStartCodexLogin: () => ({
    isPending: false,
    mutateAsync: mocks.startLogin,
  }),
}))

vi.mock('@/app/actions/code-agent', () => ({
  cancelCodexLogin: mocks.cancelLogin,
}))

class FakeEventSource {
  static instances: FakeEventSource[] = []
  listeners = new Map<string, Array<(event: MessageEvent<string>) => void>>()

  constructor(readonly url: string) {
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

describe('CodexAgentAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    FakeEventSource.instances = []
    vi.stubGlobal('EventSource', FakeEventSource)
    mocks.startLogin.mockResolvedValue({ id: 'login-1', status: 'starting' })
    mocks.cancelLogin.mockResolvedValue(undefined)
    mocks.refetch.mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('shows the Codex device code and completes the shared login', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <CodexAgentAccount />
      </QueryClientProvider>,
    )

    fireEvent.click(screen.getByText('login'))
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))
    const events = FakeEventSource.instances[0]
    expect(events.url).toContain(
      '/coding-agents/providers/codex/login/login-1/events',
    )

    act(() =>
      events.emit('login.code', {
        verification_url: 'https://auth.openai.com/codex/device',
        user_code: 'ABCD-1234',
        message: 'Sign in to ChatGPT and enter this code: ABCD-1234',
      }),
    )

    expect(screen.getByText('ABCD-1234')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'openVerification' }),
    ).toHaveAttribute('href', 'https://auth.openai.com/codex/device')

    act(() => events.emit('login.completed', {}))
    expect(await screen.findByText('loginSucceeded')).toBeInTheDocument()
  })
})
