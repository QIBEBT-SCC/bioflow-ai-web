import { type FileMount, ToolType } from '@/types/tool'

const PASSTHROUGH = 'passthrough:'

export const isPassthrough = (file: FileMount) =>
  file.file_path.startsWith(PASSTHROUGH)

const stripPassthrough = (file: FileMount) =>
  isPassthrough(file)
    ? { ...file, file_path: file.file_path.slice(PASSTHROUGH.length) }
    : file

export function getFileMountType(
  file: FileMount,
): FileMount['file_type'] | 'INPUT_TEXT' | 'INPUT_PASSTHROUGH' {
  if (isPassthrough(file)) return 'INPUT_PASSTHROUGH'
  return file.file_type === 'INPUT' && file.file_path.startsWith('value:')
    ? 'INPUT_TEXT'
    : file.file_type
}

export function updateFileMountValue(
  file: FileMount,
  field: keyof FileMount,
  value: string | boolean,
): FileMount {
  if (field === 'file_type' && value === 'INPUT_PASSTHROUGH') {
    return {
      ...file,
      file_type: 'INPUT',
      file_path: `${PASSTHROUGH}${file.name ? `{${file.name}}` : ''}`,
      mount_path:
        file.file_type === 'INPUT' && file.mount_path
          ? file.mount_path
          : '/data/input',
      is_report: false,
      is_log: false,
    }
  }
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
    const prefix = isTextInput
      ? 'value:'
      : isPassthrough(file)
        ? PASSTHROUGH
        : ''
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

  return field === 'file_type' && value === 'OUTPUT'
    ? stripPassthrough(updatedFile)
    : updatedFile
}

/** Apply one tool config field; leaving pass-through mode turns pass-through inputs into ordinary ones. */
export function withToolConfigField<
  T extends { tool_type: ToolType; file_mounts: FileMount[] },
>(config: T, field: keyof T, value: unknown): T {
  const next = { ...config, [field]: value } as T
  if (field === 'tool_type' && value === ToolType.DOCKER)
    next.file_mounts = next.file_mounts.map(stripPassthrough)
  return next
}
