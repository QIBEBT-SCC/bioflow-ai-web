import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CodingAgentManagement } from './coding-agent-management'

const push = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('@/hooks/use-code-agent', () => ({
  useCodeAgentAvailability: () => ({
    data: {
      available: true,
      provider: 'codex',
      name: 'Codex',
      providers: [
        { provider: 'codex', name: 'Codex', available: true },
        { provider: 'opencode', name: 'OpenCode', available: false },
      ],
    },
    isLoading: false,
  }),
}))
vi.mock('./codex-agent-account', () => ({
  CodexAgentAccount: ({ available }: { available: boolean }) => (
    <div data-testid='codex-account'>{String(available)}</div>
  ),
}))
vi.mock('./codex-agent-settings', () => ({
  CodexAgentSettingsPanel: () => <div data-testid='codex-settings' />,
}))
vi.mock('./opencode-agent-settings', () => ({
  OpenCodeAgentSettings: ({ available }: { available: boolean }) => (
    <div data-testid='provider-credentials'>opencode:{String(available)}</div>
  ),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CodingAgentManagement', () => {
  it('renders only Codex settings in the Codex tab', () => {
    render(<CodingAgentManagement initialAgent='codex' />)
    expect(screen.getByTestId('codex-account')).toHaveTextContent('true')
    expect(screen.getByTestId('codex-settings')).toBeInTheDocument()
    expect(screen.queryByTestId('provider-credentials')).not.toBeInTheDocument()
  })

  it('renders only OpenCode settings in the OpenCode tab', () => {
    render(<CodingAgentManagement initialAgent='opencode' />)
    expect(screen.getByTestId('provider-credentials')).toHaveTextContent(
      'opencode:false',
    )
    expect(screen.queryByTestId('codex-settings')).not.toBeInTheDocument()
  })
})
