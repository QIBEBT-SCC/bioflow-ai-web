'use client'

import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
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
  submitAgentInput,
  updateAgentSession,
} from '@/app/actions/agent'
import { agentArtifactQueryKeys } from '@/hooks/use-agent-artifact'
import type { Locale } from '@/i18n/config'
import { ClientApiError } from '@/lib/api-client'
import type {
  AgentEvent,
  AgentEventType,
  AgentImagePart,
  AgentMessage,
  AgentName,
  AgentPDFPart,
  AgentRun,
  AgentSessionPage,
  AgentStatus,
  AgentWorkflowNodeReference,
} from '@/types/agent'

export const agentQueryKeys = {
  all: ['agent-sessions'] as const,
  lists: () => ['agent-sessions', 'list'] as const,
  list: (scope: AgentScope, limit: number) =>
    ['agent-sessions', 'list', scope, limit] as const,
  session: (id: string) => ['agent-sessions', 'detail', id] as const,
  messages: (id: string) =>
    ['agent-sessions', 'detail', id, 'messages'] as const,
  runs: (id: string) => ['agent-sessions', 'detail', id, 'runs'] as const,
  run: (id: string) => ['agent-runs', id] as const,
  events: (id: string) => ['agent-runs', id, 'events'] as const,
}

export function useInfiniteAgentSessions(scope: AgentScope, limit = 8) {
  return useInfiniteQuery<AgentSessionPage>({
    queryKey: agentQueryKeys.list(scope, limit),
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
    staleTime: 10_000,
  })
}

export function useAgentRunEventHistory(
  runs: AgentRun[],
  streamingRunId: string | null = null,
) {
  const queries = useQueries({
    queries: runs.map((run) => ({
      queryKey: agentQueryKeys.events(run.uid),
      queryFn: () => getAgentEvents(run.uid),
      enabled: run.uid !== streamingRunId,
      staleTime: Number.POSITIVE_INFINITY,
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
    staleTime: 10_000,
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

const EVENT_TO_RUN_STATUS: Partial<Record<AgentEventType, AgentStatus>> = {
  'run.queued': 'queued',
  'run.started': 'running',
  'run.cancel_requested': 'cancel_requested',
  'run.interrupted': 'waiting_input',
  'run.completed': 'completed',
  'run.failed': 'failed',
  'run.cancelled': 'cancelled',
}

const STREAM_END_EVENT_TYPES = new Set<AgentEventType>([
  'run.completed',
  'run.failed',
  'run.cancelled',
  'run.interrupted',
])

function scheduleAgentReconnect(callback: () => void, delayMs: number) {
  const timer = setTimeout(callback, delayMs)
  return () => clearTimeout(timer)
}

export function useAgentRunEvents({
  runId,
  sessionId,
  projectId,
}: {
  runId: string | null
  sessionId: string | null
  projectId?: number | null
}) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!runId) return undefined

    const controller = new AbortController()
    let cancelReconnect: () => void = () => undefined
    const cachedEvents =
      queryClient.getQueryData<AgentEvent[]>(agentQueryKeys.events(runId)) ?? []
    let cursor =
      cachedEvents.length > 0
        ? Math.max(...cachedEvents.map((event) => event.id))
        : 0
    let hasSettled = false
    let retryDelayMs = 1_500

    const accept = (incoming: AgentEvent[]) => {
      const fresh = incoming.filter((event) => event.id > cursor)
      if (fresh.length === 0) return

      cursor = Math.max(cursor, ...fresh.map((event) => event.id))
      retryDelayMs = 1_500
      queryClient.setQueryData<AgentEvent[]>(
        agentQueryKeys.events(runId),
        (current = []) => mergeEvents(current, fresh),
      )

      for (const event of fresh) {
        if (
          event.event_type === 'run.progress' &&
          event.payload.kind === 'error' &&
          typeof event.payload.message === 'string'
        ) {
          toast.error(event.payload.message, { id: `${runId}:${event.id}` })
        }
        if (event.event_type === 'resource.changed') {
          invalidateResource(queryClient, event)
        }
        if (
          event.event_type === 'run.progress' &&
          event.payload.kind === 'workflow_manager_action' &&
          event.payload.manager === 'subgraph' &&
          event.payload.action === 'create' &&
          event.payload.status === 'completed'
        ) {
          queryClient.invalidateQueries({ queryKey: ['workflows'] })
        }
      }

      if (sessionId) {
        const queuedMessageIds = fresh
          .filter(
            (event) =>
              event.event_type === 'run.input_queued' &&
              typeof event.payload.message_uid === 'string',
          )
          .map((event) => event.payload.message_uid as string)
        if (queuedMessageIds.length > 0) {
          const cachedMessages =
            queryClient.getQueryData<AgentMessage[]>(
              agentQueryKeys.messages(sessionId),
            ) ?? []
          const knownIds = new Set(cachedMessages.map((message) => message.uid))
          if (queuedMessageIds.some((id) => !knownIds.has(id))) {
            queryClient.invalidateQueries({
              queryKey: agentQueryKeys.messages(sessionId),
            })
          }
        }
      }

      const latestStatusEvent = fresh.findLast(
        (event) => event.event_type in EVENT_TO_RUN_STATUS,
      )
      const sawStreamEnd = fresh.some((event) =>
        STREAM_END_EVENT_TYPES.has(event.event_type),
      )
      if (sawStreamEnd) hasSettled = true

      const cachedRun = queryClient.getQueryData<AgentRun>(
        agentQueryKeys.run(runId),
      )
      const statusChanged =
        latestStatusEvent !== undefined &&
        EVENT_TO_RUN_STATUS[latestStatusEvent.event_type] !== cachedRun?.status

      if (statusChanged || sawStreamEnd) {
        queryClient.invalidateQueries({ queryKey: agentQueryKeys.run(runId) })
        if (sessionId) {
          queryClient.invalidateQueries({
            queryKey: agentQueryKeys.runs(sessionId),
          })
          queryClient.invalidateQueries({
            queryKey: agentQueryKeys.session(sessionId),
          })
        }
      }

      if (sawStreamEnd) {
        if (sessionId) {
          queryClient.invalidateQueries({
            queryKey: agentQueryKeys.messages(sessionId),
          })
        }
        queryClient.invalidateQueries({ queryKey: agentQueryKeys.lists() })
        queryClient.invalidateQueries({
          queryKey: agentArtifactQueryKeys.run(runId),
        })
        if (projectId !== null && projectId !== undefined) {
          queryClient.invalidateQueries({
            queryKey: agentArtifactQueryKeys.project(String(projectId)),
          })
        }
      }
    }

    const connect = async () => {
      try {
        const response = await streamAgentEvents(
          runId,
          cursor,
          controller.signal,
        )
        const reader = response.body?.getReader()
        if (reader) {
          const decoder = new TextDecoder()
          let buffer = ''
          while (!controller.signal.aborted) {
            const { value, done } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const frames = buffer.split(/\r?\n\r?\n/)
            buffer = frames.pop() ?? ''
            const parsed: AgentEvent[] = []
            for (const frame of frames) {
              const data = frame
                .split(/\r?\n/)
                .find((line) => line.startsWith('data: '))
                ?.slice(6)
              if (data) parsed.push(JSON.parse(data) as AgentEvent)
            }
            if (parsed.length > 0) accept(parsed)
          }
        }
      } catch (error) {
        if (controller.signal.aborted) return
        console.error('Agent event stream failed', error)
        if (
          error instanceof ClientApiError &&
          [401, 403, 404].includes(error.status)
        ) {
          return
        }
      }

      if (!controller.signal.aborted && !hasSettled) {
        queryClient.invalidateQueries({ queryKey: agentQueryKeys.run(runId) })
        const delay = retryDelayMs
        retryDelayMs = Math.min(10_000, retryDelayMs * 2)
        cancelReconnect()
        cancelReconnect = scheduleAgentReconnect(() => void connect(), delay)
      }
    }

    void connect()
    return () => {
      controller.abort()
      cancelReconnect()
      if (!hasSettled) {
        queryClient.invalidateQueries({
          queryKey: agentQueryKeys.events(runId),
          refetchType: 'none',
        })
      }
    }
  }, [projectId, queryClient, runId, sessionId])
}

function syncRunStarted(
  queryClient: ReturnType<typeof useQueryClient>,
  run: AgentRun,
) {
  queryClient.setQueryData(agentQueryKeys.run(run.uid), run)
  queryClient.invalidateQueries({ queryKey: agentQueryKeys.lists() })
  queryClient.invalidateQueries({
    queryKey: agentQueryKeys.session(run.session_uid),
  })
  queryClient.invalidateQueries({
    queryKey: agentQueryKeys.runs(run.session_uid),
  })
  queryClient.invalidateQueries({
    queryKey: agentQueryKeys.messages(run.session_uid),
  })
}

export function useCreateAgentSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAgentSession,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.lists() }),
  })
}

export function useUpdateAgentSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, title }: { sessionId: string; title: string }) =>
      updateAgentSession(sessionId, title),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: agentQueryKeys.session(session.uid),
      })
    },
  })
}

export function useDeleteAgentSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAgentSession,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.lists() }),
  })
}

export function useCreateAgentRun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId,
      agentName,
      text,
      language,
      sourceRunUid,
      images,
      pdfs,
      node,
    }: {
      sessionId: string
      agentName: AgentName
      text: string
      language: Locale
      sourceRunUid?: string
      images?: AgentImagePart[]
      pdfs?: AgentPDFPart[]
      node?: AgentWorkflowNodeReference
    }) =>
      createAgentRun(
        sessionId,
        agentName,
        text,
        language,
        sourceRunUid,
        images,
        pdfs,
        node,
      ),
    onSuccess: (run) => syncRunStarted(queryClient, run),
  })
}

export function useSubmitAgentInput() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      runId,
      messageUid,
      text,
    }: {
      runId: string
      messageUid: string
      text: string
    }) => submitAgentInput(runId, messageUid, text),
    onSuccess: (message) =>
      queryClient.invalidateQueries({
        queryKey: agentQueryKeys.messages(message.session_uid),
      }),
  })
}

export function useResumeAgentRun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      runId,
      approved,
      language,
      feedback,
    }: {
      runId: string
      approved: boolean
      language: Locale
      feedback?: string
    }) => resumeAgentRun(runId, approved, language, feedback),
    onSuccess: (run) => syncRunStarted(queryClient, run),
  })
}

export function useCancelAgentRun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelAgentRun,
    onSuccess: (run) => {
      queryClient.setQueryData(agentQueryKeys.run(run.uid), run)
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: agentQueryKeys.session(run.session_uid),
      })
      queryClient.invalidateQueries({
        queryKey: agentQueryKeys.runs(run.session_uid),
      })
    },
  })
}

export function useRetryAgentRun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ runId, language }: { runId: string; language: Locale }) =>
      retryAgentRun(runId, language),
    onSuccess: (run) => syncRunStarted(queryClient, run),
  })
}
