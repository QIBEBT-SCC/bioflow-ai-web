'use client'

import {
  ArrowUpIcon,
  BotIcon,
  Loader2Icon,
  PaperclipIcon,
  PlusIcon,
  SparklesIcon,
  SquareIcon,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import type React from 'react'
import { useMemo, useRef, useState } from 'react'
import type { AgentScope } from '@/app/actions/agent'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Message, MessageResponse } from '@/components/ai-elements/message'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'
import { AgentImage } from '@/components/chat/agent-image'
import { AGENT_ICONS, AGENT_NAMES } from '@/components/chat/agent-meta'
import { AgentPDF } from '@/components/chat/agent-pdf'
import { AgentRunArtifacts } from '@/components/chat/agent-run-content'
import { AgentRunTrace } from '@/components/chat/agent-run-trace'
import { AgentWorkflowNode } from '@/components/chat/agent-workflow-node'
import { SidebarHistoryMenu } from '@/components/chat/chat-history-menu'
import { DraftAttachments } from '@/components/chat/draft-attachments'
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
import { Skeleton } from '@/components/ui/skeleton'
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
import {
  CHAT_ATTACHMENT_ACCEPT,
  useChatAttachments,
} from '@/hooks/use-chat-attachment'
import type { Locale } from '@/i18n/config'
import { parseAgentQuestionAnswers } from '@/lib/agent-questions'
import { cn } from '@/lib/utils'
import { getSuggestedWorkflowAgent } from '@/lib/workflow-agent-suggestions'
import { useChatSidebarStore } from '@/stores/chat-sidebar-store'
import {
  ACTIVE_AGENT_STATUSES,
  type AgentMessage,
  type AgentMessagePart,
  type AgentName,
  type AgentRun,
  type AgentWorkflowNodePart,
} from '@/types/agent'

interface NodeAttachmentProps {
  nodeAttachment?: AgentWorkflowNodePart | null
  sourceGeneration?: number
  onRemoveNodeAction?: () => void
  onNodeSentAction?: (node: AgentWorkflowNodePart) => void
  onSessionCreatedAction?: (sessionId: string) => void
}

type AgentSlashCommand = SlashCommand & {
  key: AgentName
}

function parseAgentCommand(value: string, commands: AgentSlashCommand[]) {
  const match = /^\/([\w-]+)(?:\s+([\s\S]*))?$/.exec(value)
  if (!match) return null
  const command = commands.find((candidate) => candidate.key === match[1])
  if (!command) return null
  return { command, prompt: match[2] ?? '' }
}

function MessageAttachment({ part }: { part: AgentMessagePart }) {
  if (part.type === 'image') return <AgentImage image={part} />
  if (part.type === 'pdf') return <AgentPDF pdf={part} />
  if (part.type === 'workflow_node') return <AgentWorkflowNode node={part} />
  return null
}

function attachmentKey(part: AgentMessagePart) {
  if (part.type === 'image') return `image-${part.id}`
  if (part.type === 'pdf') return `pdf-${part.id}`
  if (part.type === 'workflow_node')
    return `node-${part.run_uid}-${part.node_id}`
  return `text-${part.text}`
}

function ChatMessage({ message }: { message: AgentMessage }) {
  const isUser = message.role === 'user'
  const attachments = message.parts.filter((part) => part.type !== 'text')
  const texts = message.parts.flatMap((part) =>
    part.type === 'text' && part.text.trim() ? [part.text] : [],
  )
  return (
    <Message
      from={message.role}
      className={cn(isUser ? 'max-w-[88%] items-end' : 'max-w-full')}
    >
      {attachments.length > 0 && (
        <div className={cn('flex flex-wrap gap-2', isUser && 'justify-end')}>
          {attachments.map((part) => (
            <MessageAttachment key={attachmentKey(part)} part={part} />
          ))}
        </div>
      )}
      {texts.map((text) =>
        isUser ? (
          <div
            key={`${message.uid}-${text}`}
            className='w-fit max-w-full rounded-2xl rounded-br-md bg-primary/10 px-3.5 py-2.5 text-foreground text-sm'
          >
            <MessageResponse>{text}</MessageResponse>
          </div>
        ) : (
          <MessageResponse
            key={`${message.uid}-${text}`}
            className='text-sm leading-relaxed'
          >
            {text}
          </MessageResponse>
        ),
      )}
    </Message>
  )
}

function ConversationSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy='true' className='flex flex-col gap-4'>
      <span className='sr-only'>{label}</span>
      <Skeleton className='ml-auto h-10 w-3/5 rounded-2xl' />
      <Skeleton className='h-14 w-full rounded-xl' />
      <div className='space-y-2'>
        <Skeleton className='h-4 w-11/12' />
        <Skeleton className='h-4 w-4/5' />
        <Skeleton className='h-4 w-2/3' />
      </div>
    </div>
  )
}

function ActiveAgentPill({ command }: { command: AgentSlashCommand }) {
  const Icon = command.icon ?? SparklesIcon
  return (
    <span className='flex h-6 min-w-0 items-center gap-1.5 rounded-full bg-primary/10 px-2 text-primary text-xs'>
      <Icon className='size-3.5 shrink-0' />
      <span className='truncate'>{command.label}</span>
    </span>
  )
}

function ChatSidebarInner({
  scope,
  scopeKey,
  sourceRunUid,
  width,
  onResizeStart,
  nodeAttachment,
  sourceGeneration,
  onRemoveNodeAction,
  onNodeSentAction,
  onSessionCreatedAction,
}: {
  scope: AgentScope
  scopeKey: string
  sourceRunUid?: string
  width: number
  onResizeStart: (event: React.MouseEvent) => void
} & NodeAttachmentProps) {
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachments = useChatAttachments(sessionId)
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

  const availableCommands = useMemo(() => {
    const names =
      scope.scope === 'project'
        ? AGENT_NAMES.filter(
            (name) =>
              Boolean(sourceRunUid) ||
              (name !== 'workflow-assistant' && name !== 'workflow-fixer'),
          )
        : AGENT_NAMES.filter((name) => name === 'tool-generator')
    return names.map<AgentSlashCommand>((name) => ({
      key: name,
      icon: AGENT_ICONS[name],
      label: t(`assistants.${name}.label`),
      description: t(`assistants.${name}.description`),
    }))
  }, [scope.scope, sourceRunUid, t])
  const slashCommand = useSlashCommand({
    commands: availableCommands,
    value: text,
    onValueChange: setText,
  })
  const parsedCommand = useMemo(
    () => parseAgentCommand(text, availableCommands),
    [availableCommands, text],
  )
  const nodeError = nodeAttachment
    ? nodeAttachment.run_uid !== sourceRunUid ||
      nodeAttachment.generation !== sourceGeneration
      ? t('node.stale')
      : parsedCommand && parsedCommand.command.key !== 'workflow-assistant'
        ? t('node.assistant_required')
        : null
    : null
  const canSubmit = Boolean(
    parsedCommand &&
      !attachments.blocked &&
      !nodeError &&
      (parsedCommand.prompt.trim() ||
        ((attachments.images.length + attachments.pdfs.length > 0 ||
          nodeAttachment) &&
          parsedCommand.command.key !== 'workflow-fixer')),
  )
  const isBusy = Boolean(run && ACTIVE_AGENT_STATUSES.includes(run.status))
  const inputDisabled =
    !sessionId || isSessionLoading || isMessagesLoading || isRunsLoading

  const workflowSuggestions = useMemo(() => {
    if (!sourceRunUid) return []
    const agentName = getSuggestedWorkflowAgent(displayRuns, sourceRunUid)
    if (!agentName) return []
    return [
      {
        agentName,
        label: t(
          agentName === 'workflow-assistant'
            ? 'suggestions.diagnose'
            : 'suggestions.fix',
        ),
        prompt: t(`default_requests.${agentName}`),
      },
    ]
  }, [displayRuns, sourceRunUid, t])

  const unmatchedMessages = useMemo(() => {
    const runIds = new Set(displayRuns.map((storedRun) => storedRun.uid))
    return messages.filter((message) => !runIds.has(message.run_uid))
  }, [displayRuns, messages])

  const newChat = async () => {
    setLocalError(null)
    try {
      const created = await createSession(scope)
      if (!sessionId) onSessionCreatedAction?.(created.uid)
      setSessionId(scopeKey, created.uid)
      setRunId(null)
      setText('')
      attachments.clear()
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : String(error))
    }
  }

  const runWorkflowSuggestion = async (
    suggestion: (typeof workflowSuggestions)[number],
  ) => {
    if (!sourceRunUid || isBusy) return
    setLocalError(null)
    try {
      let targetSessionId = sessionId
      if (!targetSessionId) {
        const createdSession = await createSession(scope)
        targetSessionId = createdSession.uid
      }
      const createdRun = await createRun({
        sessionId: targetSessionId,
        agentName: suggestion.agentName,
        text: suggestion.prompt,
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
    if (!sessionId || isBusy || isSubmitting) return
    if (!parsedCommand) {
      setLocalError(t('command_required'))
      return
    }
    const prompt = parsedCommand.prompt.trim()
    if (attachments.blocked) return
    if (nodeError) {
      setLocalError(nodeError)
      return
    }
    if (
      !prompt &&
      ((!nodeAttachment &&
        attachments.images.length + attachments.pdfs.length === 0) ||
        parsedCommand.command.key === 'workflow-fixer')
    ) {
      setLocalError(t('command_prompt_required'))
      return
    }
    const requiresSourceRun =
      parsedCommand.command.key === 'workflow-assistant' ||
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
        images: attachments.images,
        pdfs: attachments.pdfs,
        node: nodeAttachment ?? undefined,
        language,
        sourceRunUid: requiresSourceRun ? sourceRunUid : undefined,
      })
      setRunId(created.uid)
      slashCommand.onValueChange('')
      attachments.clear()
      if (nodeAttachment) onNodeSentAction?.(nodeAttachment)
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

  const retry = async (failedRun: AgentRun) => {
    setLocalError(null)
    try {
      const retried = await retryRun({ runId: failedRun.uid, language })
      setRunId(retried.uid)
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : String(error))
    }
  }

  const chooseCommand = (command: AgentSlashCommand) => {
    slashCommand.select(command)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const openCommandMenu = () => {
    slashCommand.onValueChange('/')
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const isLoading = isSessionLoading || isMessagesLoading || isRunsLoading
  const inputLocked = inputDisabled || isBusy || isSubmitting
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
        className='w-1 shrink-0 cursor-col-resize border-l bg-background p-0 transition-colors hover:bg-primary/40'
      />
      <div
        className='flex h-full flex-col overflow-hidden bg-background'
        style={{ width }}
      >
        <header className='flex h-12 shrink-0 items-center gap-2.5 border-b px-3'>
          <span className='flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <SparklesIcon className='size-4' />
          </span>
          <div className='min-w-0 flex-1'>
            <h2 className='truncate font-medium text-sm leading-tight'>
              {t('title')}
            </h2>
            {session?.title && (
              <p
                className='truncate text-muted-foreground text-xs leading-tight'
                title={session.title}
              >
                {session.title}
              </p>
            )}
          </div>
          <div className='flex shrink-0 items-center gap-0.5'>
            <Button
              variant='ghost'
              size='icon'
              className='size-7'
              onClick={() => void newChat()}
              disabled={isCreating}
              title={t('new_conversation')}
              aria-label={t('new_conversation')}
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
        </header>

        <Conversation className='min-h-0 flex-1'>
          <ConversationContent className='gap-6 px-3 py-4'>
            {isLoading ? (
              <ConversationSkeleton label={t('loading')} />
            ) : messages.length === 0 && displayRuns.length === 0 ? (
              <div className='flex flex-col gap-5 py-6'>
                <div className='flex flex-col items-center gap-2 text-center'>
                  <span className='flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                    <SparklesIcon className='size-5' />
                  </span>
                  <h3 className='font-semibold text-base'>{t('assistant')}</h3>
                  <p className='max-w-72 text-muted-foreground text-sm'>
                    {sessionId ? t('empty_description') : t('empty_no_session')}
                  </p>
                </div>
                {sessionId ? (
                  <ul className='flex flex-col gap-2'>
                    {availableCommands.map((command) => {
                      const Icon = command.icon ?? SparklesIcon
                      return (
                        <li key={command.key}>
                          <button
                            type='button'
                            disabled={inputLocked}
                            onClick={() => chooseCommand(command)}
                            className='group flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left shadow-xs transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
                          >
                            <span className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                              <Icon className='size-4' />
                            </span>
                            <span className='min-w-0 flex-1'>
                              <span className='flex items-baseline gap-2'>
                                <span className='truncate font-medium text-sm group-hover:text-primary'>
                                  {command.label}
                                </span>
                                <code className='shrink-0 font-mono text-muted-foreground text-xs'>
                                  /{command.key}
                                </code>
                              </span>
                              <span className='mt-0.5 line-clamp-2 text-muted-foreground text-xs leading-relaxed'>
                                {command.description}
                              </span>
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <Button
                    className='self-center'
                    onClick={() => void newChat()}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <Loader2Icon className='animate-spin' />
                    ) : (
                      <PlusIcon />
                    )}
                    {t('new_conversation')}
                  </Button>
                )}
              </div>
            ) : (
              <>
                {displayRuns.map((displayRun: AgentRun) => {
                  const runMessages = messages.filter(
                    (message) => message.run_uid === displayRun.uid,
                  )
                  const userMessages = runMessages.filter(
                    (message) => message.role === 'user',
                  )
                  const visibleUserMessages = userMessages.filter(
                    (message, index) =>
                      !(
                        index > 0 &&
                        message.parts.length === 1 &&
                        message.parts[0].type === 'text' &&
                        parseAgentQuestionAnswers(message.parts[0].text)
                      ),
                  )
                  const assistantMessages = runMessages.filter(
                    (message) => message.role === 'assistant',
                  )
                  const runEvents =
                    displayRun.uid === runId && events.length > 0
                      ? events
                      : (eventHistory[displayRun.uid] ?? [])
                  const isCurrentRun = displayRun.uid === run?.uid

                  return (
                    <div key={displayRun.uid} className='flex flex-col gap-3'>
                      {visibleUserMessages.map((message) => (
                        <ChatMessage key={message.uid} message={message} />
                      ))}
                      <AgentRunTrace
                        run={displayRun}
                        events={runEvents}
                        onRetry={
                          isCurrentRun
                            ? () => void retry(displayRun)
                            : undefined
                        }
                        isRetrying={isRetrying}
                      />
                      {assistantMessages.map((message) => (
                        <ChatMessage key={message.uid} message={message} />
                      ))}
                      <AgentRunArtifacts run={displayRun} />
                    </div>
                  )
                })}
                {unmatchedMessages.map((message) => (
                  <ChatMessage key={message.uid} message={message} />
                ))}
              </>
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
                <Alert variant='warning'>
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
                      className='bg-background'
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
          </ConversationContent>
          <ConversationScrollButton className='bottom-3 size-8 shadow-sm' />
        </Conversation>

        <div className='shrink-0 space-y-2 px-3 pt-1 pb-3'>
          {(localError || attachments.error) && (
            <Alert variant='destructive' className='py-2'>
              <AlertDescription className='text-xs'>
                {localError ?? attachments.error}
              </AlertDescription>
            </Alert>
          )}
          {workflowSuggestions.length > 0 && !isBusy && !nodeAttachment && (
            <Suggestions>
              {workflowSuggestions.map((suggestion) => (
                <Suggestion
                  key={suggestion.agentName}
                  suggestion={suggestion.prompt}
                  onClick={() => void runWorkflowSuggestion(suggestion)}
                  disabled={isCreating || isSubmitting}
                  className='h-7 gap-1.5 border-primary/30 px-3 text-primary text-xs shadow-none hover:bg-primary/5 hover:text-primary'
                >
                  <SparklesIcon className='size-3.5' />
                  {suggestion.label}
                </Suggestion>
              ))}
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
                      onClick={() => chooseCommand(command)}
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
            <fieldset
              aria-label={t('images.attachments')}
              onDragOver={(event) => {
                if (event.dataTransfer.types.includes('Files'))
                  event.preventDefault()
              }}
              onDrop={(event) => {
                if (event.dataTransfer.files.length === 0) return
                event.preventDefault()
                if (!inputLocked)
                  attachments.addFiles(Array.from(event.dataTransfer.files))
              }}
              className='rounded-xl border bg-card shadow-sm transition-[border-color,box-shadow] focus-within:border-primary/50 focus-within:ring-3 focus-within:ring-primary/10'
            >
              <DraftAttachments
                drafts={attachments.drafts}
                onRemove={attachments.remove}
                onRetry={attachments.retry}
                disabled={isSubmitting || isBusy}
                node={nodeAttachment}
                onRemoveNode={onRemoveNodeAction}
              />
              {nodeError && (
                <output className='block px-3 pt-2 text-destructive text-xs'>
                  {nodeError}
                </output>
              )}
              <input
                ref={fileInputRef}
                type='file'
                accept={CHAT_ATTACHMENT_ACCEPT}
                multiple
                className='sr-only'
                tabIndex={-1}
                aria-label={t('images.add')}
                disabled={inputLocked}
                onChange={(event) => {
                  attachments.addFiles(Array.from(event.target.files ?? []))
                  event.target.value = ''
                }}
              />
              <div className='relative'>
                {parsedCommand && (
                  <div
                    aria-hidden='true'
                    className='pointer-events-none absolute inset-x-0 top-0 min-h-16 whitespace-pre-wrap wrap-break-word px-3 py-2 text-base md:text-sm'
                  >
                    <span className='rounded-sm bg-primary/10 text-primary'>
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
                  onPaste={(event) => {
                    const files = Array.from(event.clipboardData.files)
                    if (files.length === 0) return
                    event.preventDefault()
                    if (!inputLocked) attachments.addFiles(files)
                  }}
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
                  disabled={inputLocked}
                  className={cn(
                    'relative max-h-60 min-h-16 resize-none border-0 bg-transparent px-3 shadow-none focus-visible:ring-0 dark:bg-transparent',
                    parsedCommand &&
                      'text-transparent caret-foreground selection:bg-primary/20',
                  )}
                />
              </div>
              <div className='flex items-center gap-1 px-2 pb-2'>
                <Button
                  type='button'
                  size='icon-sm'
                  variant='ghost'
                  className='text-muted-foreground'
                  disabled={inputLocked || attachments.drafts.length >= 4}
                  aria-label={t('images.add')}
                  title={t('images.add')}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PaperclipIcon className='size-4' />
                </Button>
                {parsedCommand ? (
                  <ActiveAgentPill command={parsedCommand.command} />
                ) : (
                  !text && (
                    <Button
                      type='button'
                      size='sm'
                      variant='ghost'
                      className='h-8 gap-1 px-2 text-muted-foreground text-xs'
                      disabled={inputLocked}
                      onClick={openCommandMenu}
                    >
                      <BotIcon className='size-3.5' />
                      {t('choose_assistant')}
                    </Button>
                  )
                )}
                <div className='flex-1' />
                {isBusy && run ? (
                  <Button
                    type='button'
                    size='icon-sm'
                    variant='outline'
                    className='rounded-lg'
                    onClick={() => void cancelRun(run.uid)}
                    disabled={isCancelling || run.status === 'cancel_requested'}
                    aria-label={t('cancel')}
                    title={t('cancel')}
                  >
                    <SquareIcon className='size-3.5 fill-current' />
                  </Button>
                ) : (
                  <Button
                    type='button'
                    size='icon-sm'
                    className='rounded-lg'
                    disabled={inputDisabled || !canSubmit || isSubmitting}
                    aria-label={t('send')}
                    title={t('send')}
                    onClick={() => void submit()}
                  >
                    {isSubmitting ? (
                      <Loader2Icon className='size-4 animate-spin' />
                    ) : (
                      <ArrowUpIcon className='size-4' />
                    )}
                  </Button>
                )}
              </div>
            </fieldset>
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
  ...nodeProps
}: {
  projectId?: string
  runUid?: string
  width: number
  onResizeStartAction: (event: React.MouseEvent) => void
} & NodeAttachmentProps) {
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
      {...nodeProps}
    />
  )
}
