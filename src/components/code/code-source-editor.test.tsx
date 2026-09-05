import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CodeSourceEditor } from '@/components/code/code-source-editor'

const mocks = vi.hoisted(() => ({
  editorProps: undefined as Record<string, unknown> | undefined,
  unifiedMergeView: vi.fn(() => ['merge-extension']),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@codemirror/merge', () => ({
  unifiedMergeView: mocks.unifiedMergeView,
}))

vi.mock('@uiw/react-codemirror', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.editorProps = props
    return <div data-testid='code-mirror' />
  },
}))

describe('CodeSourceEditor proposal review', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    mocks.editorProps = undefined
  })

  it('renders the proposed source as a read-only unified diff', () => {
    render(
      <CodeSourceEditor
        nodeType='code_python'
        code={'print("before")\n'}
        dependencies={['polars']}
        review={{
          code: 'print("after")\n',
          dependencies: ['pandas'],
        }}
        onCodeChange={vi.fn()}
        onDependenciesChange={vi.fn()}
      />,
    )

    expect(mocks.unifiedMergeView).toHaveBeenCalledWith(
      expect.objectContaining({
        original: 'print("before")\n',
        mergeControls: false,
        highlightChanges: true,
      }),
    )
    expect(mocks.editorProps).toEqual(
      expect.objectContaining({
        value: 'print("after")\n',
        editable: false,
      }),
    )
    expect(screen.getByText('reviewingChanges')).toBeInTheDocument()
    expect(screen.getByText('pandas')).toHaveTextContent('pandas')
    expect(screen.getByText('polars')).toHaveClass('line-through')
  })
})
