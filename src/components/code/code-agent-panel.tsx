'use client'

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  FileDiffIcon,
  FilePenLineIcon,
  Loader2Icon,
  type LucideIcon,
  SparklesIcon,
  SquareIcon,
  TerminalIcon,
  WrenchIcon,
  XIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { type MouseEvent, useState } from 'react'
import {
  CommandDetail,
  Step,
  type StepStatus,
  StepsSummary,
} from '@/components/chat/agent-run-content'
import { Markdown } from '@/components/markdown'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Button } from '@/components/ui/button'
import { CodeBlock, CodeBlockContent } from '@/components/ui/code-block'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { Message, MessageContent } from '@/components/ui/message'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller'
import { TraceIcon, TraceLine, TraceTitle } from '@/components/ui/trace'
import type { useCodeAgent } from '@/hooks/use-code-agent'
import type { CodeAgentTool } from '@/types/code-agent'

const TOOL_ICONS: Record<string, LucideIcon> = {
  run_command: TerminalIcon,
  apply_patch: FilePenLineIcon,
  load_skill: SparklesIcon,
  read_skill_resource: SparklesIcon,
}

const TOOL_STATUSES: Record<CodeAgentTool['status'], StepStatus> = {
  running: 'running',
  completed: undefined,
  failed: 'error',
  cancelled: 'cancelled',
}

/** A tool call's label, worded like the main chat's coding sub-agent steps. */
function useToolLabel() {
  const t = useTranslations('Chat.progress')
  return (tool: CodeAgentTool) => {
    const phase = tool.status === 'running' ? 'active' : 'complete'
    const subject = tool.subject || '…'
    switch (tool.name) {
      case 'run_command':
        return t(`tool_creation.container_command.plain.${phase}`)
      case 'apply_patch':
        return t(`tool.apply_patch.${phase}`, { file: subject })
      case 'load_skill':
      case 'read_skill_resource':
        return t(`tool.${tool.name}.${phase}`, { subject })
      default:
        return tool.name
    }
  }
}

/** One tool call; its command and failure output expand under it. */
function ToolStep({ tool, label }: { tool: CodeAgentTool; label: string }) {
  const status = TOOL_STATUSES[tool.status]
  const failure = tool.status === 'failed' && tool.output
  return (
    <Step
      icon={TOOL_ICONS[tool.name] ?? WrenchIcon}
      title={label}
      status={status}
      defaultOpen={status === 'running' && Boolean(tool.detail)}
    >
      {tool.detail || failure ? (
        <div className='flex flex-col gap-2'>
          {tool.detail && <CommandDetail command={tool.detail} />}
          {failure && (
            <CodeBlock size='sm' variant='destructive'>
              <CodeBlockContent wrap className='max-h-48'>
                {tool.output}
              </CodeBlockContent>
            </CodeBlock>
          )}
        </div>
      ) : null}
    </Step>
  )
}

/** The tool calls of one turn, folded under a summary like the main chat's. */
function TurnTrace({
  tools,
  active,
}: {
  tools: CodeAgentTool[]
  active: boolean
}) {
  const t = useTranslations('Chat.progress')
  const label = useToolLabel()
  const latest = tools.at(-1)
  const currentLabel = latest ? label(latest) : t('fallback_activity')

  if (tools.length === 0) {
    return active ? (
      <TraceLine status='running'>
        <TraceIcon>
          <Loader2Icon className='animate-spin' />
        </TraceIcon>
        <TraceTitle>{currentLabel}</TraceTitle>
      </TraceLine>
    ) : null
  }

  return (
    <StepsSummary
      status={
        active
          ? 'running'
          : tools.some((tool) => tool.status === 'cancelled')
            ? 'cancelled'
            : undefined
      }
      currentLabel={currentLabel}
      count={tools.length}
      latestId={latest?.call_id}
    >
      {tools.map((tool) => (
        <ToolStep
          key={`${tool.call_id}-${tool.status}`}
          tool={tool}
          label={label(tool)}
        />
      ))}
    </StepsSummary>
  )
}

interface Props {
  agent: ReturnType<typeof useCodeAgent>
  width: number
  onResizeStart: (event: MouseEvent) => void
  onClose: () => void
}
export function CodeAgentPanel({
  agent,
  width,
  onResizeStart,
  onClose,
}: Props) {
  const t = useTranslations('code.Agent')
  const locale = useLocale()
  const [prompt, setPrompt] = useState('')
  const { session, availability, working, connected } = agent
  const send = async () => {
    if (!prompt.trim() || working || session?.status !== 'ready') return
    const text = prompt
    const sent = await agent.send(text, locale === 'zh' ? 'zh' : 'en')
    if (sent) setPrompt((current) => (current === text ? '' : current))
  }
  const active =
    session && ['queued', 'running', 'cancelling'].includes(session.status)
  return (
    <aside
      className='relative flex h-full min-h-0 shrink-0 flex-col border-l bg-background'
      style={{ width }}
      aria-label={t('title')}
    >
      <button
        type='button'
        className='absolute inset-y-0 -left-1 z-10 w-2 cursor-col-resize hover:bg-primary/20'
        onMouseDown={onResizeStart}
        aria-label={t('resize')}
      />
      <header className='flex h-12 shrink-0 items-center gap-2 border-b px-4'>
        <span className='flex-1 text-sm font-medium'>{t('title')}</span>
        <Button asChild variant='ghost' size='sm'>
          <Link href='/setting/llm?tab=assignment'>{t('settings')}</Link>
        </Button>
        <Button
          variant='ghost'
          size='icon'
          onClick={onClose}
          aria-label={t('close')}
        >
          <XIcon />
        </Button>
      </header>
      <div className='border-b px-4 py-3 text-xs text-muted-foreground'>
        <p>{t('temporary')}</p>
        {availability?.model_name && (
          <p className='mt-1'>
            {t('model', { name: availability.model_name })}
          </p>
        )}
        {availability && !availability.available && (
          <p className='mt-2 text-warning'>
            {t('unconfigured')}{' '}
            <Link className='underline' href='/setting/llm?tab=assignment'>
              {t('configure')}
            </Link>
          </p>
        )}
      </div>
      <MessageScrollerProvider key={session?.id ?? 'opening'} autoScroll>
        <MessageScroller className='min-h-0 flex-1'>
          <MessageScrollerViewport>
            <MessageScrollerContent className='gap-6 p-4'>
              {!session && (
                <MessageScrollerItem className='text-sm text-muted-foreground'>
                  {t('opening')}
                </MessageScrollerItem>
              )}
              {session?.transcript.length === 0 && (
                <MessageScrollerItem className='text-sm text-muted-foreground'>
                  {t('empty')}
                </MessageScrollerItem>
              )}
              {session?.transcript.map((message) => {
                if (message.role !== 'user') return null
                const tools = session.tools.filter(
                  (tool) => tool.turn_id === message.turn_id,
                )
                const replies = session.transcript.filter(
                  (reply) =>
                    reply.role === 'assistant' &&
                    reply.turn_id === message.turn_id,
                )
                return (
                  <MessageScrollerItem
                    key={message.turn_id}
                    messageId={message.turn_id}
                    scrollAnchor
                    className='flex flex-col gap-3'
                  >
                    <Message align='end'>
                      <MessageContent>
                        <Bubble align='end' variant='tinted'>
                          <BubbleContent>
                            <Markdown>{message.text}</Markdown>
                          </BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                    <TurnTrace
                      tools={tools}
                      active={
                        Boolean(active) && session.turn_id === message.turn_id
                      }
                    />
                    {replies.map((reply) => (
                      <Markdown
                        key={`${reply.turn_id}-${reply.text}`}
                        className='leading-relaxed'
                      >
                        {reply.text}
                      </Markdown>
                    ))}
                  </MessageScrollerItem>
                )
              })}
              {(agent.error || session?.error) && (
                <MessageScrollerItem>
                  <Alert variant='destructive'>
                    <AlertDescription>
                      {agent.error === 'EDITOR_CHANGED'
                        ? t('editorChanged')
                        : agent.error || session?.error}
                    </AlertDescription>
                  </Alert>
                </MessageScrollerItem>
              )}
              {session && (session.status !== 'running' || !connected) && (
                <MessageScrollerItem aria-live='polite'>
                  <TraceLine status={active ? 'running' : undefined}>
                    {active && (
                      <TraceIcon>
                        <Loader2Icon className='animate-spin' />
                      </TraceIcon>
                    )}
                    <TraceTitle className='text-xs'>
                      {t(`status.${session.status}`)}
                      {!connected &&
                        session.status !== 'closed' &&
                        ` · ${t('reconnecting')}`}
                    </TraceTitle>
                  </TraceLine>
                </MessageScrollerItem>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton className='data-[direction=end]:bottom-3'>
            <ArrowDownIcon />
            <span className='sr-only'>{t('scrollToLatest')}</span>
          </MessageScrollerButton>
        </MessageScroller>
      </MessageScrollerProvider>
      <div className='flex shrink-0 flex-col gap-2 border-t p-3'>
        {session?.proposal && (
          <Item variant='outline' size='sm' className='rounded-xl bg-card'>
            <ItemMedia variant='icon'>
              <FileDiffIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t('review')}</ItemTitle>
              <ItemDescription className='line-clamp-none'>
                {t('acceptHint')}
              </ItemDescription>
            </ItemContent>
            {session.proposal.warnings.length > 0 && (
              <ItemFooter className='flex-col items-start gap-1'>
                {session.proposal.warnings.map((warning) => (
                  <p key={warning} className='text-xs text-warning'>
                    {warning}
                  </p>
                ))}
              </ItemFooter>
            )}
            <ItemFooter className='justify-end'>
              <ItemActions>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={working}
                  onClick={() => void agent.decide('reject')}
                >
                  <XIcon />
                  {t('reject')}
                </Button>
                <Button
                  size='sm'
                  disabled={working}
                  onClick={() => void agent.decide('accept')}
                >
                  <CheckIcon />
                  {t('accept')}
                </Button>
              </ItemActions>
            </ItemFooter>
          </Item>
        )}
        <InputGroup className='rounded-xl bg-card shadow-sm'>
          <InputGroupTextarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={t('placeholder')}
            aria-label={t('placeholder')}
            className='max-h-60 min-h-20 p-3'
            maxLength={100000}
            disabled={!session || session.status !== 'ready' || working}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                if (event.nativeEvent.isComposing) return
                event.preventDefault()
                void send()
              }
            }}
          />
          <InputGroupAddon align='block-end'>
            {active ? (
              <InputGroupButton
                size='icon-sm'
                variant='outline'
                className='ml-auto rounded-full'
                disabled={working || session.status === 'cancelling'}
                onClick={() => void agent.stop()}
                aria-label={t('stop')}
                title={t('stop')}
              >
                <SquareIcon className='size-3 fill-current' />
              </InputGroupButton>
            ) : (
              <InputGroupButton
                size='icon-sm'
                variant='default'
                className='ml-auto rounded-full'
                disabled={
                  !prompt.trim() ||
                  !session ||
                  session.status !== 'ready' ||
                  working
                }
                onClick={() => void send()}
                aria-label={t('send')}
                title={t('send')}
              >
                <ArrowUpIcon />
              </InputGroupButton>
            )}
          </InputGroupAddon>
        </InputGroup>
      </div>
    </aside>
  )
}
