'use client'

import { FileTextIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { AgentPDFPart } from '@/types/agent'

export function AgentPDF({ pdf }: { pdf: AgentPDFPart }) {
  const t = useTranslations('Chat.images')
  return (
    <div className='flex max-w-60 items-center gap-2 rounded-lg border bg-muted/30 p-2 text-xs'>
      <FileTextIcon className='size-4 shrink-0 text-muted-foreground' />
      <div className='min-w-0'>
        <p className='truncate' title={pdf.filename}>
          {pdf.filename}
        </p>
        <p className='text-muted-foreground'>{t('pdf_ready')}</p>
      </div>
    </div>
  )
}
