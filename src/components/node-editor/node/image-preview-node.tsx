'use client'

import {
  type Node,
  useNodeConnections,
  useNodeId,
  useNodesData,
} from '@xyflow/react'
import { ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { memo, useState } from 'react'
import { BaseNode } from '@/components/node-editor/node/base-node'
import { colorSchemes } from '@/components/node-editor/node/color'
import { getRunFileViewUrl } from '@/components/project/run/file-view-url'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { HandleDefine } from '@/types/node'

interface ImagePreviewData {
  run_uid: string
  generation: number
  path?: string
  error?:
    | 'upstream_failed'
    | 'missing_path'
    | 'outside_run'
    | 'unsupported_format'
}

const HANDLES = {
  inputs: [
    {
      name: 'image_path',
      label: 'Image Path',
      description: 'Path of the image to display',
    },
  ] as HandleDefine[],
  outputs: [] as HandleDefine[],
}

export const ImagePreviewNode = memo(function ImagePreviewNode() {
  const t = useTranslations('editor.image_preview')
  const nodeId = useNodeId() ?? ''
  const node =
    useNodesData<Node<{ preview_data?: ImagePreviewData }, 'image_preview'>>(
      nodeId,
    )
  const connections = useNodeConnections({ handleType: 'target' })
  const preview = node?.data.preview_data
  const url = preview?.path
    ? getRunFileViewUrl(preview.run_uid, preview.generation, preview.path)
    : null
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null)

  let message: string | null = null
  let failed = false
  if (connections.length === 0) message = t('connect')
  else if (preview?.error) {
    message = t(preview.error)
    failed = true
  } else if (url === failedUrl) {
    message = t('load_failed')
    failed = true
  } else if (!url) message = t('waiting')
  const loaded = !message && url === loadedUrl

  return (
    <BaseNode
      title={t('title')}
      description={t('description')}
      detailsTrigger={null}
      handles={HANDLES}
      color={colorSchemes.gray}
      nodeComponent={
        <div className='relative mx-auto size-64 overflow-hidden rounded-md border border-border bg-muted/20'>
          {!loaded && (
            <>
              <Skeleton
                className={cn(
                  'absolute inset-0 rounded-none',
                  failed && 'animate-none opacity-60',
                )}
              />
              <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center text-muted-foreground'>
                <ImageIcon className='size-8 opacity-50' />
                {message && <span className='text-xs'>{message}</span>}
              </div>
            </>
          )}
          {!message && url && (
            <Image
              src={url}
              alt={t('title')}
              fill
              unoptimized
              sizes='256px'
              className={cn(
                'object-contain transition-opacity duration-300',
                loaded ? 'opacity-100' : 'opacity-0',
              )}
              onLoad={() => setLoadedUrl(url)}
              onError={() => setFailedUrl(url)}
            />
          )}
        </div>
      }
    />
  )
})
