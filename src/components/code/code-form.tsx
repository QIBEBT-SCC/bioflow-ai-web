'use client'

import { CodeWorkspaceForm } from '@/components/code/code-workspace-form'
import type { CodeInfo } from '@/types/code'

export function CodeForm({
  code,
  onSaved,
}: {
  code: CodeInfo
  onSaved: () => void
}) {
  return (
    <CodeWorkspaceForm mode='edit' code={code} onComplete={() => onSaved()} />
  )
}
