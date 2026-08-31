'use client'

import {
  FlaskConicalIcon,
  HammerIcon,
  Loader2Icon,
  PlusIcon,
  RotateCcwIcon,
  SendIcon,
  SquareIcon,
  StethoscopeIcon,
  TestTubeDiagonalIcon,
  WrenchIcon,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import type React from 'react'
import { Fragment, useMemo, useRef, useState } from 'react'
import type { AgentScope } from '@/app/actions/agent'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Loader } from '@/components/ai-elements/loader'
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'
import {
  AgentRunArtifacts,
  AgentRunProgress,
} from '@/components/chat/agent-run-content'
import { SidebarHistoryMenu } from '@/components/chat/chat-history-menu'
import { PlanApproval } from '@/components/chat/plan-approval'
import { QuestionApproval } from '@/components/chat/question-approval'
import {
  type SlashCommand,
  SlashCommandItem,
  SlashCommandItemDescription,
  SlashCommandItemLabel,
  SlashCommandMenu,
  useSlashCommand,
} from '@/components/chat/slash-commannd'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  useAgentMessages,
  useAgentRun,
  useAgentRunEventHistory,
  useAgentRunEvents,
  useAgentSession,
  useAgentSessionRuns,
  useCancelAgentRun,
  useCreateAgentRun,
  useCreateAgentSession,
  useResumeAgentRun,
  useRetryAgentRun,
} from '@/hooks/use-agent'
import type { Locale } from '@/i18n/config'
import { parseAgentQuestionAnswers } from '@/lib/agent-questions'
import { useChatSidebarStore } from '@/stores/chat-sidebar-store'
import {
  ACTIVE_AGENT_STATUSES,
  type AgentMessage,
  type AgentName,
  type AgentRun,
} from '@/types/agent'

type AgentSlashCommand = SlashCommand & {
  key: AgentName
}

const CHAT_COMMANDS: Pick<AgentSlashCommand, 'key' | 'icon'>[] = [
  {
    key: 'workflow-builder',
    icon: FlaskConicalIcon,
  },
  {
    key: 'workflow-diagnoser',
    icon: StethoscopeIcon,
  },
  {
    key: 'workflow-fixer',
    icon: HammerIcon,
  },
  {
    key: 'sample-manager',
    icon: TestTubeDiagonalIcon,
  },
  {
    key: 'tool-generator',
    icon: WrenchIcon,
  },
]

function parseAgentCommand(value: string, commands: AgentSlashCommand[]) {
  const match = /^\/([\w-]+)(?:\s+([\s\S]*))?$/.exec(value)
  if (!match) return null
  const command = commands.find((candidate) => candidate.key === match[1])
  if (!command) return null
  return { command, prompt: match[2] ?? '' }
}

function ChatMessage({ message }: { message: AgentMessage }) {
  return (
    <Message from={message.role}>
      <MessageContent>
        {message.parts.map((part) => (
          <MessageResponse key={`${part.type}-${part.text}`}>
            {part.text}
          </MessageResponse>
        ))}
      </MessageContent>
    </Message>
  )
}

function ChatSidebarInner({
  scope,
  scopeKey,
  sourceRunUid,
  width,
  onResizeStart,
}: {
  scope: AgentScope
  scopeKey: string
  sourceRunUid?: string
  width: number
  onResizeStart: (event: React.MouseEvent) => void
}) {
  const t = useTranslations('Chat')
  const language = useLocale() as Locale
  const { sessions, setSessionId, clearSession } = useChatSidebarStore()
  const sessionId = sessions[scopeKey] ?? null
  const { data: session, isLoading: isSessionLoading } =
    useAgentSession(sessionId)
  const { data: messages = [], isLoading: isMessagesLoading } =
    useAgentMessages(sessionId)
  const { data: storedRuns = [], isLoading: isRunsLoading } =
    useAgentSessionRuns(sessionId)
  const eventHistory = useAgentRunEventHistory(storedRuns)
  const [localRunId, setRunId] = useState<string | null>(null)
  const runId = localRunId ?? session?.latest_run?.uid ?? null
  const { data: run } = useAgentRun(runId)
  const events = useAgentRunEvents(runId, run?.status, run?.project_id)
  const [text, setText] = useState('')
  const [feedback, setFeedback] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { mutateAsync: createSession, isPending: isCreating } =
    useCreateAgentSession()
  const { mutateAsync: createRun, isPending: isSubmitting } =
    useCreateAgentRun()
  const { mutateAsync: resumeRun, isPending: isResuming } = useResumeAgentRun()
  const { mutateAsync: cancelRun, isPending: isCancelling } =
    useCancelAgentRun()
  const { mutateAsync: retryRun, isPending: isRetrying } = useRetryAgentRun()

  const displayRuns = useMemo(() => {
    const runs = storedRuns.map((storedRun) =>
      storedRun.uid === run?.uid ? run : storedRun,
    )
    if (run && !runs.some((storedRun) => storedRun.uid === run.uid)) {
      runs.push(run)
    }
    return runs
  }, [run, storedRuns])

  const latestSuccessfulDiagnosis = useMemo(
    () =>
      displayRuns.findLast(
        (storedRun) =>
          storedRun.agent_name === 'workflow-diagnoser' &&
          storedRun.status === 'completed' &&
          storedRun.result_payload?.source_run_uid === sourceRunUid &&
          typeof storedRun.result_payload?.diagnosis_path === 'string',
      ),
    [displayRuns, sourceRunUid],
  )

  const availableCommands = useMemo(() => {
    const commands =
      scope.scope === 'project'
        ? CHAT_COMMANDS.filter((command) => {
            if (command.key === 'workflow-diagnoser') {
              return Boolean(sourceRunUid)
            }
            if (command.key === 'workflow-fixer') {
              return Boolean(sourceRunUid) && Boolean(latestSuccessfulDiagnosis)
            }
            return true
          })
        : CHAT_COMMANDS.filter((command) => command.key === 'tool-generator')
    return commands.map<AgentSlashCommand>((command) => ({
      ...command,
      label: t(`assistants.${command.key}.label`),
      description: t(`assistants.${command.key}.description`),
    }))
  }, [latestSuccessfulDiagnosis, scope.scope, sourceRunUid, t])
  const slashCommand = useSlashCommand({
    commands: availableCommands,
    value: text,
    onValueChange: setText,
  })
  const parsedCommand = useMemo(
    () => parseAgentCommand(text, availableCommands),
    [availableCommands, text],
  )
  const canSubmit = Boolean(
    parsedCommand &&
      (parsedCommand.prompt.trim() ||
        parsedCommand.command.key === 'workflow-fixer'),
  )
  const isBusy = Boolean(run && ACTIVE_AGENT_STATUSES.includes(run.status))
  const inputDisabled =
    !sessionId || isSessionLoading || isMessagesLoading || isRunsLoading

  const latestDiagnosisAlreadyFixed = Boolean(
    latestSuccessfulDiagnosis &&
      displayRuns.some(
        (storedRun) =>
          storedRun.agent_name === 'workflow-fixer' &&
          storedRun.status === 'completed' &&
          storedRun.result_payload?.diagnosis_run_uid ===
            latestSuccessfulDiagnosis.uid,
      ),
  )
  const workflowSuggestion = sourceRunUid
    ? latestSuccessfulDiagnosis && !latestDiagnosisAlreadyFixed
      ? {
          agentName: 'workflow-fixer' as const,
          label: t('suggestions.fix'),
          prompt: t('default_requests.workflow-fixer'),
        }
      : !latestSuccessfulDiagnosis
        ? {
            agentName: 'workflow-diagnoser' as const,
            label: t('suggestions.diagnose'),
            prompt: t('default_requests.workflow-diagnoser'),
          }
        : null
    : null

  const unmatchedMessages = useMemo(() => {
    const runIds = new Set(displayRuns.map((storedRun) => storedRun.uid))
    return messages.filter((message) => !runIds.has(message.run_uid))
  }, [displayRuns, messages])

  const newChat = async () => {
    setLocalError(null)
    try {
      const created = await createSession(scope)
      setSessionId(scopeKey, created.uid)
      setRunId(null)
      setText('')
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : String(error))
    }
  }

  const runWorkflowSuggestion = async () => {
    if (!workflowSuggestion || !sourceRunUid || isBusy) return
    setLocalError(null)
    try {
      let targetSessionId = sessionId
      if (!targetSessionId) {
        const createdSession = await createSession(scope)
        targetSessionId = createdSession.uid
      }
      const createdRun = await createRun({
        sessionId: targetSessionId,
        agentName: workflowSuggestion.agentName,
        text: workflowSuggestion.prompt,
        language,
        sourceRunUid,
      })
      if (targetSessionId !== sessionId) {
        setSessionId(scopeKey, targetSessionId)
      }
      setRunId(createdRun.uid)
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : String(error))
    }
  }

  const submit = async () => {
    if (!sessionId || isBusy) return
    if (!parsedCommand) {
      setLocalError(t('command_required'))
      return
    }
    const prompt =
      parsedCommand.prompt.trim() ||
      (parsedCommand.command.key === 'workflow-fixer'
        ? t('default_requests.workflow-fixer')
        : '')
    if (!prompt) {
      setLocalError(t('command_prompt_required'))
      return
    }
    const requiresSourceRun =
      parsedCommand.command.key === 'workflow-diagnoser' ||
      parsedCommand.command.key === 'workflow-fixer'
    if (requiresSourceRun && !sourceRunUid) {
      setLocalError(t('run_context_required'))
      return
    }
    setLocalError(null)
    try {
      const created = await createRun({
        sessionId,
        agentName: parsedCommand.command.key,
        text: prompt,
        language,
        sourceRunUid: requiresSourceRun ? sourceRunUid : undefined,
      })
      setRunId(created.uid)
      slashCommand.onValueChange('')
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : String(error))
    }
  }

  const resume = async (approved: boolean, response?: string) => {
    if (!run) return
    setLocalError(null)
    try {
      await resumeRun({
        runId: run.uid,
        approved,
        language,
        feedback: approved ? undefined : (response ?? feedback).trim(),
      })
      setFeedback('')
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : String(error))
    }
  }

  const progressEvents = events.filter(
    (event) => event.event_type === 'run.progress',
  )
  const isPlanApproval = run?.interrupt_payload?.kind === 'plan_approval'
  const questions =
    run?.interrupt_payload?.kind === 'questions' &&
    Array.isArray(run.interrupt_payload.questions)
      ? run.interrupt_payload.questions
      : []
  const planContent =
    typeof run?.interrupt_payload?.plan === 'string'
      ? run.interrupt_payload.plan
      : ''

  return (
    <div className='flex h-full shrink-0'>
      <button
        type='button'
        aria-label={t('resize')}
        onMouseDown={onResizeStart}
        className='w-1 shrink-0 cursor-col-resize border-l bg-background p-0 hover:bg-primary/40'
      />
      <div
        className='flex h-full flex-col overflow-hidden bg-background'
        style={{ width }}
      >
        <div className='flex h-12 items-center justify-between border-b px-3'>
          <span className='text-sm font-medium'>{t('title')}</span>
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='icon'
              className='size-7'
              onClick={() => void newChat()}
              disabled={isCreating}
              title={t('new_conversation')}
            >
              {isCreating ? (
                <Loader2Icon className='size-4 animate-spin' />
              ) : (
                <PlusIcon className='size-4' />
              )}
            </Button>
            <SidebarHistoryMenu
              scope={scope}
              currentSessionId={sessionId}
              onSelect={(uid) => setSessionId(scopeKey, uid)}
              onDeleteActive={() => clearSession(scopeKey)}
            />
          </div>
        </div>

        <Conversation className='min-h-0 flex-1'>
          <ConversationContent className='px-3'>
            {isSessionLoading || isMessagesLoading || isRunsLoading ? (
              <Loader />
            ) : messages.length === 0 && displayRuns.length === 0 ? (
              <ConversationEmptyState
                title={t('assistant')}
                description={t('empty_description')}
              />
            ) : (
              <>
                {displayRuns.map((displayRun: AgentRun) => {
                  const runMessages = messages.filter(
                    (message) => message.run_uid === displayRun.uid,
                  )
                  const userMessages = runMessages.filter(
                    (message) => message.role === 'user',
                  )
                  const parsedUserMessages = userMessages.map(
                    (message, index) => ({
                      message,
                      questionAnswers:
                        index > 0 && message.parts.length === 1
                          ? parseAgentQuestionAnswers(message.parts[0].text)
                          : undefined,
                    }),
                  )
                  const visibleUserMessages = parsedUserMessages.flatMap(
                    ({ message, questionAnswers }) =>
                      questionAnswers ? [] : [message],
                  )
                  const assistantMessages = runMessages.filter(
                    (message) => message.role === 'assistant',
                  )
                  const runEvents =
                    displayRun.uid === runId && events.length > 0
                      ? events
                      : (eventHistory[displayRun.uid] ?? [])

                  return (
                    <Fragment key={displayRun.uid}>
                      {visibleUserMessages.map((message) => (
                        <ChatMessage key={message.uid} message={message} />
                      ))}
                      <AgentRunProgress events={runEvents} run={displayRun} />
                      {assistantMessages.map((message) => (
                        <ChatMessage key={message.uid} message={message} />
                      ))}
                      <AgentRunArtifacts run={displayRun} />
                    </Fragment>
                  )
                })}
                {unmatchedMessages.map((message) => (
                  <ChatMessage key={message.uid} message={message} />
                ))}
              </>
            )}

            {run &&
              progressEvents.length === 0 &&
              ['queued', 'running', 'cancel_requested'].includes(
                run.status,
              ) && (
                <div className='flex items-center gap-2 text-muted-foreground text-sm'>
                  <Loader />
                  <span>{t(`status.${run.status}`)}</span>
                </div>
              )}
            {run?.status === 'waiting_input' &&
              (isPlanApproval ? (
                <PlanApproval
                  plan={planContent}
                  feedback={feedback}
                  isPending={isResuming}
                  onFeedbackChange={setFeedback}
                  onApprove={() => void resume(true)}
                  onSendFeedback={() => void resume(false)}
                />
              ) : questions.length > 0 ? (
                <QuestionApproval
                  questions={questions}
                  isPending={isResuming}
                  onSubmit={(response) => void resume(false, response)}
                />
              ) : (
                <Alert>
                  <AlertDescription className='space-y-3'>
                    <MessageResponse>
                      {typeof run.interrupt_payload?.question === 'string'
                        ? run.interrupt_payload.question
                        : typeof run.interrupt_payload?.message === 'string'
                          ? run.interrupt_payload.message
                          : JSON.stringify(run.interrupt_payload, null, 2)}
                    </MessageResponse>
                    <Textarea
                      value={feedback}
                      onChange={(event) => setFeedback(event.target.value)}
                      placeholder={t('feedback_placeholder')}
                    />
                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        onClick={() => void resume(true)}
                        disabled={isResuming}
                      >
                        {t('approve')}
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => void resume(false)}
                        disabled={isResuming || !feedback.trim()}
                      >
                        {t('send_feedback')}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            {run?.status === 'failed' && (
              <Alert variant='destructive'>
                <AlertDescription className='space-y-2'>
                  <p>{run.error_message || t('failed')}</p>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={async () => {
                      const retried = await retryRun({
                        runId: run.uid,
                        language,
                      })
                      setRunId(retried.uid)
                    }}
                    disabled={isRetrying}
                  >
                    <RotateCcwIcon className='size-3' /> {t('retry')}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {localError && (
              <Alert variant='destructive'>
                <AlertDescription>{localError}</AlertDescription>
              </Alert>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className='border-t bg-linear-to-t from-muted/45 via-background to-background px-3 pt-3 pb-3'>
          {workflowSuggestion && !isBusy && (
            <Suggestions className='mb-2'>
              <Suggestion
                suggestion={workflowSuggestion.prompt}
                onClick={() => void runWorkflowSuggestion()}
                disabled={isCreating || isSubmitting}
                className='border-primary/35 bg-primary/4 text-primary shadow-none hover:bg-primary/4 hover:text-primary dark:border-primary/40 dark:bg-primary/[0.07] dark:hover:bg-primary/[0.07]'
              >
                {workflowSuggestion.label}
              </Suggestion>
            </Suggestions>
          )}
          <div className='relative'>
            {slashCommand.open && !parsedCommand && (
              <SlashCommandMenu className='absolute inset-x-0 bottom-full z-20 mb-2'>
                {slashCommand.suggestions.map((command, index) => {
                  const Icon = command.icon
                  return (
                    <SlashCommandItem
                      key={command.key}
                      active={index === slashCommand.activeIndex}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        slashCommand.select(command)
                        requestAnimationFrame(() =>
                          textareaRef.current?.focus(),
                        )
                      }}
                      onMouseEnter={() => slashCommand.setActiveIndex(index)}
                    >
                      {Icon && <Icon className='size-4 shrink-0' />}
                      <SlashCommandItemLabel>
                        /{command.key}
                      </SlashCommandItemLabel>
                      <SlashCommandItemDescription>
                        {command.description}
                      </SlashCommandItemDescription>
                    </SlashCommandItem>
                  )
                })}
              </SlashCommandMenu>
            )}
            <div className='group rounded-2xl border border-border/80 bg-card/95 shadow-[0_8px_28px_-16px_rgb(0_0_0/0.45)] ring-1 ring-black/2.5 transition-[border-color,box-shadow] focus-within:border-primary/45 focus-within:shadow-[0_12px_36px_-18px_rgb(0_0_0/0.5)] focus-within:ring-4 focus-within:ring-primary/10 dark:bg-card/90 dark:ring-white/4'>
              <div className='relative'>
                {parsedCommand && (
                  <div
                    aria-hidden='true'
                    className='pointer-events-none absolute inset-x-0 top-0 min-h-20 whitespace-pre-wrap wrap-break-word px-3 py-2 text-base md:text-sm'
                  >
                    <span className='text-blue-600 [-webkit-text-stroke:0.25px_currentColor] dark:text-blue-400'>
                      /{parsedCommand.command.key}
                    </span>
                    <span className='text-foreground'>
                      {text.slice(`/${parsedCommand.command.key}`.length)}
                    </span>
                  </div>
                )}
                <Textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(event) =>
                    slashCommand.onValueChange(event.target.value)
                  }
                  onKeyDown={(event) => {
                    slashCommand.onKeyDown(event)
                    if (event.defaultPrevented) return
                    if (event.key === 'Enter' && !event.shiftKey) {
                      if (event.nativeEvent.isComposing) return
                      event.preventDefault()
                      void submit()
                    }
                  }}
                  placeholder={
                    inputDisabled
                      ? t('input_unavailable')
                      : t('command_placeholder')
                  }
                  disabled={inputDisabled || isBusy}
                  className={`relative min-h-20 resize-none border-0 bg-transparent px-3 shadow-none focus-visible:ring-0 dark:bg-transparent ${parsedCommand ? 'text-transparent caret-foreground selection:bg-primary/20' : ''}`}
                />
              </div>
              <div className='flex items-center justify-end px-2 pb-2'>
                {isBusy && run ? (
                  <Button
                    type='button'
                    size='icon'
                    variant='ghost'
                    onClick={() => void cancelRun(run.uid)}
                    disabled={isCancelling || run.status === 'cancel_requested'}
                    aria-label={t('cancel')}
                  >
                    <SquareIcon className='size-4' />
                  </Button>
                ) : (
                  <Button
                    type='button'
                    size='icon'
                    disabled={inputDisabled || !canSubmit || isSubmitting}
                    aria-label={t('send')}
                    onClick={() => void submit()}
                  >
                    {isSubmitting ? (
                      <Loader2Icon className='size-4 animate-spin' />
                    ) : (
                      <SendIcon className='size-4' />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ChatSidebar({
  projectId,
  runUid,
  width,
  onResizeStartAction,
}: {
  projectId?: string
  runUid?: string
  width: number
  onResizeStartAction: (event: React.MouseEvent) => void
}) {
  const params = useParams<{ runUid?: string }>()
  const sourceRunUid = runUid ?? params.runUid
  const scope: AgentScope = projectId
    ? { scope: 'project', projectId }
    : { scope: 'global' }
  const scopeKey = projectId ? `project:${projectId}` : 'global'
  const { sessions } = useChatSidebarStore()
  const sessionId = sessions[scopeKey] ?? null
  return (
    <ChatSidebarInner
      key={`${sessionId || 'new'}:${sourceRunUid ?? 'no-run'}`}
      scope={scope}
      scopeKey={scopeKey}
      sourceRunUid={sourceRunUid}
      width={width}
      onResizeStart={onResizeStartAction}
    />
  )
}
