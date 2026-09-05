'use client'

import type { ReactNode } from 'react'
import { CodeWorkspaceForm } from '@/components/code/code-workspace-form'
import type { CodeInfo } from '@/types/code'

export function CodeForm({
  code,
  onSaved,
  children,
}: {
  code: CodeInfo
  onSaved: () => void
  children?: ReactNode
}) {
  return (
    <CodeWorkspaceForm mode='edit' code={code} onComplete={() => onSaved()}>
      {children}
    </CodeWorkspaceForm>
  )
}
