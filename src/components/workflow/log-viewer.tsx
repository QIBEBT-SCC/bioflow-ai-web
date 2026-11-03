'use client'

import { cn } from 'cn'
import { TerminalIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ComponentProps, ReactNode } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from '@/components/ui/code-block'
import { useHighlightedCode } from '@/hooks/use-highlighted-code'

const DEFAULT_MAX_LINES = 5000
// The hidden head grows in steps rather than line by line, so output that is
// appended between steps still starts with the text already highlighted.
const WINDOW_STEP = 1000

function tailLines(content: string, maxLines: number) {
  const lines = content.split('\n')
  if (lines.length <= maxLines) return { text: content, omitted: 0 }

  const step = Math.min(WINDOW_STEP, maxLines)
  const omitted = Math.ceil((lines.length - maxLines) / step) * step
  return { text: lines.slice(omitted).join('\n'), omitted }
}

export type LogViewerProps = Omit<
  ComponentProps<typeof CodeBlock>,
  'children'
> & {
  content: string
  /** Shown in a header with a copy button; without it the copy button floats. */
  title?: ReactNode
  streaming?: boolean
  autoScroll?: boolean
  /** Only the last lines are rendered; copying still copies the whole log. */
  maxLines?: number
  contentClassName?: string
}

/** Read-only log output with ANSI colors, always on a dark surface. */
export function LogViewer({
  content,
  title,
  streaming = false,
  autoScroll = false,
  maxLines = DEFAULT_MAX_LINES,
  size = 'sm',
  className,
  contentClassName,
  ...props
}: LogViewerProps) {
  const t = useTranslations('LogViewer')
  const { text, omitted } = useMemo(
    () => tailLines(content, maxLines),
    [content, maxLines],
  )
  const lines = useHighlightedCode(text, 'ansi')
  const contentRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    const el = contentRef.current
    if (autoScroll && el && lines.length) el.scrollTop = el.scrollHeight
  }, [autoScroll, lines])

  const copyButton = <CodeBlockCopyButton value={content} />

  return (
    <CodeBlock
      size={size}
      // `dark` scopes the dark tokens (and Shiki's dark colors) to the log only.
      // `dark:bg-background` beats CodeBlock's translucent dark background
      // when the log sits inside another dark surface.
      className={cn('dark bg-background dark:bg-background', className)}
      {...props}
    >
      {title ? (
        <CodeBlockHeader>
          <CodeBlockTitle className='font-mono'>
            <TerminalIcon />
            {title}
          </CodeBlockTitle>
          <CodeBlockActions>{copyButton}</CodeBlockActions>
        </CodeBlockHeader>
      ) : (
        <CodeBlockActions>{copyButton}</CodeBlockActions>
      )}
      <CodeBlockContent
        ref={contentRef}
        wrap
        className={cn('max-h-96', contentClassName)}
      >
        {omitted > 0 && (
          <CodeBlockLine className='text-muted-foreground italic select-none'>
            {t('truncated', { count: omitted })}
          </CodeBlockLine>
        )}
        {lines.map((line, index) => {
          const content =
            streaming && index === lines.length - 1 ? (
              <>
                {line}
                <span className='ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-foreground/60 align-middle' />
              </>
            ) : (
              line
            )
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: lines are positional and never reorder
            <CodeBlockLine key={index}>{content}</CodeBlockLine> // react-doctor-disable-line react-doctor/no-array-index-as-key
          )
        })}
      </CodeBlockContent>
    </CodeBlock>
  )
}
