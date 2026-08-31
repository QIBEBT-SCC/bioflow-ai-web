import type { CodeNodeType } from '@/types/code'

export function codeLanguage(nodeType: CodeNodeType): 'bash' | 'python' | 'r' {
  if (nodeType === 'code_python') return 'python'
  if (nodeType === 'code_R') return 'r'
  return 'bash'
}
