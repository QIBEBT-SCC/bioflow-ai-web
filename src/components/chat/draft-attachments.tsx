'use client'

import {
  FileTextIcon,
  ImageIcon,
  Loader2Icon,
  RotateCcwIcon,
  XIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AgentImage } from '@/components/chat/agent-image'
import { AgentPDF } from '@/components/chat/agent-pdf'
import { Button } from '@/components/ui/button'
import type { ChatAttachmentDraft } from '@/hooks/use-chat-attachment'

export function DraftAttachments({
  drafts,
  onRemove,
  onRetry,
  disabled,
}: {
  drafts: ChatAttachmentDraft[]
  onRemove: (id: string) => void
  onRetry: (id: string) => void
  disabled: boolean
}) {
  const t = useTranslations('Chat.images')
  if (drafts.length === 0) return null
  return (
    <fieldset
      className='flex flex-wrap gap-2 px-3 pt-3'
      aria-label={t('attachments')}
    >
      {drafts.map((draft) => (
        <div key={draft.id} className='relative max-w-full pr-7'>
          {draft.image ? (
            <AgentImage image={draft.image} />
          ) : draft.pdf ? (
            <AgentPDF pdf={draft.pdf} />
          ) : (
            <div
              className='flex max-w-60 items-center gap-2 rounded-lg border bg-muted/30 p-2 text-xs'
              aria-live='polite'
            >
              {draft.error ? (
                /\.pdf$/i.test(draft.filename) ? (
                  <FileTextIcon className='size-4 shrink-0' />
                ) : (
                  <ImageIcon className='size-4 shrink-0' />
                )
              ) : (
                <Loader2Icon className='size-4 shrink-0 animate-spin' />
              )}
              <div className='min-w-0'>
                <p className='truncate'>{draft.filename}</p>
                <p
                  className={
                    draft.error ? 'text-destructive' : 'text-muted-foreground'
                  }
                >
                  {draft.error ??
                    t(
                      /\.pdf$/i.test(draft.filename)
                        ? 'pdf_parsing'
                        : 'preparing',
                    )}
                </p>
                {draft.error && draft.file && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    disabled={disabled}
                    onClick={() => onRetry(draft.id)}
                  >
                    <RotateCcwIcon className='size-3' />
                    {t('retry')}
                  </Button>
                )}
              </div>
            </div>
          )}
          <Button
            type='button'
            size='icon'
            variant='ghost'
            className='absolute top-0 right-0 size-6'
            disabled={disabled}
            aria-label={t('remove', { name: draft.filename })}
            onClick={() => onRemove(draft.id)}
          >
            <XIcon className='size-3' />
          </Button>
        </div>
      ))}
    </fieldset>
  )
}
