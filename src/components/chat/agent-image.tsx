'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { getChatAttachmentPreviewUrl } from '@/app/actions/chat-attachment'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AgentImagePart } from '@/types/agent'

export function AgentImage({ image }: { image: AgentImagePart }) {
  const t = useTranslations('Chat.images')
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  const previewUrl = getChatAttachmentPreviewUrl(image.url)
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
            src={previewUrl}
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
            src={previewUrl}
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
