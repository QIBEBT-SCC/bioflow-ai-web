import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OpenCodeAgentSettings } from './opencode-agent-settings'

const save = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
vi.mock('@/app/actions/code-agent', () => ({
  saveOpenCodeCredentials: save,
}))
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('provider credential configuration', () => {
  it('saves OpenCode credentials and clears the key after success', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <OpenCodeAgentSettings available={false} />
      </QueryClientProvider>,
    )
    fireEvent.change(screen.getByLabelText('modelProvider'), {
      target: { value: 'openai' },
    })
    const input = screen.getByLabelText('API Key')
    expect(input).toHaveAttribute('type', 'password')
    fireEvent.change(input, { target: { value: 'test-key' } })
    fireEvent.click(screen.getByRole('button', { name: 'saveCredentials' }))
    await waitFor(() => expect(save).toHaveBeenCalledWith('test-key', 'openai'))
    await waitFor(() => expect(input).toHaveValue(''))
  })
})
