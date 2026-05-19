import { AlertCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'
import type { FileType } from '@/components/project/run//run-tab-bar'
import { JsonViewer } from '@/components/project/run/json-viewer'
import { ScrollArea } from '@/components/ui/scroll-area'

interface FileViewerProps {
  fileName: string
  fileType: FileType
  content?: string // text / html
  blobUrl?: string // image / pdf
  loading?: boolean
  error?: string
}

export function FileViewer({
  fileName,
  fileType,
  content,
  blobUrl,
  loading,
  error,
}: FileViewerProps) {
  if (loading) {
    return (
      <div className='flex h-full items-center justify-center text-muted-foreground'>
        <Loader2 className='mr-2 size-4 animate-spin' />
        <span className='text-sm'>加载中…</span>
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

  if (fileType === 'pdf' && blobUrl) {
    return (
      <iframe src={blobUrl} title={fileName} className='size-full border-0' />
    )
  }

  if (fileType === 'json' && content !== undefined) {
    return <JsonViewer content={content} />
  }

  if (fileType === 'html' && content !== undefined) {
    return (
      <iframe
        srcDoc={content}
        title={fileName}
        className='size-full border-0'
        sandbox='allow-scripts allow-same-origin'
      />
    )
  }

  if (content !== undefined) {
    return (
      <ScrollArea className='size-full'>
        <pre className='p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words'>
          {content}
        </pre>
      </ScrollArea>
    )
  }

  return (
    <div className='flex h-full items-center justify-center text-muted-foreground'>
      <p className='text-sm'>无内容</p>
    </div>
  )
}
