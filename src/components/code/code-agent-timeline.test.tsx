import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { CodeAgentTimeline } from '@/components/code/code-agent-timeline'

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
afterEach(cleanup)

it('uses a fixed terminal icon even while a command is running', () => {
  const { container } = render(
    <CodeAgentTimeline
      items={[
        {
          id: 'command',
          type: 'activity',
          activity: {
            callId: 'command',
            title: 'Inspect files',
            kind: 'execute',
            status: 'in_progress',
            statusProvided: true,
            locations: [],
            command: 'ls',
          },
        },
      ]}
    />,
  )
  expect(container.querySelector('.lucide-square-terminal')).toBeInTheDocument()
  expect(container.querySelector('.animate-spin')).not.toBeInTheDocument()
})

it('groups consecutive steps and keeps ordinary messages outside the fold', () => {
  render(
    <CodeAgentTimeline
      items={[
        { id: 'user', type: 'message', role: 'user', text: 'Please fix it' },
        {
          id: 'thought1',
          type: 'thought',
          text: 'Inspecting the script',
          active: false,
        },
        {
          id: 'plan',
          type: 'plan',
          payload: {
            entries: [{ content: 'Check syntax', status: 'completed' }],
          },
          active: false,
        },
        {
          id: 'thought2',
          type: 'thought',
          text: 'Applying changes',
          active: false,
        },
        {
          id: 'reply',
          type: 'message',
          role: 'assistant',
          text: 'Changes applied',
        },
        {
          id: 'thought3',
          type: 'thought',
          text: 'Verifying results',
          active: false,
        },
      ]}
    />,
  )
  const groups = screen.getAllByRole('button', { name: 'taskDetails' })
  expect(groups).toHaveLength(2)
  expect(screen.getByText('Please fix it')).toBeVisible()
  expect(screen.getByText('Changes applied')).toBeVisible()
  expect(screen.queryByText('Inspecting the script')).not.toBeInTheDocument()
  fireEvent.click(groups[0])
  expect(screen.getByText('Inspecting the script')).toBeVisible()
  expect(screen.getByText('Check syntax')).toBeVisible()
  expect(screen.getByText('Applying changes')).toBeVisible()
  expect(screen.queryByText('Verifying results')).not.toBeInTheDocument()
})

it('collapses on completion and preserves a manual choice across updates', () => {
  const items = [
    {
      id: 'thought',
      type: 'thought' as const,
      text: 'Inspecting',
      active: true,
    },
  ]
  const { rerender } = render(<CodeAgentTimeline items={items} />)
  expect(screen.getByRole('button', { name: 'taskRunning' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  rerender(<CodeAgentTimeline items={[{ ...items[0], active: false }]} />)
  expect(screen.getByRole('button', { name: 'taskDetails' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  fireEvent.click(screen.getByRole('button', { name: 'taskDetails' }))
  rerender(
    <CodeAgentTimeline
      items={[{ ...items[0], active: false, text: 'Finished inspecting' }]}
    />,
  )
  expect(screen.getByRole('button', { name: 'taskDetails' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
})
