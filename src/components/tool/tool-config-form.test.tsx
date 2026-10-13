import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ToolConfigForm,
  type ToolConfigValues,
} from '@/components/tool/tool-config-form'
import { updateFileMountValue } from '@/lib/tool-file-mount'
import type { FileMount } from '@/types/tool'
import messages from '../../../messages/en/tool.json'

vi.mock('@/hooks/use-tool', () => ({
  useRunInImage: () => ({ mutate: vi.fn(), isPending: false }),
}))

afterEach(cleanup)

function fileMount(
  name: string,
  fileType: FileMount['file_type'] = 'INPUT',
  filePath = `{${name}}`,
): FileMount {
  return {
    name,
    file_type: fileType,
    file_path: filePath,
    mount_path: fileType === 'INPUT' ? '/data/raw' : '/data/output',
    is_log: false,
    is_report: false,
  }
}

function Form({
  mounts = [
    fileMount('fasta'),
    fileMount('predict_pdb', 'OUTPUT', '{output_dir}/{fasta.stem}.pdb'),
  ],
}: {
  mounts?: FileMount[]
}) {
  const [value, setValue] = useState<ToolConfigValues>({
    name: 'Predict',
    description: '',
    image_uid: '',
    help_command: '',
    group_id: 0,
    tags: [],
    command_template: '',
    dynamic_params: [],
    immutable_static_params: '',
    modifiable_static_params: '',
    file_mounts: mounts,
  })

  return (
    <NextIntlClientProvider locale='en' messages={messages}>
      <ToolConfigForm
        value={value}
        toolGroups={[]}
        initialTab='files'
        onFieldChange={(field, nextValue) =>
          setValue((previous) => ({ ...previous, [field]: nextValue }))
        }
        onUpdateFileMount={(index, field, nextValue) =>
          setValue((previous) => ({
            ...previous,
            file_mounts: previous.file_mounts.map((file, fileIndex) =>
              fileIndex === index
                ? updateFileMountValue(file, field, nextValue)
                : file,
            ),
          }))
        }
        onAddDynamicParam={vi.fn()}
        onUpdateDynamicParam={vi.fn()}
        onRemoveDynamicParam={vi.fn()}
        onAddFileMount={vi.fn()}
        onRemoveFileMount={vi.fn()}
        onReorderDynamicParams={vi.fn()}
        onReorderFileMounts={vi.fn()}
      />
    </NextIntlClientProvider>
  )
}

function outputField(): HTMLInputElement {
  return screen.getAllByLabelText(/File Path/).at(-1) as HTMLInputElement
}

describe('output file path property completion', () => {
  it('offers exactly the three input properties after typing a dot', () => {
    render(<Form />)
    const field = outputField()
    fireEvent.change(field, { target: { value: '{output_dir}/{fasta.' } })

    expect(
      screen
        .getAllByRole('option')
        .map((option) => option.querySelector('code')?.textContent),
    ).toEqual(['{fasta.name}', '{fasta.stem}', '{fasta.suffix}'])
    expect(
      screen.getByText('Input filename without its last extension'),
    ).toBeInTheDocument()
    expect(screen.getAllByLabelText(/File Path/)[0]).toHaveAttribute('readonly')
  })

  it.each([
    'Enter',
    'Tab',
  ])('inserts the chosen property with %s and preserves the file extension', (key) => {
    render(
      <Form
        mounts={[
          fileMount('fasta'),
          fileMount('result', 'OUTPUT', '{output_dir}/{fasta.st}.pdb'),
        ]}
      />,
    )
    const field = outputField()
    const cursor = field.value.indexOf('.st') + '.st'.length
    field.setSelectionRange(cursor, cursor)
    fireEvent.focus(field)

    expect(screen.getAllByRole('option')).toHaveLength(1)
    fireEvent.keyDown(field, { key })
    expect(field).toHaveValue('{output_dir}/{fasta.stem}.pdb')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('supports arrow navigation and mouse selection', () => {
    render(<Form />)
    const field = outputField()
    fireEvent.change(field, { target: { value: '{output_dir}/{fasta.' } })
    fireEvent.keyDown(field, { key: 'ArrowDown' })
    fireEvent.keyDown(field, { key: 'Enter' })
    expect(field).toHaveValue('{output_dir}/{fasta.stem}')

    fireEvent.change(field, { target: { value: '{output_dir}/{fasta.su' } })
    fireEvent.mouseDown(screen.getByRole('option'))
    expect(field).toHaveValue('{output_dir}/{fasta.suffix}')
  })

  it('excludes output, text, collection, and unnamed inputs from property candidates', () => {
    render(
      <Form
        mounts={[
          fileMount('fasta'),
          fileMount('text', 'INPUT', 'value:{text}'),
          fileMount('collection', 'INPUT', 'mountlist:collection.json'),
          fileMount(''),
          fileMount('result', 'OUTPUT', ''),
        ]}
      />,
    )
    fireEvent.change(outputField(), { target: { value: '{' } })
    const candidates = screen
      .getAllByRole('option')
      .map((option) => option.querySelector('code')?.textContent)
    expect(candidates).toEqual([
      '{output_dir}',
      '{sample_name}',
      '{fasta.name}',
      '{fasta.stem}',
      '{fasta.suffix}',
    ])
  })

  it('refreshes properties when the input handle is renamed', () => {
    render(<Form />)
    fireEvent.change(screen.getAllByLabelText(/File Name/)[0], {
      target: { value: 'protein' },
    })
    fireEvent.change(outputField(), {
      target: { value: '{output_dir}/{protein.' },
    })
    expect(
      screen
        .getAllByRole('option')
        .map((option) => option.querySelector('code')?.textContent),
    ).toEqual(['{protein.name}', '{protein.stem}', '{protein.suffix}'])
  })

  it('accepts supported properties and flags unsupported ones', () => {
    render(<Form />)
    const field = outputField()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.change(field, {
      target: { value: '{output_dir}/{fasta.parent}.pdb' },
    })
    expect(screen.getByRole('alert')).toHaveTextContent('{fasta.parent}')
    fireEvent.change(field, {
      target: { value: '{output_dir}/{sample_name}.pdb' },
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
