'use client'

import {
  CheckIcon,
  Loader2Icon,
  SendIcon,
  SquareIcon,
  XIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { type MouseEvent, useState } from 'react'
import { Streamdown } from 'streamdown'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { useCodeAgent } from '@/hooks/use-code-agent'

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
          <XIcon className='size-4' />
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
      <Conversation className='min-h-0' aria-live='polite'>
        <ConversationContent className='gap-4'>
          {!session && (
            <p className='text-sm text-muted-foreground'>{t('opening')}</p>
          )}
          {session?.transcript.length === 0 && (
            <p className='text-sm text-muted-foreground'>{t('empty')}</p>
          )}
          {session?.transcript.map((message) =>
            message.role === 'user' ? (
              <div key={message.turn_id} className='space-y-3'>
                <div className='rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap'>
                  {message.text}
                </div>
                {session.tools.map((tool) =>
                  tool.turn_id === message.turn_id ? (
                    <details
                      key={tool.call_id}
                      className='rounded-lg border text-xs'
                    >
                      <summary className='cursor-pointer px-3 py-2 font-mono'>
                        {tool.name} · {t(`tool.${tool.status}`)}
                      </summary>
                      {tool.detail && (
                        <pre className='overflow-auto border-t p-3 whitespace-pre-wrap'>
                          {tool.detail}
                        </pre>
                      )}
                      {tool.output && (
                        <pre className='max-h-64 overflow-auto border-t p-3 whitespace-pre-wrap'>
                          {tool.output}
                        </pre>
                      )}
                    </details>
                  ) : null,
                )}
                {session.transcript.map((reply) =>
                  reply.role === 'assistant' &&
                  reply.turn_id === message.turn_id ? (
                    <div key={`${reply.turn_id}-reply`} className='text-sm'>
                      <Streamdown>{reply.text}</Streamdown>
                    </div>
                  ) : null,
                )}
              </div>
            ) : null,
          )}
          {(agent.error || session?.error) && (
            <p
              role='alert'
              className='rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'
            >
              {agent.error === 'EDITOR_CHANGED'
                ? t('editorChanged')
                : agent.error || session?.error}
            </p>
          )}
          {session && (
            <p className='flex items-center gap-2 text-xs text-muted-foreground'>
              {active && <Loader2Icon className='size-3 animate-spin' />}
              {t(`status.${session.status}`)}
              {!connected &&
                session.status !== 'closed' &&
                ` · ${t('reconnecting')}`}
            </p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      {session?.proposal && (
        <div className='space-y-3 border-t bg-muted/30 p-4'>
          <p className='text-sm font-medium'>{t('review')}</p>
          <p className='text-xs text-muted-foreground'>{t('acceptHint')}</p>
          {session.proposal.warnings.map((warning) => (
            <p key={warning} className='text-xs text-warning'>
              {warning}
            </p>
          ))}
          <div className='flex gap-2'>
            <Button
              size='sm'
              disabled={working}
              onClick={() => void agent.decide('accept')}
            >
              <CheckIcon className='size-4' />
              {t('accept')}
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={working}
              onClick={() => void agent.decide('reject')}
            >
              <XIcon className='size-4' />
              {t('reject')}
            </Button>
          </div>
        </div>
      )}
      <div className='space-y-2 border-t p-3'>
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={t('placeholder')}
          className='min-h-24 resize-none'
          maxLength={100000}
          disabled={!session || session.status !== 'ready' || working}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault()
              void send()
            }
          }}
        />
        <div className='flex justify-end'>
          {active ? (
            <Button
              variant='outline'
              size='sm'
              disabled={working || session.status === 'cancelling'}
              onClick={() => void agent.stop()}
            >
              <SquareIcon className='size-3' />
              {t('stop')}
            </Button>
          ) : (
            <Button
              size='sm'
              disabled={
                !prompt.trim() ||
                !session ||
                session.status !== 'ready' ||
                working
              }
              onClick={() => void send()}
            >
              <SendIcon className='size-4' />
              {t('send')}
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
