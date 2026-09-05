'use client'

import { python } from '@codemirror/lang-python'
import { StreamLanguage } from '@codemirror/language'
import { r } from '@codemirror/legacy-modes/mode/r'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { unifiedMergeView } from '@codemirror/merge'
import CodeMirror from '@uiw/react-codemirror'
import { PlusIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type KeyboardEvent, useMemo, useState } from 'react'
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
}

export function CodeSourceEditor({
  nodeType,
  code,
  dependencies,
  review,
  onCodeChange,
  onDependenciesChange,
  disabled = false,
}: CodeSourceEditorProps) {
  const t = useTranslations('code.Workspace')
  const [dependencyDraft, setDependencyDraft] = useState('')
  const [cursor, setCursor] = useState({ line: 1, column: 1 })
  const isPython = nodeType === 'code_python'
  const isR = nodeType === 'code_R'
  const supportsDependencies = isPython || isR
  const languageExtensions = useMemo(
    () => [isPython ? python() : StreamLanguage.define(isR ? r : shell)],
    [isPython, isR],
  )
  const editorExtensions = useMemo(
    () =>
      review
        ? [
            ...languageExtensions,
            unifiedMergeView({
              original: code,
              highlightChanges: true,
              gutter: true,
              mergeControls: false,
              allowInlineDiffs: true,
              collapseUnchanged: { margin: 3, minSize: 8 },
            }),
          ]
        : languageExtensions,
    [code, languageExtensions, review],
  )
  const displayedCode = review?.code ?? code
  const lineCount = Math.max(1, displayedCode.split('\n').length)
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
    <div
      className={
        supportsDependencies
          ? 'grid h-full min-h-0 grid-cols-[minmax(0,1fr)_18rem]'
          : 'h-full min-h-0'
      }
    >
      <section className='flex h-full min-h-0 min-w-0 flex-col bg-background'>
        <CodeMirror
          value={displayedCode}
          height='100%'
          theme='light'
          extensions={editorExtensions}
          onChange={onCodeChange}
          editable={!disabled && !review}
          onUpdate={(update) => {
            if (!update.selectionSet && !update.docChanged) return
            const head = update.state.selection.main.head
            const line = update.state.doc.lineAt(head)
            setCursor({ line: line.number, column: head - line.from + 1 })
          }}
          placeholder={
            isPython
              ? t('pythonPlaceholder')
              : isR
                ? t('rPlaceholder')
                : t('bashPlaceholder')
          }
          autoFocus={!review}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            foldGutter: false,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
          }}
          className='min-h-0 flex-1 overflow-hidden text-[13px] [&_.cm-activeLine]:bg-muted/40 [&_.cm-activeLineGutter]:bg-muted/60 [&_.cm-content]:font-mono [&_.cm-editor]:h-full [&_.cm-gutters]:border-r [&_.cm-gutters]:border-border [&_.cm-gutters]:bg-muted/30 [&_.cm-scroller]:bg-background [&_.cm-scroller]:font-mono'
        />

        <div className='flex h-7 shrink-0 items-center justify-between border-t bg-muted/30 px-3 font-mono text-[11px] text-muted-foreground'>
          <div className='flex items-center gap-4'>
            {review && (
              <span className='font-sans font-medium text-primary'>
                {t('reviewingChanges')}
              </span>
            )}
            <span>
              {t('cursorPosition', {
                line: cursor.line,
                column: cursor.column,
              })}
            </span>
            <span>{t('lineCount', { count: lineCount })}</span>
          </div>
          <div className='flex items-center gap-4'>
            <span>UTF-8</span>
            <span>{isPython ? 'Python 3.13' : isR ? 'R 4.4.3' : 'Bash'}</span>
          </div>
        </div>
      </section>

      {supportsDependencies && (
        <aside className='min-h-0 overflow-y-auto border-l bg-muted/20 p-4'>
          <div className='mb-5'>
            <h3 className='font-medium'>
              {isPython ? t('pythonEnvironment') : t('rEnvironment')}
            </h3>
            <p className='mt-1 text-xs leading-5 text-muted-foreground'>
              {isPython ? t('pythonEnvironmentHint') : t('rEnvironmentHint')}
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='dependency-input'>{t('dependency')}</Label>
            <div className='flex gap-2'>
              <Input
                id='dependency-input'
                value={dependencyDraft}
                onChange={(event) => setDependencyDraft(event.target.value)}
                onKeyDown={handleDependencyKeyDown}
                placeholder={
                  isPython
                    ? t('pythonDependencyPlaceholder')
                    : t('rDependencyPlaceholder')
                }
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

          <div className='mt-4 flex min-h-12 flex-wrap content-start gap-2'>
            {displayedDependencies.length ? (
              displayedDependencies.map(({ dependency, status }) => (
                <Badge
                  key={`${status}:${dependency}`}
                  variant='secondary'
                  className={
                    status === 'added'
                      ? 'gap-1 border-emerald-500/50 bg-emerald-500/10 font-mono font-normal text-emerald-700 dark:text-emerald-300'
                      : status === 'removed'
                        ? 'gap-1 border-destructive/40 bg-destructive/10 font-mono font-normal text-destructive line-through'
                        : 'gap-1 border font-mono font-normal'
                  }
                >
                  {status === 'added' && <span aria-hidden='true'>+</span>}
                  {status === 'removed' && <span aria-hidden='true'>−</span>}
                  {dependency}
                  {!review && (
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
              <p className='text-sm text-muted-foreground'>
                {t('noDependencies')}
              </p>
            )}
          </div>
        </aside>
      )}
    </div>
  )
}
