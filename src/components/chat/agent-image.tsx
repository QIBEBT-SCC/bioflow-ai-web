'use client'

import { ImageOffIcon } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { type ReactNode, useState } from 'react'
import { getChatAttachmentPreviewUrl } from '@/app/actions/chat-attachment'
import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@/components/ui/attachment'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AgentImagePart } from '@/types/agent'

/**
 * Image attachment. `thumb` is a compact row card (composer drafts);
 * `preview` stacks a larger cover above the name (messages). Either opens
 * the full image in a dialog.
 */
export function AgentImage({
  image,
  variant = 'preview',
  actions,
}: {
  image: AgentImagePart
  variant?: 'thumb' | 'preview'
  actions?: ReactNode
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
      <Attachment
        // sm pins the media to an icon tile, so the cover preview stays default.
        size={variant === 'preview' ? 'default' : 'sm'}
        orientation={variant === 'preview' ? 'vertical' : 'horizontal'}
        className={variant === 'thumb' ? 'max-w-52' : undefined}
      >
        <AttachmentMedia variant='image'>
          {failed ? (
            <>
              <ImageOffIcon />
              <span className='sr-only'>{t('load_failed')}</span>
            </>
          ) : (
            <Image
              src={previewUrl}
              width={image.width}
              height={image.height}
              alt={image.filename}
              unoptimized
              onError={() => setFailed(true)}
            />
          )}
          {isMultiPage && variant === 'preview' && (
            <span className='absolute right-1.5 bottom-1.5 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] text-foreground tabular-nums shadow-xs'>
              {image.page}/{image.page_count}
            </span>
          )}
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle title={image.filename}>
            {image.filename}
          </AttachmentTitle>
          <AttachmentDescription>{meta}</AttachmentDescription>
        </AttachmentContent>
        {actions && <AttachmentActions>{actions}</AttachmentActions>}
        <AttachmentTrigger
          aria-label={t('preview', { name: image.filename })}
          onClick={() => setOpen(true)}
        />
      </Attachment>
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
