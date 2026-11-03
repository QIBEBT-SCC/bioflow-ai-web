import type { FileMount } from '@/types/tool'

export function getFileMountType(
  file: FileMount,
): FileMount['file_type'] | 'INPUT_TEXT' {
  return file.file_type === 'INPUT' && file.file_path.startsWith('value:')
    ? 'INPUT_TEXT'
    : file.file_type
}

export function updateFileMountValue(
  file: FileMount,
  field: keyof FileMount,
  value: string | boolean,
): FileMount {
  if (field === 'file_type' && value === 'INPUT_TEXT') {
    return {
      ...file,
      file_type: 'INPUT',
      file_path: file.name ? `value:{${file.name}}` : 'value:',
      mount_path: '',
      is_report: false,
      is_log: false,
    }
  }

  const updatedFile = { ...file, [field]: value }
  const isTextInput = getFileMountType(file) === 'INPUT_TEXT'

  if (
    field === 'name' &&
    typeof value === 'string' &&
    file.file_type === 'INPUT'
  ) {
    const prefix = isTextInput ? 'value:' : ''
    const previousGeneratedPath = `${prefix}${file.name ? `{${file.name}}` : ''}`
    if (!file.file_path || file.file_path === previousGeneratedPath) {
      updatedFile.file_path = `${prefix}${value ? `{${value}}` : ''}`
    }
  }

  if (field === 'file_type' && value === 'INPUT') {
    updatedFile.file_path = file.name ? `{${file.name}}` : ''
    updatedFile.is_report = false
    updatedFile.is_log = false
    if (isTextInput) updatedFile.mount_path = '/data/input'
  }

  if (field === 'file_type' && value === 'OUTPUT' && isTextInput) {
    updatedFile.file_path = ''
  }

  if (field === 'file_type' && value === 'OUTPUT' && !file.mount_path.trim()) {
    updatedFile.mount_path = '/data/output'
  }

  return updatedFile
}
