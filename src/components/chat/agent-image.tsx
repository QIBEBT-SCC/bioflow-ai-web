'use client'

import { ImageOffIcon } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import type { AgentImagePart } from '@/types/agent'

/**
 * Image attachment. `thumb` is a square tile matching the attachment chip
 * height (composer drafts); `preview` is a larger cover image (messages).
 * Either opens the full image in a dialog.
 */
export function AgentImage({
  image,
  variant = 'preview',
}: {
  image: AgentImagePart
  variant?: 'thumb' | 'preview'
}) {
  const t = useTranslations('Chat.images')
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  const previewUrl = getChatAttachmentPreviewUrl(image.url)
  const isMultiPage = image.source_format === 'TIFF' && image.page_count > 1
  const meta =
    image.source_format === 'TIFF'
      ? t('pages', { page: image.page, count: image.page_count })
      : `${image.width} × ${image.height}`

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        aria-label={t('preview', { name: image.filename })}
        title={`${image.filename} · ${meta}`}
        className={cn(
          'relative block shrink-0 overflow-hidden rounded-lg border bg-muted shadow-xs transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          variant === 'thumb' ? 'size-12' : 'h-32 w-44 rounded-xl',
        )}
      >
        {failed ? (
          <span className='flex size-full items-center justify-center text-muted-foreground'>
            <ImageOffIcon className='size-4' />
            <span className='sr-only'>{t('load_failed')}</span>
          </span>
        ) : (
          <Image
            src={previewUrl}
            width={image.width}
            height={image.height}
            alt={image.filename}
            unoptimized
            onError={() => setFailed(true)}
            className='size-full object-cover'
          />
        )}
        {isMultiPage && variant === 'preview' && (
          <span className='absolute right-1.5 bottom-1.5 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] text-foreground tabular-nums shadow-xs'>
            {image.page}/{image.page_count}
          </span>
        )}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-4xl'>
          <DialogTitle className='pr-5'>{image.filename}</DialogTitle>
          <DialogDescription>
            {meta}
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
