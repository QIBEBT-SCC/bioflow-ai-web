'use client'

import {
  CheckIcon,
  FileDiffIcon,
  MessageSquareIcon,
  SendIcon,
  SquareIcon,
  XIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  cancelCodeAgentTurn,
  closeCodeAgentSession,
  createCodeAgentSession,
  createCodeAgentTurn,
  decideCodeAgentProposal,
  setCodeAgentConfig,
} from '@/app/actions/code-agent'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Loader } from '@/components/ai-elements/loader'
import {
  Plan,
  PlanAction,
  PlanContent,
  PlanDescription,
  PlanFooter,
  PlanHeader,
  PlanTitle,
  PlanTrigger,
} from '@/components/ai-elements/plan'
import {
  type CodeAgentTimelineItem,
  codeAgentActivityFromPayload,
  mergeCodeAgentActivity,
} from '@/components/code/code-agent-activity'
import { CodeAgentConfig } from '@/components/code/code-agent-config'
import {
  PREFERENCE_CATEGORIES,
  readCodeAgentPreferences,
  saveCodeAgentPreferences,
} from '@/components/code/code-agent-preferences'
import { CodeAgentTimeline } from '@/components/code/code-agent-timeline'
import {
  CodeAgentUsage,
  type CodeAgentUsageData,
} from '@/components/code/code-agent-usage'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { CodeNodeType } from '@/types/code'
import type {
  CodeAgentConfigOption,
  CodeAgentProposal,
  CodingAgentProvider,
} from '@/types/code-agent'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1'

interface CodeAgentPanelProps {
  provider?: CodingAgentProvider
  nodeType: CodeNodeType
  source: string
  dependencies: string[]
  onApply: (source: string, dependencies: string[]) => void
  onLockedChange: (locked: boolean) => void
  onProposalChange: (proposal: CodeAgentProposal | undefined) => void
  width: number
  onResizeStartAction: (event: React.MouseEvent) => void
}

export function CodeAgentPanel({
  provider = 'codex',
  nodeType,
  source,
  dependencies,
  onApply,
  onLockedChange,
  onProposalChange,
  width,
  onResizeStartAction,
}: CodeAgentPanelProps) {
  const t = useTranslations('code.Agent')
  const [sessionId, setSessionId] = useState<string>()
  const [status, setStatus] = useState<
    'starting' | 'ready' | 'running' | 'proposal' | 'failed'
  >('starting')
  const [prompt, setPrompt] = useState('')
  const [timeline, setTimeline] = useState<CodeAgentTimelineItem[]>([])
  const [proposal, setProposal] = useState<CodeAgentProposal>()
  const [configOptions, setConfigOptions] = useState<CodeAgentConfigOption[]>(
    [],
  )
  const [configPending, setConfigPending] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<{
    title?: string
    usage?: CodeAgentUsageData
  }>({})
  const [error, setError] = useState<string>()
  const assistantItemId = useRef<string | undefined>(undefined)
  const planItemId = useRef<string | undefined>(undefined)
  const thoughtItemId = useRef<string | undefined>(undefined)
  const terminalItemId = useRef<string | undefined>(undefined)

  useEffect(() => {
    const locked = status === 'running' || status === 'proposal'
    onLockedChange(locked)
    return () => {
      if (locked) onLockedChange(false)
    }
  }, [onLockedChange, status])

  useEffect(() => {
    let disposed = false
    let openedSession: string | undefined
    let eventSource: EventSource | undefined
    let connectTimer: ReturnType<typeof setTimeout> | undefined

    setSessionInfo({})
    setConfigOptions([])
    setConfigPending(false)
    setStatus('starting')
    setSessionId(undefined)
    setTimeline([])
    assistantItemId.current = undefined
    planItemId.current = undefined
    thoughtItemId.current = undefined
    terminalItemId.current = undefined
    setProposal(undefined)
    onProposalChange(undefined)
    setError(undefined)

    const finishActiveItems = () => {
      setTimeline((current) =>
        current.map((item) =>
          (item.type === 'plan' ||
            item.type === 'thought' ||
            item.type === 'terminal') &&
          item.active
            ? { ...item, active: false }
            : item.type === 'activity' &&
                ['pending', 'in_progress'].includes(item.activity.status)
              ? {
                  ...item,
                  activity: { ...item.activity, status: 'stopped' as const },
                }
              : item,
        ),
      )
    }

    const finishActiveThought = () => {
      const currentThoughtId = thoughtItemId.current
      if (!currentThoughtId) return
      setTimeline((current) =>
        current.map((item) =>
          item.id === currentThoughtId && item.type === 'thought'
            ? { ...item, active: false }
            : item,
        ),
      )
      thoughtItemId.current = undefined
    }

    const appendThought = (delta: string, messageId?: string) => {
      if (!delta || (!delta.trim() && !thoughtItemId.current)) return
      const id = messageId
        ? `thought:${messageId}`
        : (thoughtItemId.current ?? crypto.randomUUID())
      thoughtItemId.current = id
      setTimeline((current) => {
        const existing = current.find(
          (item) => item.id === id && item.type === 'thought',
        )
        if (!existing || existing.type !== 'thought') {
          return [
            ...current,
            { id, type: 'thought', text: delta, active: true },
          ]
        }
        return current.map((item) =>
          item.id === id && item.type === 'thought'
            ? { ...item, text: item.text + delta, active: true }
            : item,
        )
      })
    }

    const preferences = readCodeAgentPreferences(provider)
    const restoreCategories = [...PREFERENCE_CATEGORIES]
    let sessionReady = false
    let latestOptions: CodeAgentConfigOption[] | undefined
    let restoring = false

    const restoreNextPreference = () => {
      if (!sessionReady || !latestOptions || !openedSession || disposed) return
      while (restoreCategories.length) {
        const category = restoreCategories.shift()
        if (!category) break
        const value = preferences[category]
        const option = latestOptions.find(
          (option) => option.category === category && option.type === 'select',
        )
        if (!option || !value || option.currentValue === value) continue
        const choices = option.options.flatMap((choice) =>
          'options' in choice ? choice.options : [choice],
        )
        if (!choices.some((choice) => choice.value === value)) continue
        restoring = true
        setConfigPending(true)
        void setCodeAgentConfig(openedSession, option.id, value).catch(() => {
          if (disposed) return
          restoring = false
          restoreNextPreference()
        })
        return
      }
      restoring = false
      setConfigPending(false)
    }

    const handleConfig = (event: Event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        configOptions?: CodeAgentConfigOption[]
      }
      latestOptions = payload.configOptions ?? []
      setConfigOptions(latestOptions)
      if (event.type === 'config.completed') {
        if (!restoring) saveCodeAgentPreferences(latestOptions, provider)
        restoring = false
        restoreNextPreference()
      } else if (!restoring && restoreCategories.length) {
        restoreNextPreference()
      }
    }
    const handleConfigFailed = (event: Event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        message?: string
      }
      if (restoring) {
        restoring = false
        restoreNextPreference()
        return
      }
      setConfigPending(false)
      toast.error(payload.message ?? t('failed'))
    }
    const handleReady = () => {
      sessionReady = true
      restoreNextPreference()
      setStatus('ready')
      setError(undefined)
    }
    const handleStarted = () => {
      finishActiveItems()
      assistantItemId.current = undefined
      planItemId.current = undefined
      thoughtItemId.current = undefined
      terminalItemId.current = undefined
      setStatus('running')
      setProposal(undefined)
    }
    const handleMessage = (event: Event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        text?: string
      }
      const delta = payload.text
      if (!delta) return
      finishActiveThought()
      terminalItemId.current = undefined
      const currentMessageId = assistantItemId.current
      if (currentMessageId) {
        setTimeline((current) =>
          current.map((item) =>
            item.id === currentMessageId && item.type === 'message'
              ? { ...item, text: item.text + delta }
              : item,
          ),
        )
        return
      }
      const id = crypto.randomUUID()
      assistantItemId.current = id
      setTimeline((current) => [
        ...current,
        { id, type: 'message', role: 'assistant', text: delta },
      ])
    }
    const handleThought = (event: Event) => {
      assistantItemId.current = undefined
      terminalItemId.current = undefined
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        message_id?: string
        text?: string
      }
      const delta = payload.text
      if (!delta) return
      appendThought(delta, payload.message_id)
    }
    const handlePlan = (event: Event) => {
      assistantItemId.current = undefined
      finishActiveThought()
      terminalItemId.current = undefined
      const payload = JSON.parse(
        (event as MessageEvent<string>).data,
      ) as Record<string, unknown>
      const currentPlanId = planItemId.current
      if (currentPlanId) {
        setTimeline((current) =>
          current.map((item) =>
            item.id === currentPlanId && item.type === 'plan'
              ? { ...item, payload, active: true }
              : item,
          ),
        )
        return
      }
      const id = crypto.randomUUID()
      planItemId.current = id
      setTimeline((current) => [
        ...current,
        { id, type: 'plan', payload, active: true },
      ])
    }
    const handleTool = (event: Event) => {
      const payload = JSON.parse(
        (event as MessageEvent<string>).data,
      ) as Record<string, unknown>
      if (payload.kind === 'agent_thought_chunk') {
        const detail = payload.detail as
          | {
              messageId?: string
              content?: { text?: string }
            }
          | undefined
        const delta = detail?.content?.text
        if (delta) {
          assistantItemId.current = undefined
          terminalItemId.current = undefined
          appendThought(delta, detail?.messageId)
        }
        return
      }
      assistantItemId.current = undefined
      finishActiveThought()
      if (payload.kind === 'terminal' && typeof payload.output === 'string') {
        const currentTerminalId = terminalItemId.current
        if (currentTerminalId) {
          setTimeline((current) =>
            current.map((item) =>
              item.id === currentTerminalId && item.type === 'terminal'
                ? { ...item, output: `${item.output}\n${payload.output}` }
                : item,
            ),
          )
          return
        }
        const id = crypto.randomUUID()
        terminalItemId.current = id
        setTimeline((current) => [
          ...current,
          {
            id,
            type: 'terminal',
            output: payload.output as string,
            active: true,
          },
        ])
        return
      }
      terminalItemId.current = undefined
      const activity = codeAgentActivityFromPayload(payload)
      if (!activity) return
      const id = activity.callId
        ? `tool:${activity.callId}`
        : crypto.randomUUID()
      setTimeline((current) => {
        const existing = current.find(
          (item) => item.id === id && item.type === 'activity',
        )
        if (!existing || existing.type !== 'activity') {
          return [...current, { id, type: 'activity', activity }]
        }
        return current.map((item) =>
          item.id === id && item.type === 'activity'
            ? {
                ...item,
                activity: mergeCodeAgentActivity(item.activity, activity),
              }
            : item,
        )
      })
    }
    const handleSessionInfo = (event: Event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        title?: string | null
      }
      if ('title' in payload)
        setSessionInfo((current) => ({
          ...current,
          title: payload.title || undefined,
        }))
    }
    const handleUsage = (event: Event) => {
      const payload = JSON.parse(
        (event as MessageEvent<string>).data,
      ) as CodeAgentUsageData
      setSessionInfo((current) => ({ ...current, usage: payload }))
    }
    const handleProposal = (event: Event) => {
      const payload = JSON.parse(
        (event as MessageEvent<string>).data,
      ) as CodeAgentProposal
      finishActiveItems()
      assistantItemId.current = undefined
      planItemId.current = undefined
      thoughtItemId.current = undefined
      terminalItemId.current = undefined
      setProposal(payload)
      onProposalChange(payload)
      setStatus('proposal')
    }
    const handleFailed = (event: Event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        message?: string
        recoverable?: boolean
      }
      finishActiveItems()
      setError(payload.message ?? t('failed'))
      setStatus(payload.recoverable ? 'ready' : 'failed')
    }
    const handleCancelled = () => {
      finishActiveItems()
      setStatus('ready')
      setError(undefined)
    }
    const handleClosed = () => {
      finishActiveItems()
      setStatus('failed')
      setError(t('closed'))
      eventSource?.close()
    }
    const handleStreamError = () => setError(t('connecting'))

    const connect = async () => {
      try {
        const created = await createCodeAgentSession({
          node_type: nodeType,
          provider,
        })
        openedSession = created.id
        if (disposed) {
          await closeCodeAgentSession(created.id).catch(() => undefined)
          return
        }
        setSessionId(created.id)
        eventSource = new EventSource(
          `${API_URL}/code-agent/sessions/${created.id}/events`,
          { withCredentials: true },
        )

        eventSource.addEventListener('config.updated', handleConfig)
        eventSource.addEventListener('config.completed', handleConfig)
        eventSource.addEventListener('config.failed', handleConfigFailed)
        eventSource.addEventListener('session.ready', handleReady)
        eventSource.addEventListener('turn.started', handleStarted)
        eventSource.addEventListener('message.delta', handleMessage)
        eventSource.addEventListener('thought.delta', handleThought)
        eventSource.addEventListener('plan.updated', handlePlan)
        eventSource.addEventListener('tool.updated', handleTool)
        eventSource.addEventListener('session.info', handleSessionInfo)
        eventSource.addEventListener('session.usage', handleUsage)
        eventSource.addEventListener('proposal.ready', handleProposal)
        eventSource.addEventListener('turn.failed', handleFailed)
        eventSource.addEventListener('turn.cancelled', handleCancelled)
        eventSource.addEventListener('session.closed', handleClosed)
        eventSource.onerror = handleStreamError
      } catch (caught) {
        if (disposed) return
        const message = caught instanceof Error ? caught.message : t('failed')
        setError(message)
        setStatus('failed')
      }
    }

    // React Strict Mode runs an extra setup/cleanup cycle in development.
    // Deferring the request lets that synthetic cleanup cancel the duplicate
    // session without changing the behavior of a real mounted panel.
    connectTimer = setTimeout(() => void connect(), 0)
    return () => {
      disposed = true
      if (connectTimer !== undefined) clearTimeout(connectTimer)
      if (eventSource) {
        eventSource.removeEventListener('config.updated', handleConfig)
        eventSource.removeEventListener('config.completed', handleConfig)
        eventSource.removeEventListener('config.failed', handleConfigFailed)
        eventSource.removeEventListener('session.ready', handleReady)
        eventSource.removeEventListener('turn.started', handleStarted)
        eventSource.removeEventListener('message.delta', handleMessage)
        eventSource.removeEventListener('thought.delta', handleThought)
        eventSource.removeEventListener('plan.updated', handlePlan)
        eventSource.removeEventListener('tool.updated', handleTool)
        eventSource.removeEventListener('session.info', handleSessionInfo)
        eventSource.removeEventListener('session.usage', handleUsage)
        eventSource.removeEventListener('proposal.ready', handleProposal)
        eventSource.removeEventListener('turn.failed', handleFailed)
        eventSource.removeEventListener('turn.cancelled', handleCancelled)
        eventSource.removeEventListener('session.closed', handleClosed)
        eventSource.onerror = null
        eventSource.close()
      }
      if (openedSession)
        void closeCodeAgentSession(openedSession, true).catch(() => undefined)
      onProposalChange(undefined)
    }
  }, [nodeType, provider, onProposalChange, t])

  const submit = async () => {
    const text = prompt.trim()
    if (!sessionId || !text || status !== 'ready' || configPending) return
    setPrompt('')
    setError(undefined)
    assistantItemId.current = undefined
    planItemId.current = undefined
    thoughtItemId.current = undefined
    terminalItemId.current = undefined
    setTimeline((current) => [
      ...current,
      { id: crypto.randomUUID(), type: 'message', role: 'user', text },
    ])
    try {
      await createCodeAgentTurn(sessionId, {
        prompt: text,
        source,
        dependencies,
      })
      setStatus('running')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('failed'))
      setStatus('ready')
    }
  }

  const changeConfig = async (id: string, value: string) => {
    if (!sessionId || status !== 'ready' || configPending) return
    setConfigPending(true)
    try {
      await setCodeAgentConfig(sessionId, id, value)
    } catch (caught) {
      setConfigPending(false)
      toast.error(caught instanceof Error ? caught.message : t('failed'))
    }
  }

  const stop = async () => {
    if (!sessionId) return
    await cancelCodeAgentTurn(sessionId).catch((caught: Error) =>
      toast.error(caught.message),
    )
  }

  const decide = async (decision: 'accept' | 'reject') => {
    if (!sessionId || !proposal) return
    try {
      await decideCodeAgentProposal(sessionId, proposal.id, decision)
      if (decision === 'accept') {
        onApply(proposal.source, proposal.dependencies)
        toast.success(t('applied'))
      }
      setProposal(undefined)
      onProposalChange(undefined)
      setStatus('ready')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : t('failed'))
    }
  }

  return (
    <div className='flex h-full shrink-0'>
      <button
        type='button'
        aria-label={t('resize')}
        onMouseDown={onResizeStartAction}
        className='w-1 shrink-0 cursor-col-resize border-l bg-background p-0 hover:bg-primary/40'
      />
      <aside
        className='flex h-full min-h-0 flex-col overflow-hidden bg-background'
        style={{ width }}
      >
        {sessionInfo.title && (
          <div
            className='shrink-0 truncate border-b px-3 py-2 text-xs font-medium text-muted-foreground'
            title={sessionInfo.title}
          >
            {sessionInfo.title}
          </div>
        )}
        <Conversation className='min-h-0 flex-1'>
          <ConversationContent className='gap-5 px-3'>
            {timeline.length === 0 &&
              !proposal &&
              !error &&
              status !== 'running' && (
                <ConversationEmptyState
                  className='min-h-64'
                  icon={<MessageSquareIcon className='size-5' />}
                  title={t('title')}
                  description={t('empty')}
                />
              )}

            <CodeAgentTimeline items={timeline} />

            {proposal && (
              <Plan
                defaultOpen
                className='gap-0 overflow-hidden border-primary/20 bg-card py-0 shadow-sm'
              >
                <PlanHeader className='grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4'>
                  <div className='flex min-w-0 gap-3'>
                    <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
                      <FileDiffIcon className='size-4' />
                    </div>
                    <div className='min-w-0 space-y-1'>
                      <PlanTitle>{t('proposal')}</PlanTitle>
                      <PlanDescription>
                        {proposal.diff ? t('reviewInEditor') : t('noChanges')}
                      </PlanDescription>
                    </div>
                  </div>
                  <PlanAction>
                    <PlanTrigger aria-label={t('toggleProposal')} />
                  </PlanAction>
                </PlanHeader>
                <PlanContent className='space-y-2 border-t bg-muted/20 p-3'>
                  <p className='text-xs leading-5 text-muted-foreground'>
                    {t('manualSave')}
                  </p>
                  {proposal.warnings.map((warning) => (
                    <Alert key={warning}>
                      <AlertDescription className='text-xs text-amber-700 dark:text-amber-400'>
                        {warning}
                      </AlertDescription>
                    </Alert>
                  ))}
                </PlanContent>
                <PlanFooter className='justify-end gap-2 border-t p-3'>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    onClick={() => void decide('reject')}
                  >
                    <XIcon className='size-4' />
                    {t('reject')}
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    onClick={() => void decide('accept')}
                  >
                    <CheckIcon className='size-4' />
                    {t('accept')}
                  </Button>
                </PlanFooter>
              </Plan>
            )}

            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {(status === 'starting' || status === 'running') && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Loader />
                <span>
                  {status === 'starting' ? t('starting') : t('running')}
                </span>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className='border-t bg-linear-to-t from-muted/45 via-background to-background px-3 pt-3 pb-3'>
          <div className='group rounded-2xl border border-border/80 bg-card/95 shadow-[0_8px_28px_-16px_rgb(0_0_0/0.45)] ring-1 ring-black/2.5 transition-[border-color,box-shadow] focus-within:border-primary/45 focus-within:shadow-[0_12px_36px_-18px_rgb(0_0_0/0.5)] focus-within:ring-4 focus-within:ring-primary/10 dark:bg-card/90 dark:ring-white/4'>
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault()
                  void submit()
                }
              }}
              placeholder={t('placeholder')}
              className='min-h-20 resize-none border-0 bg-transparent px-3 shadow-none focus-visible:ring-0 dark:bg-transparent'
              disabled={status !== 'ready' || configPending}
            />
            <div className='flex items-center justify-between gap-2 px-2 pb-2 [&>button]:ml-auto [&>button]:shrink-0'>
              <CodeAgentConfig
                options={configOptions}
                disabled={status !== 'ready' || configPending}
                onChange={(id, value) => void changeConfig(id, value)}
              />
              {status === 'running' ? (
                <Button
                  type='button'
                  size='icon'
                  variant='ghost'
                  onClick={() => void stop()}
                  aria-label={t('stop')}
                >
                  <SquareIcon className='size-4' />
                </Button>
              ) : (
                <Button
                  type='button'
                  size='icon'
                  onClick={() => void submit()}
                  disabled={
                    status !== 'ready' || configPending || !prompt.trim()
                  }
                  aria-label={t('send')}
                >
                  <SendIcon className='size-4' />
                </Button>
              )}
            </div>
          </div>
          <div className='mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-1 text-[10px] text-muted-foreground/70'>
            <p>{t('enterHint')}</p>
            {sessionInfo.usage && <CodeAgentUsage usage={sessionInfo.usage} />}
          </div>
        </div>
      </aside>
    </div>
  )
}
