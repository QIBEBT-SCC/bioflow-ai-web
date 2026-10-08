'use client'

import { ImageIcon, Loader2Icon, XIcon } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ChatAttachmentDraft } from '@/hooks/use-chat-attachment'
import type { AgentImagePart } from '@/types/agent'

export function AgentImage({ image }: { image: AgentImagePart }) {
  const t = useTranslations('Chat.images')
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  const pages =
    image.source_format === 'TIFF'
      ? t('pages', { page: image.page, count: image.page_count })
      : `${image.width} × ${image.height}`
  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        aria-label={t('preview', { name: image.filename })}
        className='flex max-w-full flex-col gap-1 rounded-lg border bg-muted/30 p-2 text-left hover:border-primary/40'
      >
        {failed ? (
          <span className='text-xs text-destructive'>{t('load_failed')}</span>
        ) : (
          <Image
            src={image.url}
            width={image.width}
            height={image.height}
            alt={image.filename}
            unoptimized
            onError={() => setFailed(true)}
            className='max-h-48 w-auto max-w-full rounded object-contain'
          />
        )}
        <span className='max-w-60 truncate text-xs'>{image.filename}</span>
        <span className='text-xs text-muted-foreground'>{pages}</span>
        {image.conversion_note && (
          <span className='text-xs text-muted-foreground'>
            {t('normalized')}
          </span>
        )}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-4xl'>
          <DialogTitle className='pr-5'>{image.filename}</DialogTitle>
          <DialogDescription>
            {pages}
            {image.conversion_note ? ` · ${t('normalized')}` : ''}
          </DialogDescription>
          <Image
            src={image.url}
            width={image.width}
            height={image.height}
            alt={image.filename}
            unoptimized
            className='max-h-[75vh] w-full object-contain'
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export function DraftImages({
  drafts,
  onRemove,
  disabled,
}: {
  drafts: ChatAttachmentDraft[]
  onRemove: (id: string) => void
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
          ) : (
            <div
              className='flex max-w-60 items-center gap-2 rounded-lg border bg-muted/30 p-2 text-xs'
              aria-live='polite'
            >
              {draft.error ? (
                <ImageIcon className='size-4 shrink-0' />
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
                  {draft.error ?? t('preparing')}
                </p>
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
