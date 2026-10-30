'use client'

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  FileDiffIcon,
  Loader2Icon,
  SquareIcon,
  WrenchIcon,
  XIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { type MouseEvent, useState } from 'react'
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
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@/components/ui/trace'
import type { useCodeAgent } from '@/hooks/use-code-agent'
import type { CodeAgentTool } from '@/types/code-agent'

/** One tool call, expanding into its input and output. */
function ToolStep({ tool }: { tool: CodeAgentTool }) {
  const t = useTranslations('code.Agent')
  const line = (
    <TraceLine
      status={
        tool.status === 'running'
          ? 'running'
          : tool.status === 'failed'
            ? 'error'
            : undefined
      }
    >
      <TraceIcon>
        <WrenchIcon />
      </TraceIcon>
      <TraceTitle className='font-mono'>{tool.name}</TraceTitle>
      <TraceDescription>{t(`tool.${tool.status}`)}</TraceDescription>
    </TraceLine>
  )

  if (!tool.detail && !tool.output) return line

  return (
    <TraceCollapsible>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent className='flex flex-col gap-2'>
        {tool.detail && (
          <CodeBlock size='sm'>
            <CodeBlockContent wrap className='max-h-48'>
              {tool.detail}
            </CodeBlockContent>
          </CodeBlock>
        )}
        {tool.output && (
          <CodeBlock
            size='sm'
            variant={tool.status === 'failed' ? 'destructive' : 'default'}
          >
            <CodeBlockContent wrap className='max-h-64'>
              {tool.output}
            </CodeBlockContent>
          </CodeBlock>
        )}
      </TraceCollapsibleContent>
    </TraceCollapsible>
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
                          <BubbleContent className='whitespace-pre-wrap'>
                            {message.text}
                          </BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                    {tools.length > 0 && (
                      <Trace>
                        {tools.map((tool) => (
                          <ToolStep key={tool.call_id} tool={tool} />
                        ))}
                      </Trace>
                    )}
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
              {session && (
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
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
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
