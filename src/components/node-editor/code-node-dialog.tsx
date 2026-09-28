'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import type { CodeNodeType } from '@/types/code'

const CodeSourceEditor = dynamic(
  () =>
    import('@/components/code/code-source-editor').then(
      (mod) => mod.CodeSourceEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className='flex h-full items-center justify-center'>
        <Spinner />
      </div>
    ),
  },
)

interface CodeValue {
  code: string
  dependencies: string[]
}

interface CodeNodeDialogProps extends CodeValue {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodeType: CodeNodeType
  title: string
  description: string
  readOnly: boolean
  onSave: (value: CodeValue) => void
}

export function CodeNodeDialog({
  open,
  onOpenChange,
  title,
  readOnly,
  ...props
}: CodeNodeDialogProps) {
  const t = useTranslations('editor.node')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // `nokey` keeps React Flow from treating keystrokes here as canvas shortcuts.
        className='nokey flex h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl'
        onInteractOutside={(event) => {
          if (!readOnly) event.preventDefault()
        }}
      >
        <DialogHeader className='shrink-0 border-b px-5 py-4'>
          <DialogTitle>
            {t(readOnly ? 'code_view_title' : 'code_edit_title', { title })}
          </DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        {open && (
          <CodeNodeDialogBody
            {...props}
            readOnly={readOnly}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CodeNodeDialogBody({
  nodeType,
  code,
  dependencies,
  readOnly,
  onSave,
  onClose,
}: Omit<CodeNodeDialogProps, 'open' | 'onOpenChange' | 'title'> & {
  onClose: () => void
}) {
  const t = useTranslations('editor.node')
  const [draft, setDraft] = useState<CodeValue>({ code, dependencies })

  return (
    <>
      <div className='min-h-0 flex-1'>
        <CodeSourceEditor
          nodeType={nodeType}
          code={draft.code}
          dependencies={draft.dependencies}
          onCodeChange={(value) =>
            setDraft((prev) => ({ ...prev, code: value }))
          }
          onDependenciesChange={(value) =>
            setDraft((prev) => ({ ...prev, dependencies: value }))
          }
          readOnly={readOnly}
        />
      </div>
      <DialogFooter className='shrink-0 border-t px-5 py-3'>
        {readOnly ? (
          <Button variant='outline' onClick={onClose}>
            {t('close')}
          </Button>
        ) : (
          <>
            <Button variant='outline' onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button
              onClick={() => {
                onSave(draft)
                onClose()
              }}
            >
              {t('save')}
            </Button>
          </>
        )}
      </DialogFooter>
    </>
  )
}
