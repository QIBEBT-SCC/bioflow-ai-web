'use client'

import { python } from '@codemirror/lang-python'
import { StreamLanguage } from '@codemirror/language'
import { shell } from '@codemirror/legacy-modes/mode/shell'
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
  onCodeChange: (code: string) => void
  onDependenciesChange: (dependencies: string[]) => void
}

export function CodeSourceEditor({
  nodeType,
  code,
  dependencies,
  onCodeChange,
  onDependenciesChange,
}: CodeSourceEditorProps) {
  const t = useTranslations('code.Workspace')
  const [dependencyDraft, setDependencyDraft] = useState('')
  const [cursor, setCursor] = useState({ line: 1, column: 1 })
  const isPython = nodeType === 'code_python'
  const languageExtensions = useMemo(
    () => [isPython ? python() : StreamLanguage.define(shell)],
    [isPython],
  )
  const lineCount = Math.max(1, code.split('\n').length)

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
        isPython
          ? 'grid h-full min-h-0 grid-cols-[minmax(0,1fr)_18rem]'
          : 'h-full min-h-0'
      }
    >
      <section className='flex h-full min-h-0 min-w-0 flex-col bg-background'>
        <CodeMirror
          value={code}
          height='100%'
          theme='light'
          extensions={languageExtensions}
          onChange={onCodeChange}
          onUpdate={(update) => {
            if (!update.selectionSet && !update.docChanged) return
            const head = update.state.selection.main.head
            const line = update.state.doc.lineAt(head)
            setCursor({ line: line.number, column: head - line.from + 1 })
          }}
          placeholder={isPython ? t('pythonPlaceholder') : t('bashPlaceholder')}
          autoFocus
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
            <span>{isPython ? 'Python 3.13' : 'Bash'}</span>
          </div>
        </div>
      </section>

      {isPython && (
        <aside className='min-h-0 overflow-y-auto border-l bg-muted/20 p-4'>
          <div className='mb-5'>
            <h3 className='font-medium'>{t('environment')}</h3>
            <p className='mt-1 text-xs leading-5 text-muted-foreground'>
              {t('environmentHint')}
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
                placeholder={t('dependencyPlaceholder')}
                className='bg-background font-mono text-sm'
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={addDependency}
                disabled={!dependencyDraft.trim()}
                aria-label={t('addDependency')}
              >
                <PlusIcon className='size-4' />
              </Button>
            </div>
          </div>

          <div className='mt-4 flex min-h-12 flex-wrap content-start gap-2'>
            {dependencies.length ? (
              dependencies.map((dependency) => (
                <Badge
                  key={dependency}
                  variant='secondary'
                  className='gap-1 border font-mono font-normal'
                >
                  {dependency}
                  <button
                    type='button'
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
