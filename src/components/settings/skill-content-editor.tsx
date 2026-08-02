'use client'

import { markdown } from '@codemirror/lang-markdown'
import { python } from '@codemirror/lang-python'
import { StreamLanguage } from '@codemirror/language'
import { json } from '@codemirror/legacy-modes/mode/javascript'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { xml } from '@codemirror/legacy-modes/mode/xml'
import { yaml } from '@codemirror/legacy-modes/mode/yaml'
import CodeMirror from '@uiw/react-codemirror'
import { EyeIcon, PencilIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { MessageResponse } from '@/components/ai-elements/message'
import { Button } from '@/components/ui/button'

interface SkillContentEditorProps {
  filePath: string
  value: string
  onChange: (value: string) => void
  height?: string
}

function fileExtension(filePath: string) {
  const filename = filePath.split('/').at(-1) ?? filePath
  const dotIndex = filename.lastIndexOf('.')
  return dotIndex >= 0 ? filename.slice(dotIndex + 1).toLowerCase() : ''
}

function languageName(filePath: string) {
  switch (fileExtension(filePath)) {
    case 'md':
    case 'markdown':
      return 'Markdown'
    case 'json':
      return 'JSON'
    case 'yaml':
    case 'yml':
      return 'YAML'
    case 'py':
      return 'Python'
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'Shell'
    case 'xml':
    case 'svg':
      return 'XML'
    default:
      return 'Plain Text'
  }
}

function languageExtension(filePath: string) {
  switch (fileExtension(filePath)) {
    case 'md':
    case 'markdown':
      return markdown()
    case 'json':
      return StreamLanguage.define(json)
    case 'yaml':
    case 'yml':
      return StreamLanguage.define(yaml)
    case 'py':
      return python()
    case 'sh':
    case 'bash':
    case 'zsh':
      return StreamLanguage.define(shell)
    case 'xml':
    case 'svg':
      return StreamLanguage.define(xml)
    default:
      return []
  }
}

function markdownBody(content: string) {
  if (!content.startsWith('---\n')) return content
  const closingDelimiter = content.indexOf('\n---\n', 4)
  return closingDelimiter >= 0
    ? content.slice(closingDelimiter + '\n---\n'.length)
    : content
}

export function SkillContentEditor({
  filePath,
  value,
  onChange,
  height = '440px',
}: SkillContentEditorProps) {
  const t = useTranslations('setting.skill_management')
  const [requestedMode, setRequestedMode] = useState<'preview' | 'edit'>(
    'preview',
  )
  const language = languageName(filePath)
  const canPreview = language === 'Markdown'
  const mode = canPreview ? requestedMode : 'edit'
  const extensions = useMemo(() => [languageExtension(filePath)], [filePath])
  const lineCount = Math.max(1, value.split('\n').length)

  return (
    <div className='overflow-hidden border bg-background'>
      <div className='flex h-10 items-center justify-between border-b bg-muted/20 px-2'>
        <div className='flex items-center gap-1'>
          {canPreview && (
            <Button
              type='button'
              size='sm'
              variant={mode === 'preview' ? 'secondary' : 'ghost'}
              onClick={() => setRequestedMode('preview')}
            >
              <EyeIcon className='size-4' />
              {t('preview')}
            </Button>
          )}
          <Button
            type='button'
            size='sm'
            variant={mode === 'edit' ? 'secondary' : 'ghost'}
            onClick={() => setRequestedMode('edit')}
          >
            <PencilIcon className='size-4' />
            {t('edit')}
          </Button>
        </div>
        <span className='px-2 font-mono text-[11px] text-muted-foreground'>
          {language}
        </span>
      </div>

      {mode === 'preview' ? (
        <div className='overflow-auto px-6 py-5' style={{ height }}>
          <MessageResponse>{markdownBody(value)}</MessageResponse>
        </div>
      ) : (
        <CodeMirror
          value={value}
          height={height}
          theme='light'
          extensions={extensions}
          onChange={onChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            foldGutter: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
          }}
          className='overflow-hidden text-[13px] [&_.cm-activeLine]:bg-muted/40 [&_.cm-activeLineGutter]:bg-muted/60 [&_.cm-content]:font-mono [&_.cm-editor]:h-full [&_.cm-gutters]:border-r [&_.cm-gutters]:border-border [&_.cm-gutters]:bg-muted/30 [&_.cm-scroller]:bg-background [&_.cm-scroller]:font-mono'
        />
      )}

      <div className='flex h-7 items-center justify-between border-t bg-muted/30 px-3 font-mono text-[11px] text-muted-foreground'>
        <span>{t('line_count', { count: lineCount })}</span>
        <span>UTF-8</span>
      </div>
    </div>
  )
}
