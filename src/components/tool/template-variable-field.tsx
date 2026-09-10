'use client'

import { BracesIcon, CircleAlertIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  type ChangeEvent,
  type KeyboardEvent,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export type ToolTemplateVariableKind =
  | 'outputDir'
  | 'sampleName'
  | 'fileMount'
  | 'optionalParams'
  | 'positionParams'

export interface ToolTemplateVariable {
  name: string
  kind: ToolTemplateVariableKind
}

interface CompletionContext {
  from: number
  to: number
  query: string
}

export function getTemplateCompletionContext(
  value: string,
  cursor: number,
): CompletionContext | null {
  const beforeCursor = value.slice(0, cursor)
  const openBrace = beforeCursor.lastIndexOf('{')
  const closeBrace = beforeCursor.lastIndexOf('}')

  if (openBrace <= closeBrace) return null

  const query = beforeCursor.slice(openBrace + 1)
  if (query.includes('{') || query.includes('\n')) return null

  let to = cursor
  while (to < value.length && !['{', '}', '\n'].includes(value[to])) to += 1
  if (value[to] === '}') to += 1

  return { from: openBrace, to, query }
}

export function findUnknownTemplateVariables(
  value: string,
  variables: ToolTemplateVariable[],
): string[] {
  const knownVariables = new Set(variables.map((variable) => variable.name))
  const unknownVariables = new Set<string>()

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== '{') continue
    if (value[index + 1] === '{') {
      index += 1
      continue
    }

    const closeBrace = value.indexOf('}', index + 1)
    if (closeBrace === -1) break

    const expression = value.slice(index + 1, closeBrace)
    const variableName = expression.split(/[!:]/, 1)[0]
    if (variableName && !knownVariables.has(variableName)) {
      unknownVariables.add(variableName)
    }
    index = closeBrace
  }

  return [...unknownVariables]
}

interface TemplateVariableFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  variables: ToolTemplateVariable[]
  placeholder?: string
  required?: boolean
  multiline?: boolean
  rows?: number
  className?: string
}

export function TemplateVariableField({
  id,
  value,
  onChange,
  variables,
  placeholder,
  required = false,
  multiline = false,
  rows,
  className,
}: TemplateVariableFieldProps) {
  const t = useTranslations('tool.VariableField')
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const [completion, setCompletion] = useState<CompletionContext | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const uniqueVariables = useMemo(() => {
    const names = new Set<string>()
    return variables.filter((variable) => {
      const name = variable.name.trim()
      if (!name || names.has(name)) return false
      names.add(name)
      return true
    })
  }, [variables])

  const suggestions = useMemo(() => {
    if (!completion) return []
    const query = completion.query.toLocaleLowerCase()
    return uniqueVariables.filter((variable) =>
      variable.name.toLocaleLowerCase().startsWith(query),
    )
  }, [completion, uniqueVariables])

  const unknownVariables = useMemo(
    () => findUnknownTemplateVariables(value, uniqueVariables),
    [uniqueVariables, value],
  )
  const hasWarning = unknownVariables.length > 0
  const suggestionsId = `${id}-variable-suggestions`
  const hintId = `${id}-variable-hint`
  const warningId = `${id}-variable-warning`

  const refreshCompletion = (field: HTMLInputElement | HTMLTextAreaElement) => {
    const nextCompletion = getTemplateCompletionContext(
      field.value,
      field.selectionStart ?? field.value.length,
    )
    setCompletion(nextCompletion)
    setActiveIndex(0)
  }

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onChange(event.target.value)
    refreshCompletion(event.target)
  }

  const insertVariable = (variable: ToolTemplateVariable) => {
    const field = fieldRef.current
    const cursor = field?.selectionStart ?? value.length
    const currentCompletion =
      completion ?? getTemplateCompletionContext(value, cursor)
    const token = `{${variable.name}}`
    const from = currentCompletion?.from ?? cursor
    const to = currentCompletion?.to ?? cursor
    const nextValue = `${value.slice(0, from)}${token}${value.slice(to)}`
    const nextCursor = from + token.length

    onChange(nextValue)
    setCompletion(null)
    requestAnimationFrame(() => {
      field?.focus()
      field?.setSelectionRange(nextCursor, nextCursor)
    })
  }

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!completion || suggestions.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(
        (current) => (current - 1 + suggestions.length) % suggestions.length,
      )
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      insertVariable(suggestions[activeIndex] ?? suggestions[0])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setCompletion(null)
    }
  }

  const commonProps = {
    id,
    value,
    placeholder,
    required,
    'aria-autocomplete': 'list' as const,
    'aria-controls': suggestions.length > 0 ? suggestionsId : undefined,
    'aria-describedby': hasWarning ? `${hintId} ${warningId}` : hintId,
    'aria-invalid': hasWarning || undefined,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onClick: (
      event: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => refreshCompletion(event.currentTarget),
    onKeyUp: (
      event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      if (
        !['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(event.key)
      ) {
        refreshCompletion(event.currentTarget)
      }
    },
    onFocus: (
      event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => refreshCompletion(event.currentTarget),
    onBlur: () => setCompletion(null),
  }

  const variableDescription = (variable: ToolTemplateVariable) => {
    switch (variable.kind) {
      case 'outputDir':
        return t('descriptions.outputDir')
      case 'sampleName':
        return t('descriptions.sampleName')
      case 'fileMount':
        return t('descriptions.fileMount')
      case 'optionalParams':
        return t('descriptions.optionalParams')
      case 'positionParams':
        return t('descriptions.positionParams')
    }
  }

  return (
    <div className='relative space-y-1.5'>
      {multiline ? (
        <Textarea
          {...commonProps}
          ref={(node) => {
            fieldRef.current = node
          }}
          rows={rows}
          className={cn('font-mono', className)}
        />
      ) : (
        <Input
          {...commonProps}
          ref={(node) => {
            fieldRef.current = node
          }}
          className={cn('font-mono', className)}
        />
      )}

      {completion && suggestions.length > 0 && (
        <div
          id={suggestionsId}
          role='listbox'
          className='absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md'
        >
          {suggestions.map((variable, index) => (
            <button
              key={variable.name}
              type='button'
              role='option'
              aria-selected={index === activeIndex}
              className={cn(
                'flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left text-sm',
                index === activeIndex && 'bg-accent text-accent-foreground',
              )}
              onMouseDown={(event) => {
                event.preventDefault()
                insertVariable(variable)
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <BracesIcon className='size-4 shrink-0 text-muted-foreground' />
              <code className='shrink-0'>{`{${variable.name}}`}</code>
              <span className='truncate text-xs text-muted-foreground'>
                {variableDescription(variable)}
              </span>
            </button>
          ))}
        </div>
      )}

      <p id={hintId} className='text-xs text-muted-foreground'>
        {t('completionHint', { openBrace: '{' })}
      </p>
      {hasWarning && (
        <div
          id={warningId}
          role='alert'
          className='flex flex-wrap items-center gap-1.5 text-xs text-destructive'
        >
          <CircleAlertIcon className='size-3.5' />
          <span>{t('unknownVariables')}</span>
          {unknownVariables.map((variable) => (
            <code
              key={variable}
              className='rounded bg-destructive/10 px-1 py-0.5'
            >
              {`{${variable}}`}
            </code>
          ))}
        </div>
      )}
    </div>
  )
}
