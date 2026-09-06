'use client'

import type { ReactNode } from 'react'
import { CodeWorkspaceForm } from '@/components/code/code-workspace-form'
import type { CodeNodeType } from '@/types/code'

export function CodeCreateForm({
  nodeType,
  onCreated,
  children,
}: {
  nodeType: CodeNodeType
  onCreated: (uid: string) => void
  children?: ReactNode
}) {
  return (
    <CodeWorkspaceForm mode='create' nodeType={nodeType} onComplete={onCreated}>
      {children}
    </CodeWorkspaceForm>
  )
}
