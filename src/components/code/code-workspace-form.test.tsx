import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CodeWorkspaceForm } from '@/components/code/code-workspace-form'
import type { CodingAgentProviderAvailability } from '@/types/code-agent'

const mockState = vi.hoisted(() => ({
  available: false,
  providers: undefined as CodingAgentProviderAvailability[] | undefined,
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/components/code/code-page-header', () => ({
  CodePageHeader: ({ children }: { children: React.ReactNode }) => (
    <header data-testid='page-header'>{children}</header>
  ),
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))

vi.mock('@/hooks/use-code-agent', () => ({
  useCodeAgentAvailability: () => ({
    data: {
      available: mockState.available,
      providers: mockState.providers,
      provider: 'codex',
      name: 'Codex',
    },
  }),
}))

vi.mock('@/hooks/use-code', () => ({
  useCreateCode: () => ({ isPending: false, mutate: vi.fn() }),
  useUpdateCode: () => ({ isPending: false, mutate: vi.fn() }),
  useGenerateCodeMetadata: () => ({ isPending: false, mutate: vi.fn() }),
}))

vi.mock('@/components/code/code-source-editor', () => ({
  CodeSourceEditor: ({
    code,
    disabled,
    review,
  }: {
    code: string
    disabled?: boolean
    review?: { code: string; dependencies: string[] }
  }) => (
    <div
      data-testid='source-editor'
      data-code={code}
      data-disabled={String(disabled)}
      data-review-code={review?.code ?? ''}
    />
  ),
}))

vi.mock('@/components/code/code-agent-panel', () => ({
  CodeAgentPanel: ({
    provider,
    onApply,
    onLockedChange,
    onProposalChange,
  }: {
    provider?: string
    onApply: (source: string, dependencies: string[]) => void
    onLockedChange: (locked: boolean) => void
    onProposalChange: (proposal: {
      id: string
      base_hash: string
      source: string
      dependencies: string[]
      diff: string
      warnings: string[]
    }) => void
  }) => (
    <div data-testid='agent-panel' data-provider={provider}>
      <button
        type='button'
        onClick={() =>
          onProposalChange({
            id: 'proposal-1',
            base_hash: 'hash',
            source: 'print("AI")\n',
            dependencies: ['pandas'],
            diff: '-before\n+AI',
            warnings: [],
          })
        }
      >
        mock-proposal
      </button>
      <button
        type='button'
        onClick={() => onApply('print("AI")\n', ['pandas'])}
      >
        mock-accept
      </button>
      <button type='button' onClick={() => onLockedChange(true)}>
        mock-lock
      </button>
    </div>
  ),
}))

describe('CodeWorkspaceForm coding agent integration', () => {
  afterEach(cleanup)

  beforeEach(() => {
    mockState.available = false
    mockState.providers = undefined
  })

  it('keeps the existing editor layout when no provider is available', () => {
    render(
      <CodeWorkspaceForm
        mode='create'
        nodeType='code_python'
        onComplete={vi.fn()}
      />,
    )
    expect(
      screen.queryByRole('button', { name: 'aiCoding' }),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('source-editor')).toBeInTheDocument()
  })

  it('opens OpenCode when Codex has no credentials and prevents switching an open session', () => {
    mockState.available = true
    mockState.providers = [
      { provider: 'codex', name: 'Codex', available: false },
      { provider: 'opencode', name: 'OpenCode', available: true },
    ]
    render(
      <CodeWorkspaceForm
        mode='create'
        nodeType='code_python'
        onComplete={vi.fn()}
      />,
    )
    const toggle = screen.getByRole('button', { name: 'aiCoding' })
    const pageHeader = screen.getByTestId('page-header')
    expect(pageHeader).toContainElement(toggle)
    expect(
      screen.getByRole('combobox', { name: 'agentProvider' }),
    ).toHaveTextContent('OpenCode')
    fireEvent.click(toggle)
    const agentPanel = screen.getByTestId('agent-panel')
    expect(agentPanel).toHaveAttribute('data-provider', 'opencode')
    expect(agentPanel.parentElement).toBe(
      pageHeader.parentElement?.parentElement,
    )
    expect(
      screen.getByRole('combobox', { name: 'agentProvider' }),
    ).toBeDisabled()
  })

  it('applies an accepted proposal to the unsaved form and locks during a turn', () => {
    mockState.available = true
    render(
      <CodeWorkspaceForm
        mode='edit'
        code={{
          uid: '6a83d04f-3bc4-40f0-aa1a-7e2e6bbd9158',
          name: 'Example',
          description: 'Example code',
          node_type: 'code_python',
          code: 'print("before")\n',
          dependencies: [],
        }}
        onComplete={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'aiCoding' }))
    fireEvent.click(screen.getByText('mock-lock'))
    expect(screen.getByTestId('source-editor')).toHaveAttribute(
      'data-disabled',
      'true',
    )

    fireEvent.click(screen.getByText('mock-proposal'))
    expect(screen.getByTestId('source-editor')).toHaveAttribute(
      'data-review-code',
      'print("AI")\n',
    )

    fireEvent.click(screen.getByText('mock-accept'))
    expect(screen.getByTestId('source-editor')).toHaveAttribute(
      'data-code',
      'print("AI")\n',
    )
    expect(screen.getByText('unsaved')).toBeInTheDocument()
  })
})
