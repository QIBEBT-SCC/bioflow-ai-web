import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { CodingAgentSettingsPanel } from '@/components/settings/coding-agent-settings'

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  translate: (key: string) => key,
}))
vi.mock('next-intl', () => ({ useTranslations: () => mocks.translate }))
vi.mock('@/hooks/use-code-agent', () => ({
  useCodingAgentSettings: () => ({
    data: {
      sandbox_mode: 'workspace-write',
      web_search: 'live',
      network_access: true,
    },
    isPending: false,
  }),
  useSaveCodingAgentSettings: () => ({ mutate: mocks.save, isPending: false }),
}))
afterEach(cleanup)
it('loads native defaults and saves the edited global settings', () => {
  render(<CodingAgentSettingsPanel />)
  expect(screen.getByRole('combobox', { name: 'sandbox' })).toHaveValue(
    'workspace-write',
  )
  fireEvent.change(screen.getByRole('combobox', { name: 'webSearch' }), {
    target: { value: 'disabled' },
  })
  fireEvent.click(screen.getByRole('switch', { name: 'commandNetwork' }))
  fireEvent.click(screen.getByRole('button', { name: 'saveSettings' }))
  expect(mocks.save).toHaveBeenCalledWith(
    {
      sandbox_mode: 'workspace-write',
      web_search: 'disabled',
      network_access: false,
    },
    expect.any(Object),
  )
})
