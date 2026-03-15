'use client'

import { CheckIcon, CopyIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function copyToClipboard(text: string): Promise<void> {
  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
  }
  // fallback for non-secure contexts
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.cssText = 'position:fixed;opacity:0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
  return Promise.resolve()
}

export type CopyButtonProps = Omit<ComponentProps<typeof Button>, 'onClick'> & {
  code: string
  timeout?: number
  onCopy?: () => void
  onError?: (error: Error) => void
}

export function CopyButton({
  code,
  timeout = 2000,
  onCopy,
  onError,
  className,
  children,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number>(0)

  const handleCopy = useCallback(async () => {
    if (copied) return
    try {
      await copyToClipboard(code)
      setCopied(true)
      onCopy?.()
      timer.current = window.setTimeout(() => setCopied(false), timeout)
    } catch (e) {
      onError?.(e as Error)
    }
  }, [code, copied, timeout, onCopy, onError])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const Icon = copied ? CheckIcon : CopyIcon

  return (
    <Button
      type='button'
      variant='ghost'
      size='icon'
      aria-label='Copy'
      title='Copy'
      className={cn('size-8 p-0', className)}
      onClick={handleCopy}
      {...props}
    >
      {children ?? <Icon className='size-3.5' />}
    </Button>
  )
}
