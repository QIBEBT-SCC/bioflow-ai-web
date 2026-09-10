import { describe, expect, it } from 'vitest'
import { updateFileMountValue } from '@/lib/tool-file-mount'
import type { FileMount } from '@/types/tool'

const inputFile: FileMount = {
  name: '',
  description: '',
  file_path: '',
  file_type: 'INPUT',
  is_report: false,
  is_log: false,
  mount_path: '',
}

describe('updateFileMountValue', () => {
  it('generates and keeps an input file path in sync with its name', () => {
    const namedFile = updateFileMountValue(inputFile, 'name', 'r1')
    expect(namedFile.file_path).toBe('{r1}')

    expect(updateFileMountValue(namedFile, 'name', 'read_1').file_path).toBe(
      '{read_1}',
    )
  })

  it('preserves an input file path that the user customized', () => {
    const customizedFile = { ...inputFile, name: 'r1', file_path: 'value:{r1}' }

    expect(
      updateFileMountValue(customizedFile, 'name', 'read_1').file_path,
    ).toBe('value:{r1}')
  })

  it('defaults an empty output mount path without replacing a custom path', () => {
    expect(
      updateFileMountValue(inputFile, 'file_type', 'OUTPUT').mount_path,
    ).toBe('/data/output')
    expect(
      updateFileMountValue(
        { ...inputFile, mount_path: '/data/custom' },
        'file_type',
        'OUTPUT',
      ).mount_path,
    ).toBe('/data/custom')
  })
})
