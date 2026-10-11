'use client'

import { FileTextIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AttachmentChip } from '@/components/chat/attachment-chip'
import type { AgentPDFPart } from '@/types/agent'

export function AgentPDF({ pdf }: { pdf: AgentPDFPart }) {
  const t = useTranslations('Chat.images')
  return (
    <AttachmentChip
      icon={<FileTextIcon />}
      iconClassName='bg-rose-500/10 text-rose-600'
      title={pdf.filename}
      meta={t('pdf_ready')}
    />
  )
}
