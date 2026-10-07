import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { CodeWorkspaceForm } from './code-workspace-form'

const control = vi.hoisted(() => ({
  locked: false,
  proposal: null as unknown,
  onApply: null as null | ((value: unknown) => void),
  save: vi.fn(),
}))
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('@/hooks/use-code', () => ({
  useCreateCode: () => ({ isPending: false, mutate: control.save }),
  useUpdateCode: () => ({ isPending: false, mutate: control.save }),
  useGenerateCodeMetadata: () => ({ isPending: false, mutate: vi.fn() }),
}))
vi.mock('@/hooks/use-code-agent', () => ({
  useCodeAgent: (options: { onApply: (value: unknown) => void }) => {
    control.onApply = options.onApply
    return { locked: control.locked, session: { proposal: control.proposal } }
  },
}))
vi.mock('@/components/layout/page-shell', () => ({
  PageTopbar: ({ actions }: { actions: ReactNode }) => <div>{actions}</div>,
}))
vi.mock('@/components/ui/sidebar', () => ({
  SidebarInset: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}))
vi.mock('@/components/code/code-source-editor', () => ({
  CodeSourceEditor: (props: {
    code: string
    dependencies: string[]
    disabled: boolean
    onCodeChange: (value: string) => void
    review?: { code: string }
  }) => (
    <div>
      <textarea
        aria-label='source'
        disabled={props.disabled}
        value={props.review?.code ?? props.code}
        onChange={(event) => props.onCodeChange(event.target.value)}
      />
      <span>{props.dependencies.join(',')}</span>
    </div>
  ),
}))
vi.mock('@/components/code/code-agent-panel', () => ({
  CodeAgentPanel: () => (
    <button
      type='button'
      onClick={() => {
        control.onApply?.({ source: 'candidate', dependencies: ['numpy'] })
      }}
    >
      accept proposal
    </button>
  ),
}))
beforeEach(() => {
  cleanup()
  control.save.mockReset()
  control.locked = false
  control.proposal = null
})
const code = {
  uid: 'id',
  name: 'Name',
  description: 'Description',
  code: 'original',
  dependencies: [],
  node_type: 'code_python' as const,
  created_at: '',
  updated_at: '',
}
it('accepts into the form and persists only when Save is clicked', () => {
  render(<CodeWorkspaceForm mode='edit' code={code} onComplete={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'title' }))
  fireEvent.click(screen.getByRole('button', { name: 'accept proposal' }))
  expect(screen.getByLabelText('source')).toHaveValue('candidate')
  expect(control.save).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'saveCode' }))
  expect(control.save).toHaveBeenCalledWith(
    {
      uid: 'id',
      code: {
        name: 'Name',
        description: 'Description',
        code: 'candidate',
        dependencies: ['numpy'],
      },
    },
    expect.any(Object),
  )
})
it('locks source and saving during an active round or review', () => {
  control.locked = true
  render(<CodeWorkspaceForm mode='edit' code={code} onComplete={vi.fn()} />)
  expect(screen.getByLabelText('source')).toBeDisabled()
  expect(screen.getByRole('button', { name: 'saveCode' })).toBeDisabled()
})
