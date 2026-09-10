import type { FileMount } from '@/types/tool'

export function updateFileMountValue(
  file: FileMount,
  field: keyof FileMount,
  value: string | boolean,
): FileMount {
  const updatedFile = { ...file, [field]: value }

  if (
    field === 'name' &&
    typeof value === 'string' &&
    file.file_type === 'INPUT'
  ) {
    const previousGeneratedPath = file.name ? `{${file.name}}` : ''
    if (!file.file_path || file.file_path === previousGeneratedPath) {
      updatedFile.file_path = value ? `{${value}}` : ''
    }
  }

  if (field === 'file_type' && value === 'OUTPUT' && !file.mount_path.trim()) {
    updatedFile.mount_path = '/data/output'
  }

  return updatedFile
}
