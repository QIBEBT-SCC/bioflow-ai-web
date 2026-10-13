'use client'

import {
  ChartNoAxesCombined,
  Download,
  ExternalLink,
  FileText,
  TextWrap,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { type ComponentType, useMemo, useState } from 'react'
import { ContactPreview } from '@/components/project/run/contact-preview'
import {
  RUN_FILE_ICONS,
  usesRunTextPreview,
} from '@/components/project/run/file-type'
import { getRunFileViewUrl } from '@/components/project/run/file-view-url'
import { GenomePreview } from '@/components/project/run/genome-preview'
import { GfaPreview } from '@/components/project/run/gfa-preview'
import { JsonViewer } from '@/components/project/run/json-viewer'
import { MsaPreview } from '@/components/project/run/msa-preview'
import { NewickPreview } from '@/components/project/run/newick-preview'
import {
  IconTooltipButton,
  PreviewEmpty,
  PreviewError,
  PreviewLoading,
} from '@/components/project/run/preview-chrome'
import type { FileType } from '@/components/project/run/run-tab-bar'
import { TablePreview } from '@/components/project/run/table-preview'
import { VcfPreview } from '@/components/project/run/vcf-preview'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

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

type ViewMode = 'visual' | 'text'

function countLines(content: string): number {
  if (!content) return 0
  let lines = 1
  for (let index = 0; index < content.length; index += 1)
    if (content.charCodeAt(index) === 10) lines += 1
  return content.endsWith('\n') ? lines - 1 : lines
}

export function FileViewer(props: FileViewerProps) {
  const t = useTranslations('Project.runDetail.fileViewer')
  const [mode, setMode] = useState<ViewMode>('text')
  const [wrap, setWrap] = useState(true)
  const textPreview = usesRunTextPreview(props.fileName, props.fileType)
  const canSwitch = textPreview && props.fileType !== 'text'
  const visualize = !textPreview || (canSwitch && mode === 'visual')
  const showingText = !visualize && props.content !== undefined
  const bypassTextStatus =
    textPreview &&
    visualize &&
    !['newick', 'msa', 'gfa'].includes(props.fileType)
  const lineCount = useMemo(
    () => (props.content === undefined ? 0 : countLines(props.content)),
    [props.content],
  )
  const viewUrl = getRunFileViewUrl(props.runUid, props.generation, props.path)
  const Icon = RUN_FILE_ICONS[props.fileType]

  return (
    <div className='flex size-full min-h-0 flex-col'>
      <header className='flex h-11 shrink-0 items-center gap-3 border-b px-3'>
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          <div className='flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary'>
            <Icon className='size-4' />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <h2 className='min-w-0 truncate text-sm font-medium'>
                {props.fileName}
              </h2>
            </TooltipTrigger>
            <TooltipContent className='font-mono'>{props.path}</TooltipContent>
          </Tooltip>
          <Badge variant='secondary' className='shrink-0 font-normal'>
            {t(`formats.${props.fileType}`)}
          </Badge>
          {showingText && (
            <span className='hidden shrink-0 text-xs text-muted-foreground tabular-nums md:inline'>
              {t('lineCount', { count: lineCount })}
            </span>
          )}
        </div>

        <div className='flex shrink-0 items-center gap-1.5'>
          {canSwitch && (
            <Tabs
              value={mode}
              onValueChange={(value) => setMode(value as ViewMode)}
            >
              <TabsList className='h-8'>
                <TabsTrigger value='visual' className='px-2.5 text-xs'>
                  <ChartNoAxesCombined />
                  {t('visualization')}
                </TabsTrigger>
                <TabsTrigger value='text' className='px-2.5 text-xs'>
                  <FileText />
                  {t('originalText')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          {(canSwitch || showingText) && (
            <Separator orientation='vertical' className='mx-1 h-5!' />
          )}
          {showingText && (
            <>
              <IconTooltipButton
                label={t(wrap ? 'noWrap' : 'wrap')}
                variant='ghost'
                aria-pressed={wrap}
                className={cn(wrap && 'bg-muted text-foreground')}
                onClick={() => setWrap((current) => !current)}
              >
                <TextWrap />
              </IconTooltipButton>
              <CopyButton
                code={props.content ?? ''}
                variant='ghost'
                size='icon-sm'
                aria-label={t('copy')}
                title={t('copy')}
              />
            </>
          )}
          <IconTooltipButton label={t('openInNewTab')} variant='ghost' asChild>
            <a href={viewUrl} target='_blank' rel='noopener noreferrer'>
              <ExternalLink />
            </a>
          </IconTooltipButton>
          <IconTooltipButton label={t('download')} variant='ghost' asChild>
            <a href={props.blobUrl ?? viewUrl} download={props.fileName}>
              <Download />
            </a>
          </IconTooltipButton>
        </div>
      </header>
      <div className='min-h-0 flex-1 overflow-hidden'>
        <FilePreview
          {...props}
          visualize={visualize}
          wrap={wrap}
          viewUrl={viewUrl}
          onShowText={canSwitch ? () => setMode('text') : undefined}
          loading={!bypassTextStatus && props.loading}
          error={bypassTextStatus ? undefined : props.error}
        />
      </div>
    </div>
  )
}

function RawText({ content, wrap }: { content: string; wrap: boolean }) {
  return (
    <ScrollArea className='size-full'>
      <pre
        className={cn(
          'p-4 font-mono text-[13px] leading-relaxed',
          wrap ? 'whitespace-pre-wrap wrap-break-word' : 'w-max whitespace-pre',
        )}
      >
        {content}
      </pre>
      <ScrollBar orientation='horizontal' />
    </ScrollArea>
  )
}

type ServerPreviewProps = {
  runUid: string
  generation: number
  path: string
  active: boolean
}

/** Previews backed by server-side indexed reads; they fetch their own data. */
const SERVER_PREVIEWS: Partial<
  Record<FileType, ComponentType<ServerPreviewProps>>
> = {
  bigwig: GenomePreview,
  bedgraph: GenomePreview,
  wig: GenomePreview,
  bigbed: GenomePreview,
  bed: GenomePreview,
  gff: GenomePreview,
  gtf: GenomePreview,
  hic: ContactPreview,
  cool: ContactPreview,
  mcool: ContactPreview,
  table: TablePreview,
  vcf: VcfPreview,
  structure: dynamic(
    () =>
      import('@/components/project/run/protein-preview').then(
        (mod) => mod.ProteinPreview,
      ),
    { ssr: false },
  ),
}

function FilePreview({
  loading,
  error,
  visualize,
  content,
  wrap,
  ...props
}: FileViewerProps & {
  visualize: boolean
  wrap: boolean
  viewUrl: string
  onShowText?: () => void
}) {
  const t = useTranslations('Project.runDetail.fileViewer')

  if (loading) return <PreviewLoading label={t('loading')} />
  if (error) return <PreviewError title={t('loadFailed')} message={error} />
  if (visualize)
    return <VisualPreview {...props} content={content} wrap={wrap} />
  if (content) return <RawText content={content} wrap={wrap} />
  return <PreviewEmpty icon={<FileText />} title={t('empty')} />
}

function VisualPreview({
  fileName,
  fileType,
  path,
  runUid,
  generation,
  active,
  content,
  blobUrl,
  wrap,
  viewUrl,
  onShowText,
}: Omit<FileViewerProps, 'loading' | 'error'> & {
  wrap: boolean
  viewUrl: string
  onShowText?: () => void
}) {
  const t = useTranslations('Project.runDetail.fileViewer')

  if (fileType === 'unknown') {
    return (
      <PreviewEmpty
        title={t('unsupported')}
        description={t('unsupportedHint')}
      />
    )
  }

  const ServerPreview = SERVER_PREVIEWS[fileType]
  if (ServerPreview) {
    return (
      <ServerPreview
        runUid={runUid}
        generation={generation}
        path={path}
        active={active}
      />
    )
  }

  if (fileType === 'image' && blobUrl) {
    return (
      <div className='relative size-full bg-[repeating-conic-gradient(var(--muted)_0%_25%,transparent_0%_50%)] bg-size-[16px_16px]'>
        <Image
          src={blobUrl}
          alt={fileName}
          fill
          unoptimized
          sizes='100vw'
          className='object-contain p-4'
        />
      </div>
    )
  }

  if (fileType === 'pdf') {
    return (
      <object
        data={viewUrl}
        type='application/pdf'
        aria-label={fileName}
        className='size-full'
      >
        <PreviewEmpty
          title={t('pdfUnavailable')}
          description={
            <Button asChild variant='outline' size='sm'>
              <a href={viewUrl} target='_blank' rel='noopener noreferrer'>
                <ExternalLink />
                {t('openInNewTab')}
              </a>
            </Button>
          }
        />
      </object>
    )
  }

  if (fileType === 'html') {
    return (
      <iframe
        src={viewUrl}
        title={fileName}
        className='size-full border-0'
        sandbox='allow-scripts allow-same-origin'
      />
    )
  }

  if (content === undefined) {
    return <PreviewEmpty icon={<FileText />} title={t('empty')} />
  }

  switch (fileType) {
    case 'json':
      return <JsonViewer content={content} />
    case 'newick':
      return (
        <NewickPreview
          content={content}
          fileName={fileName}
          onShowText={onShowText}
        />
      )
    case 'msa':
      return <MsaPreview content={content} onShowText={onShowText} />
    case 'gfa':
      return <GfaPreview content={content} onShowText={onShowText} />
    default:
      return content ? (
        <RawText content={content} wrap={wrap} />
      ) : (
        <PreviewEmpty icon={<FileText />} title={t('empty')} />
      )
  }
}
