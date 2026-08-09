'use client'

import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import {
  type AgentScope,
  cancelAgentRun,
  createAgentRun,
  createAgentSession,
  deleteAgentSession,
  getAgentEvents,
  getAgentMessages,
  getAgentRun,
  getAgentSession,
  getAgentSessionRuns,
  getAgentSessions,
  resumeAgentRun,
  retryAgentRun,
  streamAgentEvents,
  updateAgentSession,
} from '@/app/actions/agent'
import type {
  AgentEvent,
  AgentName,
  AgentRun,
  AgentSessionPage,
} from '@/types/agent'
import { STREAMING_AGENT_STATUSES } from '@/types/agent'

export const agentQueryKeys = {
  all: ['agent-sessions'] as const,
  session: (id: string) => ['agent-sessions', id] as const,
  messages: (id: string) => ['agent-sessions', id, 'messages'] as const,
  runs: (id: string) => ['agent-sessions', id, 'runs'] as const,
  run: (id: string) => ['agent-runs', id] as const,
  events: (id: string) => ['agent-runs', id, 'events'] as const,
}

export function useInfiniteAgentSessions(scope: AgentScope, limit = 8) {
  return useInfiniteQuery<AgentSessionPage>({
    queryKey: [...agentQueryKeys.all, 'infinite', scope, limit],
    queryFn: ({ pageParam }) =>
      getAgentSessions(scope, pageParam as string | null, limit),
    initialPageParam: null,
    getNextPageParam: (page) =>
      page.has_more ? (page.next_cursor ?? undefined) : undefined,
    staleTime: 30_000,
  })
}

export function useAgentSession(sessionId: string | null) {
  return useQuery({
    queryKey: agentQueryKeys.session(sessionId ?? ''),
    queryFn: () => getAgentSession(sessionId ?? ''),
    enabled: Boolean(sessionId),
    staleTime: 10_000,
  })
}

export function useAgentMessages(sessionId: string | null) {
  return useQuery({
    queryKey: agentQueryKeys.messages(sessionId ?? ''),
    queryFn: () => getAgentMessages(sessionId ?? ''),
    enabled: Boolean(sessionId),
    staleTime: 10_000,
  })
}

export function useAgentSessionRuns(sessionId: string | null) {
  return useQuery({
    queryKey: agentQueryKeys.runs(sessionId ?? ''),
    queryFn: () => getAgentSessionRuns(sessionId ?? ''),
    enabled: Boolean(sessionId),
    staleTime: 2_000,
  })
}

export function useAgentRunEventHistory(runs: AgentRun[]) {
  const queries = useQueries({
    queries: runs.map((run) => ({
      queryKey: agentQueryKeys.events(run.uid),
      queryFn: () => getAgentEvents(run.uid),
      staleTime: STREAMING_AGENT_STATUSES.includes(run.status)
        ? 1_000
        : Number.POSITIVE_INFINITY,
    })),
  })

  return Object.fromEntries(
    runs.map((run, index) => [run.uid, queries[index]?.data ?? []]),
  ) as Record<string, AgentEvent[]>
}

export function useAgentRun(runId: string | null) {
  return useQuery({
    queryKey: agentQueryKeys.run(runId ?? ''),
    queryFn: () => getAgentRun(runId ?? ''),
    enabled: Boolean(runId),
    staleTime: 2_000,
    refetchInterval: (query) => {
      const run = query.state.data as AgentRun | undefined
      return run && STREAMING_AGENT_STATUSES.includes(run.status)
        ? 5_000
        : false
    },
  })
}

function invalidateResource(
  queryClient: ReturnType<typeof useQueryClient>,
  event: AgentEvent,
) {
  const projectId = String(event.payload.project_id ?? '')
  switch (event.payload.resource) {
    case 'workflow':
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'workflows'],
      })
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      queryClient.invalidateQueries({
        queryKey: ['workflow', String(event.payload.uid ?? '')],
      })
      break
    case 'sample':
      queryClient.invalidateQueries({ queryKey: ['samples', projectId] })
      break
    case 'project_file_mapping':
      queryClient.invalidateQueries({
        queryKey: ['projectFileMappings', projectId],
      })
      break
    case 'tool':
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      queryClient.invalidateQueries({ queryKey: ['groupTools'] })
      queryClient.invalidateQueries({ queryKey: ['searchTools'] })
      break
    case 'database':
      queryClient.invalidateQueries({ queryKey: ['databases'] })
      queryClient.invalidateQueries({
        queryKey: ['database', Number(event.payload.id)],
      })
      break
    default:
      break
  }
}

function mergeEvents(current: AgentEvent[], incoming: AgentEvent[]) {
  const byId = new Map(current.map((event) => [event.id, event]))
  for (const event of incoming) byId.set(event.id, event)
  return [...byId.values()].sort((a, b) => a.id - b.id)
}

export function useAgentRunEvents(
  runId: string | null,
  status?: AgentRun['status'],
) {
  const queryClient = useQueryClient()
  const [events, setEvents] = useState<AgentEvent[]>([])
  const cursorRef = useRef(0)

  useEffect(() => {
    setEvents([])
    cursorRef.current = 0
    if (!runId) return

    const controller = new AbortController()
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined

    const accept = (incoming: AgentEvent[]) => {
      if (incoming.length === 0) return
      cursorRef.current = Math.max(
        cursorRef.current,
        ...incoming.map((event) => event.id),
      )
      setEvents((current) => mergeEvents(current, incoming))
      queryClient.setQueryData<AgentEvent[]>(
        agentQueryKeys.events(runId),
        (current = []) => mergeEvents(current, incoming),
      )
      for (const event of incoming) {
        if (event.event_type === 'resource.changed') {
          invalidateResource(queryClient, event)
        }
      }
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.run(runId) })
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.all })
      if (
        incoming.some((event) =>
          [
            'run.completed',
            'run.failed',
            'run.cancelled',
            'run.interrupted',
          ].includes(event.event_type),
        )
      ) {
        queryClient.invalidateQueries({ queryKey: agentQueryKeys.all })
      }
    }

    const consumeStream = async () => {
      const response = await streamAgentEvents(
        runId,
        cursorRef.current,
        controller.signal,
      )
      const reader = response.body?.getReader()
      if (!reader) return
      const decoder = new TextDecoder()
      let buffer = ''
      while (!controller.signal.aborted) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const frames = buffer.split(/\r?\n\r?\n/)
        buffer = frames.pop() ?? ''
        for (const frame of frames) {
          const data = frame
            .split(/\r?\n/)
            .find((line) => line.startsWith('data: '))
            ?.slice(6)
          if (data) accept([JSON.parse(data) as AgentEvent])
        }
      }
    }

    const connect = async () => {
      try {
        accept(await getAgentEvents(runId, cursorRef.current))
        if (!status || STREAMING_AGENT_STATUSES.includes(status)) {
          await consumeStream()
        }
      } catch (error) {
        if (!controller.signal.aborted)
          console.error('Agent event stream failed', error)
      }
      if (
        !controller.signal.aborted &&
        (!status || STREAMING_AGENT_STATUSES.includes(status))
      ) {
        reconnectTimer = setTimeout(() => void connect(), 1_500)
      }
    }

    void connect()
    return () => {
      controller.abort()
      if (reconnectTimer) clearTimeout(reconnectTimer)
    }
  }, [queryClient, runId, status])

  return events
}

function useInvalidateAgentData() {
  const queryClient = useQueryClient()
  return (sessionId?: string, runId?: string) => {
    queryClient.invalidateQueries({ queryKey: agentQueryKeys.all })
    if (sessionId) {
      queryClient.invalidateQueries({
        queryKey: agentQueryKeys.session(sessionId),
      })
      queryClient.invalidateQueries({
        queryKey: agentQueryKeys.messages(sessionId),
      })
    }
    if (runId)
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.run(runId) })
  }
}

export function useCreateAgentSession() {
  const invalidate = useInvalidateAgentData()
  return useMutation({
    mutationFn: createAgentSession,
    onSuccess: () => invalidate(),
  })
}

export function useUpdateAgentSession() {
  const invalidate = useInvalidateAgentData()
  return useMutation({
    mutationFn: ({ sessionId, title }: { sessionId: string; title: string }) =>
      updateAgentSession(sessionId, title),
    onSuccess: (session) => invalidate(session.uid),
  })
}

export function useDeleteAgentSession() {
  const invalidate = useInvalidateAgentData()
  return useMutation({
    mutationFn: deleteAgentSession,
    onSuccess: () => invalidate(),
  })
}

export function useCreateAgentRun() {
  const invalidate = useInvalidateAgentData()
  return useMutation({
    mutationFn: ({
      sessionId,
      agentName,
      text,
    }: {
      sessionId: string
      agentName: AgentName
      text: string
    }) => createAgentRun(sessionId, agentName, text),
    onSuccess: (run) => invalidate(run.session_uid, run.uid),
  })
}

export function useResumeAgentRun() {
  const invalidate = useInvalidateAgentData()
  return useMutation({
    mutationFn: ({
      runId,
      approved,
      feedback,
    }: {
      runId: string
      approved: boolean
      feedback?: string
    }) => resumeAgentRun(runId, approved, feedback),
    onSuccess: (run) => invalidate(run.session_uid, run.uid),
  })
}

export function useCancelAgentRun() {
  const invalidate = useInvalidateAgentData()
  return useMutation({
    mutationFn: cancelAgentRun,
    onSuccess: (run) => invalidate(run.session_uid, run.uid),
  })
}

export function useRetryAgentRun() {
  const invalidate = useInvalidateAgentData()
  return useMutation({
    mutationFn: retryAgentRun,
    onSuccess: (run) => invalidate(run.session_uid, run.uid),
  })
}
