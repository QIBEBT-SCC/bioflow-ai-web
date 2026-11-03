'use client'

import { FileTextIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment'
import type { AgentPDFPart } from '@/types/agent'

export function AgentPDF({
  pdf,
  actions,
}: {
  pdf: AgentPDFPart
  actions?: ReactNode
}) {
  const t = useTranslations('Chat.images')
  return (
    <Attachment size='sm' className='max-w-52'>
      <AttachmentMedia className='bg-rose-500/10 text-rose-600'>
        <FileTextIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle title={pdf.filename}>{pdf.filename}</AttachmentTitle>
        <AttachmentDescription>{t('pdf_ready')}</AttachmentDescription>
      </AttachmentContent>
      {actions && <AttachmentActions>{actions}</AttachmentActions>}
    </Attachment>
  )
}
