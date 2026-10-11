'use client'

import { useEffect, useRef, useState } from 'react'
import type { AgentWorkflowNodePart } from '@/types/agent'

/** Owned by the run page, so closing the chat does not discard the node draft. */
export function useWorkflowNodeAttachment(sessionId: string | null) {
  const [draft, setDraft] = useState<AgentWorkflowNodePart | null>(null)
  const sessionScope = useRef(sessionId)

  useEffect(() => {
    if (sessionScope.current !== sessionId) {
      sessionScope.current = sessionId
      setDraft(null)
    }
  }, [sessionId])

  const adoptFirstSession = (id: string) => {
    if (sessionScope.current === null) sessionScope.current = id
  }

  const clear = (sent?: AgentWorkflowNodePart) => {
    setDraft((current) => (!sent || current === sent ? null : current))
  }

  return {
    node: sessionScope.current === sessionId ? draft : null,
    add: setDraft,
    clear,
    adoptFirstSession,
  }
}
