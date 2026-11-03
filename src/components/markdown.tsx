'use client'

import 'katex/dist/katex.min.css'
import 'streamdown/styles.css'

import { cjk } from '@streamdown/cjk'
import { code } from '@streamdown/code'
import { math } from '@streamdown/math'
import { mermaid } from '@streamdown/mermaid'
import { cn } from 'cn'
import { type ComponentProps, memo } from 'react'
import { Streamdown } from 'streamdown'

const plugins = { code, math, mermaid, cjk }

export type MarkdownProps = ComponentProps<typeof Streamdown>

/** Shared markdown renderer for agent replies, plans, artifacts and skills. */
export const Markdown = memo(function Markdown({
  className,
  mode = 'static',
  ...props
}: MarkdownProps) {
  return (
    <Streamdown
      className={cn(
        // Streamdown frames tables, code and diagrams with bg-sidebar; use the card surface instead.
        'size-full [--sidebar:var(--card)] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        className,
      )}
      mode={mode}
      plugins={plugins}
      {...props}
    />
  )
})
