'use client'

import {
  AlertCircle,
  ChartNoAxesCombined,
  FileText,
  Loader2,
} from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { ContactPreview } from '@/components/project/run/contact-preview'
import { usesRunTextPreview } from '@/components/project/run/file-type'
import { getRunFileViewUrl } from '@/components/project/run/file-view-url'
import { GenomePreview } from '@/components/project/run/genome-preview'
import { GfaPreview } from '@/components/project/run/gfa-preview'
import { JsonViewer } from '@/components/project/run/json-viewer'
import { MsaPreview } from '@/components/project/run/msa-preview'
import { NewickPreview } from '@/components/project/run/newick-preview'
import type { FileType } from '@/components/project/run/run-tab-bar'
import { TablePreview } from '@/components/project/run/table-preview'
import { VcfPreview } from '@/components/project/run/vcf-preview'
import { Button } from '@/components/ui/button'
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

export function FileViewer(props: FileViewerProps) {
  const t = useTranslations('Project.runDetail.fileViewer')
  const [showVisualization, setShowVisualization] = useState(false)
  const textPreview = usesRunTextPreview(props.fileName, props.fileType)
  const canSwitch = textPreview && props.fileType !== 'text'
  const visualize = !textPreview || showVisualization
  const bypassTextStatus =
    textPreview &&
    visualize &&
    !['newick', 'msa', 'gfa'].includes(props.fileType)

  return (
    <div className='flex size-full min-h-0 flex-col'>
      {canSwitch && (
        <div className='flex shrink-0 items-center justify-between gap-3 border-b bg-muted/30 px-4 py-2'>
          <span className='text-xs text-muted-foreground'>
            {t(visualize ? 'advancedVisualization' : 'originalText')}
          </span>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => setShowVisualization((current) => !current)}
          >
            {visualize ? (
              <FileText className='size-4' />
            ) : (
              <ChartNoAxesCombined className='size-4' />
            )}
            {t(visualize ? 'backToText' : 'advancedVisualization')}
          </Button>
        </div>
      )}
      <div className='min-h-0 flex-1 overflow-hidden'>
        <FilePreview
          {...props}
          visualize={visualize}
          loading={!bypassTextStatus && props.loading}
          error={bypassTextStatus ? undefined : props.error}
        />
      </div>
    </div>
  )
}

function FilePreview({
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
  visualize,
}: FileViewerProps & { visualize: boolean }) {
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

  if (!visualize && content !== undefined) {
    return (
      <ScrollArea className='size-full'>
        <pre className='p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap wrap-break-word'>
          {content}
        </pre>
      </ScrollArea>
    )
  }

  if (!visualize) {
    return (
      <div className='flex h-full items-center justify-center text-muted-foreground'>
        <p className='text-sm'>{t('empty')}</p>
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

  if (
    fileType === 'bigwig' ||
    fileType === 'bedgraph' ||
    fileType === 'wig' ||
    fileType === 'bigbed' ||
    fileType === 'bed' ||
    fileType === 'gff' ||
    fileType === 'gtf'
  ) {
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

  if (fileType === 'table') {
    return (
      <TablePreview
        runUid={runUid}
        generation={generation}
        path={path}
        active={active}
      />
    )
  }

  if (fileType === 'vcf') {
    return (
      <VcfPreview
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

  if (fileType === 'gfa' && content !== undefined) {
    return <GfaPreview content={content} />
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
