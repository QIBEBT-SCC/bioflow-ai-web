'use client'

import { python } from '@codemirror/lang-python'
import { StreamLanguage } from '@codemirror/language'
import { r } from '@codemirror/legacy-modes/mode/r'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { unifiedMergeView } from '@codemirror/merge'
import CodeMirror, {
  type EditorView,
  keymap,
  Prec,
  type ReactCodeMirrorRef,
  type ViewUpdate,
} from '@uiw/react-codemirror'
import { cn } from 'cn'
import { PlusIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  type KeyboardEvent,
  memo,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CodeNodeType } from '@/types/code'

interface CodeSourceEditorProps {
  nodeType: CodeNodeType
  code: string
  dependencies: string[]
  review?: {
    code: string
    dependencies: string[]
  }
  onCodeChange: (code: string) => void
  onDependenciesChange: (dependencies: string[]) => void
  disabled?: boolean
  readOnly?: boolean
  editorRef?: Ref<ReactCodeMirrorRef>
  /** Formats the source; bound to Shift+Alt+F. */
  onFormat?: () => void
}

/**
 * Replaces the editor's document with `text`, changing only the range that
 * differs so the cursor keeps its place and the edit can be undone.
 */
export function replaceDocument(view: EditorView, text: string) {
  const current = view.state.doc.toString()
  const limit = Math.min(current.length, text.length)
  let start = 0
  while (start < limit && current[start] === text[start]) start++
  let end = 0
  while (
    end < limit - start &&
    current[current.length - 1 - end] === text[text.length - 1 - end]
  )
    end++
  if (start === current.length && start === text.length) return
  view.dispatch({
    changes: {
      from: start,
      to: current.length - end,
      insert: text.slice(start, text.length - end),
    },
    userEvent: 'input.format',
  })
}

const MemoCodeMirror = memo(CodeMirror)

const EDIT_BASIC_SETUP = {
  lineNumbers: true,
  highlightActiveLineGutter: true,
  foldGutter: false,
  bracketMatching: true,
  closeBrackets: true,
  autocompletion: true,
  highlightActiveLine: true,
  highlightSelectionMatches: false,
}

const READONLY_BASIC_SETUP = {
  lineNumbers: true,
  highlightActiveLineGutter: false,
  highlightSpecialChars: true,
  history: false,
  foldGutter: false,
  drawSelection: false,
  dropCursor: false,
  allowMultipleSelections: false,
  indentOnInput: false,
  bracketMatching: false,
  closeBrackets: false,
  autocompletion: false,
  rectangularSelection: false,
  highlightActiveLine: false,
  highlightSelectionMatches: false,
  closeBracketsKeymap: false,
  historyKeymap: false,
  foldKeymap: false,
  completionKeymap: false,
  lintKeymap: false,
  searchKeymap: true,
}

interface CursorStatusHandle {
  schedule: (line: number, column: number) => void
}

const CursorStatus = memo(function CursorStatus({
  ref,
}: {
  ref: Ref<CursorStatusHandle>
}) {
  const t = useTranslations('code.Workspace')
  const [cursor, setCursor] = useState({ line: 1, column: 1 })
  const pendingRef = useRef<{ line: number; column: number } | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      schedule(line: number, column: number) {
        pendingRef.current = { line, column }
        if (rafRef.current !== null) return
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null
          const next = pendingRef.current
          if (!next) return
          setCursor((prev) =>
            prev.line === next.line && prev.column === next.column
              ? prev
              : next,
          )
        })
      },
    }),
    [],
  )

  return (
    <span>
      {t('cursorPosition', {
        line: cursor.line,
        column: cursor.column,
      })}
    </span>
  )
})

export function CodeSourceEditor({
  nodeType,
  code,
  dependencies,
  review,
  onCodeChange,
  onDependenciesChange,
  disabled = false,
  readOnly = false,
  editorRef,
  onFormat,
}: CodeSourceEditorProps) {
  const t = useTranslations('code.Workspace')
  const cursorStatusRef = useRef<CursorStatusHandle>(null)
  const isPython = nodeType === 'code_python'
  const isR = nodeType === 'code_R'
  const isEditable = !disabled && !readOnly && !review
  const formatRef = useRef(onFormat)
  useEffect(() => {
    formatRef.current = onFormat
  }, [onFormat])
  const onCodeChangeRef = useRef(onCodeChange)
  useEffect(() => {
    onCodeChangeRef.current = onCodeChange
  }, [onCodeChange])
  const handleCodeChange = useCallback(
    (value: string) => onCodeChangeRef.current(value),
    [],
  )
  const handleUpdate = useCallback((update: ViewUpdate) => {
    if (!update.selectionSet && !update.docChanged) return
    const head = update.state.selection.main.head
    const line = update.state.doc.lineAt(head)
    cursorStatusRef.current?.schedule(line.number, head - line.from + 1)
  }, [])
  const languageExtensions = useMemo(
    () => [
      isPython ? python() : StreamLanguage.define(isR ? r : shell),
      Prec.high(
        keymap.of([
          {
            key: 'Shift-Alt-f',
            run: () => {
              if (!formatRef.current) return false
              formatRef.current()
              return true
            },
          },
        ]),
      ),
    ],
    [isPython, isR],
  )
  const reviewOriginal = review ? code : undefined
  const editorExtensions = useMemo(
    () =>
      review && reviewOriginal !== undefined
        ? [
            ...languageExtensions,
            unifiedMergeView({
              original: reviewOriginal,
              highlightChanges: true,
              gutter: true,
              mergeControls: false,
              allowInlineDiffs: true,
              collapseUnchanged: { margin: 3, minSize: 8 },
            }),
          ]
        : languageExtensions,
    [languageExtensions, review, reviewOriginal],
  )
  const displayedCode = review?.code ?? code
  const lineCount = useMemo(
    () => Math.max(1, displayedCode.split('\n').length),
    [displayedCode],
  )

  return (
    <div
      className={
        isPython
          ? 'grid h-full min-h-0 grid-cols-[minmax(0,1fr)_18rem]'
          : 'h-full min-h-0'
      }
    >
      <section className='flex h-full min-h-0 min-w-0 flex-col bg-background'>
        <MemoCodeMirror
          ref={editorRef}
          value={displayedCode}
          height='100%'
          theme='light'
          extensions={editorExtensions}
          onChange={handleCodeChange}
          editable={isEditable}
          readOnly={readOnly}
          indentWithTab={isEditable}
          onUpdate={handleUpdate}
          placeholder={
            isPython
              ? t('pythonPlaceholder')
              : isR
                ? t('rPlaceholder')
                : t('bashPlaceholder')
          }
          autoFocus={!review && !readOnly}
          basicSetup={isEditable ? EDIT_BASIC_SETUP : READONLY_BASIC_SETUP}
          className='min-h-0 flex-1 overflow-hidden text-[13px] [&_.cm-activeLine]:bg-muted/40 [&_.cm-activeLineGutter]:bg-muted/60 [&_.cm-content]:font-mono [&_.cm-editor]:h-full [&_.cm-gutters]:border-r [&_.cm-gutters]:border-border [&_.cm-gutters]:bg-muted/30 [&_.cm-scroller]:bg-background [&_.cm-scroller]:font-mono'
        />

        <div className='flex h-7 shrink-0 items-center justify-between border-t bg-muted/30 px-3 font-mono text-[11px] text-muted-foreground'>
          <div className='flex items-center gap-4'>
            {review && (
              <span className='font-sans font-medium text-primary'>
                {t('reviewingChanges')}
              </span>
            )}
            <CursorStatus ref={cursorStatusRef} />
            <span>{t('lineCount', { count: lineCount })}</span>
          </div>
          <div className='flex items-center gap-4'>
            <span>UTF-8</span>
            <span>{isPython ? 'Python 3.13' : isR ? 'R 4.4.3' : 'Bash'}</span>
          </div>
        </div>
      </section>

      {isPython && (
        <DependencyPanel
          dependencies={dependencies}
          review={review}
          onDependenciesChange={onDependenciesChange}
          disabled={disabled}
          readOnly={readOnly}
        />
      )}
    </div>
  )
}

function DependencyPanel({
  dependencies,
  review,
  onDependenciesChange,
  disabled,
  readOnly,
}: Pick<
  CodeSourceEditorProps,
  'dependencies' | 'review' | 'onDependenciesChange'
> & { disabled: boolean; readOnly: boolean }) {
  const t = useTranslations('code.Workspace')
  const [dependencyDraft, setDependencyDraft] = useState('')
  const displayedDependencies = useMemo(() => {
    if (!review) {
      return dependencies.map((dependency) => ({
        dependency,
        status: 'unchanged' as const,
      }))
    }

    const current = new Set(dependencies)
    const proposed = new Set(review.dependencies)
    const removedDependencies = dependencies.reduce<
      Array<{ dependency: string; status: 'removed' }>
    >((removed, dependency) => {
      if (!proposed.has(dependency)) {
        removed.push({ dependency, status: 'removed' })
      }
      return removed
    }, [])
    return [
      ...review.dependencies.map((dependency) => ({
        dependency,
        status: current.has(dependency)
          ? ('unchanged' as const)
          : ('added' as const),
      })),
      ...removedDependencies,
    ]
  }, [dependencies, review])

  const addDependency = () => {
    const dependency = dependencyDraft.trim()
    if (!dependency || dependencies.includes(dependency)) return
    onDependenciesChange([...dependencies, dependency])
    setDependencyDraft('')
  }

  const handleDependencyKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    addDependency()
  }

  return (
    <aside className='min-h-0 overflow-y-auto border-l bg-muted/20 p-4'>
      <div className='mb-5'>
        <h3 className='font-medium'>{t('pythonEnvironment')}</h3>
        <p className='mt-1 text-xs leading-5 text-muted-foreground'>
          {t('pythonEnvironmentHint')}
        </p>
      </div>

      {!readOnly && (
        <div className='space-y-2'>
          <Label htmlFor='dependency-input'>{t('dependency')}</Label>
          <div className='flex gap-2'>
            <Input
              id='dependency-input'
              value={dependencyDraft}
              onChange={(event) => setDependencyDraft(event.target.value)}
              onKeyDown={handleDependencyKeyDown}
              placeholder={t('pythonDependencyPlaceholder')}
              className='bg-background font-mono text-sm'
              disabled={disabled}
            />
            <Button
              type='button'
              variant='outline'
              size='icon'
              onClick={addDependency}
              disabled={disabled || !dependencyDraft.trim()}
              aria-label={t('addDependency')}
            >
              <PlusIcon className='size-4' />
            </Button>
          </div>
        </div>
      )}

      <div
        className={cn(
          'flex min-h-12 flex-wrap content-start gap-2',
          !readOnly && 'mt-4',
        )}
      >
        {displayedDependencies.length ? (
          displayedDependencies.map(({ dependency, status }) => (
            <Badge
              key={`${status}:${dependency}`}
              variant='secondary'
              className={
                status === 'added'
                  ? 'gap-1 border-success/50 bg-success/10 font-mono font-normal text-success'
                  : status === 'removed'
                    ? 'gap-1 border-destructive/40 bg-destructive/10 font-mono font-normal text-destructive line-through'
                    : 'gap-1 border font-mono font-normal'
              }
            >
              {status === 'added' && <span aria-hidden='true'>+</span>}
              {status === 'removed' && <span aria-hidden='true'>−</span>}
              {dependency}
              {!review && !readOnly && (
                <button
                  type='button'
                  disabled={disabled}
                  onClick={() =>
                    onDependenciesChange(
                      dependencies.filter((item) => item !== dependency),
                    )
                  }
                  className='rounded-sm text-muted-foreground hover:text-foreground'
                  aria-label={t('removeDependency', { dependency })}
                >
                  <XIcon className='size-3' />
                </button>
              )}
            </Badge>
          ))
        ) : (
          <p className='text-sm text-muted-foreground'>{t('noDependencies')}</p>
        )}
      </div>
    </aside>
  )
}
