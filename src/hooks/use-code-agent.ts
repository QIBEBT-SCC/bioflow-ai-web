'use client'

import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { useEffect, useRef, useState } from 'react'
import {
  closeCodingSession,
  createCodingSession,
  decideCodingProposal,
  getCodingAvailability,
  getCodingSession,
  sendCodingTurn,
  stopCodingTurn,
  streamCodingEvents,
} from '@/app/actions/code-agent'
import { ClientApiError } from '@/lib/api-client'
import { codingEventState, codingSnapshotState } from '@/lib/code-agent-state'
import type { CodeNodeType } from '@/types/code'
import type {
  CodeAgentAvailability,
  CodeAgentBaseline,
  CodeAgentProposal,
  CodeAgentSession,
} from '@/types/code-agent'

export async function codeBaselineHash(
  nodeType: CodeNodeType,
  baseline: CodeAgentBaseline,
) {
  const content = `${nodeType}\0${baseline.source}\0${JSON.stringify(baseline.dependencies)}`
  // Also works on local HTTP deployments where Web Crypto is unavailable.
  return bytesToHex(sha256(new TextEncoder().encode(content)))
}

interface Options extends CodeAgentBaseline {
  enabled: boolean
  nodeType: CodeNodeType
  onApply: (proposal: CodeAgentProposal) => void
}
interface Lifecycle {
  disposed: boolean
  id?: string
  controller: AbortController
}

export function useCodeAgent({
  enabled,
  nodeType,
  source,
  dependencies,
  onApply,
}: Options) {
  const [session, setSession] = useState<CodeAgentSession | null>(null)
  const [availability, setAvailability] =
    useState<CodeAgentAvailability | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [connected, setConnected] = useState(false)
  const lifecycle = useRef<Lifecycle | null>(null)
  const operation = useRef(false)
  const latest = useRef({ source, dependencies, onApply })
  latest.current = { source, dependencies, onApply }

  useEffect(() => {
    if (!enabled) return
    const life: Lifecycle = {
      disposed: false,
      controller: new AbortController(),
    }
    lifecycle.current = life
    const snapshot = (value: CodeAgentSession) => {
      if (!life.disposed)
        setSession((previous) => codingSnapshotState(previous, value))
    }
    const disconnect = () => {
      life.disposed = true
      life.controller.abort()
      if (life.id) void closeCodingSession(life.id).catch(() => {})
    }
    const start = async () => {
      setSession(null)
      setAvailability(null)
      setError(null)
      setWorking(false)
      setConnected(false)
      operation.current = false
      try {
        const configured = await getCodingAvailability()
        if (life.disposed) return
        setAvailability(configured)
        const created = await createCodingSession(nodeType)
        life.id = created.id
        if (life.disposed) {
          await closeCodingSession(created.id)
          return
        }
        snapshot(created)
        let cursor = created.last_event_id
        while (!life.disposed) {
          try {
            // A snapshot covers tool outputs and deltas missed during disconnection.
            const recovered = await getCodingSession(created.id)
            if (life.disposed) return
            snapshot(recovered)
            cursor = recovered.last_event_id
            if (recovered.status === 'closed') return
            setConnected(true)
            await streamCodingEvents(
              created.id,
              cursor,
              life.controller.signal,
              (event) => {
                if (life.disposed) return
                cursor = event.id || cursor
                setSession((previous) =>
                  previous ? codingEventState(previous, event) : previous,
                )
                if (event.type === 'session.closed') life.controller.abort()
              },
            )
            if (life.controller.signal.aborted) return
          } catch (cause) {
            if (life.disposed || life.controller.signal.aborted) return
            if (cause instanceof ClientApiError && cause.status === 404) {
              setSession((previous) =>
                previous
                  ? { ...previous, status: 'closed', proposal: null }
                  : previous,
              )
              setError(cause.message)
              return
            }
          }
          setConnected(false)
          await new Promise<void>((resolve) => {
            const finish = () => {
              clearTimeout(timer)
              life.controller.signal.removeEventListener('abort', finish)
              resolve()
            }
            const timer = setTimeout(finish, 1000)
            life.controller.signal.addEventListener('abort', finish, {
              once: true,
            })
            if (life.controller.signal.aborted) finish()
          })
        }
      } catch (cause) {
        if (!life.disposed)
          setError(cause instanceof Error ? cause.message : String(cause))
      }
    }
    // React Strict Mode's discarded effect must not create/close a real session.
    const timer = setTimeout(() => {
      void start()
    }, 0)
    window.addEventListener('pagehide', disconnect)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('pagehide', disconnect)
      disconnect()
    }
  }, [enabled, nodeType])

  const perform = async (action: (life: Lifecycle) => Promise<unknown>) => {
    const life = lifecycle.current
    if (!life || life.disposed || !life.id || operation.current) return false
    operation.current = true
    setWorking(true)
    setError(null)
    try {
      return (await action(life)) !== false
    } catch (cause) {
      if (!life.disposed)
        setError(cause instanceof Error ? cause.message : String(cause))
      return false
    } finally {
      if (!life.disposed) {
        operation.current = false
        setWorking(false)
      }
    }
  }
  const update = (life: Lifecycle, value: CodeAgentSession) => {
    if (!life.disposed)
      setSession((previous) => codingSnapshotState(previous, value))
  }
  const send = (prompt: string, language: 'zh' | 'en') =>
    perform(async (life) => {
      if (session?.status !== 'ready' || !prompt.trim()) return false
      const configured = await getCodingAvailability()
      if (life.disposed) return
      setAvailability(configured)
      if (!configured.available) return false
      const { source: currentSource, dependencies: currentDeps } =
        latest.current
      update(
        life,
        await sendCodingTurn(
          life.id as string,
          { source: currentSource, dependencies: [...currentDeps] },
          prompt,
          language,
        ),
      )
    })
  const stop = () =>
    perform(async (life) => {
      update(life, await stopCodingTurn(life.id as string))
    })
  const decide = (decision: 'accept' | 'reject') =>
    perform(async (life) => {
      const proposal = session?.proposal
      if (!proposal) return
      const baseline = {
        source: latest.current.source,
        dependencies: [...latest.current.dependencies],
      }
      if (
        decision === 'accept' &&
        (await codeBaselineHash(nodeType, baseline)) !== proposal.baseline_hash
      ) {
        throw new Error('EDITOR_CHANGED')
      }
      if (life.disposed) return
      const result = await decideCodingProposal(
        life.id as string,
        proposal.id,
        decision,
        baseline,
      )
      if (life.disposed) return
      if (decision === 'accept') {
        if (
          latest.current.source !== baseline.source ||
          JSON.stringify(latest.current.dependencies) !==
            JSON.stringify(baseline.dependencies)
        )
          throw new Error('EDITOR_CHANGED')
        latest.current.onApply(proposal)
      }
      update(life, result)
    })
  const locked =
    enabled &&
    (working ||
      (!!session &&
        ['queued', 'running', 'cancelling', 'proposal'].includes(
          session.status,
        )))
  return {
    session: enabled ? session : null,
    availability,
    error,
    working,
    connected,
    locked,
    send,
    stop,
    decide,
  }
}
