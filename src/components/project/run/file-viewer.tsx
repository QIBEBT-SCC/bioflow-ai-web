import { AlertCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ContactPreview } from '@/components/project/run/contact-preview'
import { getRunFileViewUrl } from '@/components/project/run/file-view-url'
import { GenomePreview } from '@/components/project/run/genome-preview'
import { JsonViewer } from '@/components/project/run/json-viewer'
import { MsaPreview } from '@/components/project/run/msa-preview'
import { NewickPreview } from '@/components/project/run/newick-preview'
import type { FileType } from '@/components/project/run/run-tab-bar'
import { ScrollArea } from '@/components/ui/scroll-area'

interface FileViewerProps {
  fileName: string
  fileType: FileType
  path: string
  runUid: string
  generation: number
  active: boolean
  content?: string // text / json
  blobUrl?: string // image
  loading?: boolean
  error?: string
}

export function FileViewer({
  fileName,
  fileType,
  path,
  runUid,
  generation,
  active,
  content,
  blobUrl,
  loading,
  error,
}: FileViewerProps) {
  const t = useTranslations('Project.runDetail.fileViewer')

  if (loading) {
    return (
      <div className='flex h-full items-center justify-center text-muted-foreground'>
        <Loader2 className='mr-2 size-4 animate-spin' />
        <span className='text-sm'>{t('loading')}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-2 text-destructive'>
        <AlertCircle className='size-8' />
        <p className='text-sm font-medium'>{fileName}</p>
        <p className='max-w-md text-center text-xs text-muted-foreground'>
          {error}
        </p>
      </div>
    )
  }

  if (fileType === 'unknown') {
    return (
      <div
        role='alert'
        className='flex h-full items-center justify-center p-4 text-muted-foreground'
      >
        {t('unsupported')}
      </div>
    )
  }

  if (fileType === 'bigwig' || fileType === 'bigbed' || fileType === 'bed') {
    return (
      <GenomePreview
        runUid={runUid}
        generation={generation}
        path={path}
        active={active}
      />
    )
  }

  if (fileType === 'hic' || fileType === 'cool' || fileType === 'mcool') {
    return (
      <ContactPreview
        runUid={runUid}
        generation={generation}
        path={path}
        active={active}
      />
    )
  }

  if (fileType === 'image' && blobUrl) {
    return (
      <div className='relative flex size-full items-center justify-center overflow-auto p-4'>
        <Image
          src={blobUrl}
          alt={fileName}
          fill
          unoptimized
          sizes='100vw'
          className='object-contain'
        />
      </div>
    )
  }

  if (fileType === 'pdf') {
    const url = getRunFileViewUrl(runUid, generation, path)
    return (
      <object
        data={url}
        type='application/pdf'
        aria-label={fileName}
        className='size-full'
      >
        <a href={url} target='_blank' rel='noopener noreferrer'>
          {fileName}
        </a>
      </object>
    )
  }

  if (fileType === 'json' && content !== undefined) {
    return <JsonViewer content={content} />
  }

  if (fileType === 'newick' && content !== undefined) {
    return <NewickPreview content={content} fileName={fileName} />
  }

  if (fileType === 'msa' && content !== undefined) {
    return <MsaPreview content={content} />
  }

  if (fileType === 'html') {
    const url = getRunFileViewUrl(runUid, generation, path)
    return (
      <iframe
        src={url}
        title={fileName}
        className='size-full border-0'
        sandbox='allow-scripts allow-same-origin'
      />
    )
  }

  if (content !== undefined) {
    return (
      <ScrollArea className='size-full'>
        <pre className='p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap wrap-break-word'>
          {content}
        </pre>
      </ScrollArea>
    )
  }

  return (
    <div className='flex h-full items-center justify-center text-muted-foreground'>
      <p className='text-sm'>{t('empty')}</p>
    </div>
  )
}
