import type { CodeNodeType } from '@/types/code'

export function codeLanguage(nodeType: CodeNodeType): 'bash' | 'python' {
  return nodeType === 'code_python' ? 'python' : 'bash'
}
