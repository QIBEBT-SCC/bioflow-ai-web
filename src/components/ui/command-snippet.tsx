'use client'

import type { ComponentProps } from 'react'
import { CopyButton } from '@/components/ui/copy-button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { cn } from 'cn'

export type CommandSnippetProps = Omit<
  ComponentProps<typeof InputGroup>,
  'children'
> & {
  value: string
  /** Text shown before the command, e.g. `$`. Omit to hide it. */
  prompt?: string
}

/** A read-only, single-line command with a copy button. */
export function CommandSnippet({
  value,
  prompt,
  className,
  ...props
}: CommandSnippetProps) {
  return (
    <InputGroup className={cn('bg-muted font-mono', className)} {...props}>
      {prompt && (
        <InputGroupAddon className='pl-1'>
          <InputGroupText className='pl-2 font-normal text-muted-foreground'>
            {prompt}
          </InputGroupText>
        </InputGroupAddon>
      )}
      <InputGroupInput readOnly value={value} className='text-foreground' />
      <InputGroupAddon align='inline-end' className='pr-2'>
        <CopyButton code={value} />
      </InputGroupAddon>
    </InputGroup>
  )
}
