'use client'

import { CodeWorkspaceForm } from '@/components/code/code-workspace-form'
import type { CodeNodeType } from '@/types/code'

export function CodeCreateForm({
  nodeType,
  onCreated,
}: {
  nodeType: CodeNodeType
  onCreated: (uid: string) => void
}) {
  return (
    <CodeWorkspaceForm
      mode='create'
      nodeType={nodeType}
      onComplete={onCreated}
    />
  )
}
