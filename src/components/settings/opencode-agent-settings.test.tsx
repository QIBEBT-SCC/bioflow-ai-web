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

const save = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    configured: true,
    model_provider: 'openai',
    base_url: null,
    model_id: null,
  }),
)
const getSettings = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    configured: false,
    model_provider: 'opencode-go',
    base_url: null,
    model_id: null,
  }),
)
vi.mock('@/app/actions/code-agent', () => ({
  getOpenCodeAgentSettings: getSettings,
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
    const providerSelect = await screen.findByLabelText('modelProvider')
    expect(providerSelect).toHaveTextContent('OpenCode Go')
    fireEvent.click(providerSelect)
    fireEvent.click(screen.getByRole('option', { name: 'OpenAI' }))
    const input = screen.getByLabelText('API Key')
    expect(input).toHaveAttribute('type', 'password')
    fireEvent.change(input, { target: { value: 'test-key' } })
    fireEvent.click(screen.getByRole('button', { name: 'saveCredentials' }))
    await waitFor(() =>
      expect(save.mock.calls.at(-1)?.[0]).toEqual({
        api_key: 'test-key',
        model_provider: 'openai',
      }),
    )
    await waitFor(() =>
      expect(screen.getByText('connected')).toBeInTheDocument(),
    )
    expect(screen.getByText('configuredProvider')).toBeInTheDocument()
    expect(screen.getByText('OpenAI')).toBeInTheDocument()
    expect(screen.queryByLabelText('API Key')).not.toBeInTheDocument()
  })

  it('shows endpoint fields only for a custom provider', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <OpenCodeAgentSettings available={false} />
      </QueryClientProvider>,
    )

    expect(screen.queryByLabelText('customBaseUrl')).not.toBeInTheDocument()
    const providerSelect = await screen.findByLabelText('modelProvider')
    fireEvent.click(providerSelect)
    fireEvent.click(screen.getByRole('option', { name: 'customProvider' }))

    fireEvent.change(screen.getByLabelText('customBaseUrl'), {
      target: { value: 'https://api.example.com/v1' },
    })
    fireEvent.change(screen.getByLabelText('customModelId'), {
      target: { value: 'example-model' },
    })
    fireEvent.change(screen.getByLabelText('API Key'), {
      target: { value: 'custom-key' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'saveCredentials' }))

    await waitFor(() =>
      expect(save.mock.calls.at(-1)?.[0]).toEqual({
        api_key: 'custom-key',
        model_provider: 'custom',
        base_url: 'https://api.example.com/v1',
        model_id: 'example-model',
      }),
    )
  })

  it('renders the saved provider settings returned by the backend', async () => {
    getSettings.mockResolvedValueOnce({
      configured: true,
      model_provider: 'custom',
      base_url: 'https://saved.example.com/v1',
      model_id: 'saved-model',
    })

    render(
      <QueryClientProvider client={new QueryClient()}>
        <OpenCodeAgentSettings available={false} />
      </QueryClientProvider>,
    )

    await waitFor(() =>
      expect(screen.getByText('connected')).toBeInTheDocument(),
    )
    expect(screen.getByText('customProvider')).toBeInTheDocument()
    expect(screen.getByText('https://saved.example.com/v1')).toBeInTheDocument()
    expect(screen.getByText('saved-model')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'updateCredentials' }),
    ).toBeEnabled()
  })
})
