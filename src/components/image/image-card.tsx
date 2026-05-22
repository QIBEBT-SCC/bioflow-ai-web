import { ExternalLinkIcon, FileTextIcon, PackageIcon } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatImageTag } from '@/lib/image-utils'

interface ImageCardProps {
  image: {
    uid?: string
    name?: string
    version?: string
    description?: string
    homepage?: string
    paper_link?: string
    image?: {
      registry?: string
      namespace?: string
      repository?: string
      tag?: string
    }
  }
}

export function ImageCard({ image }: ImageCardProps) {
  return (
    <Card className='flex flex-col h-full hover:shadow-lg transition-shadow relative'>
      <CardHeader>
        <div className='flex items-start justify-between gap-2 mb-2'>
          <div className='flex items-center gap-2 min-w-0'>
            <PackageIcon className='size-5 text-primary shrink-0' />
            <CardTitle className='text-lg truncate'>
              <Link
                href={`/image/${image.uid}`}
                className='after:absolute after:inset-0'
              >
                {image.name}
              </Link>
            </CardTitle>
          </div>
        </div>
        {image.version && (
          <Badge variant='secondary' className='w-fit font-mono text-xs'>
            {image.version}
          </Badge>
        )}
      </CardHeader>
      <CardContent className='flex-1 flex flex-col'>
        <CardDescription className='mb-4 line-clamp-3 leading-relaxed'>
          {image.description || 'No description available'}
        </CardDescription>

        {/* Image Tag */}
        <div className='mb-4 p-3 bg-muted rounded-md'>
          <code className='text-xs font-mono break-all text-foreground'>
            {formatImageTag(image)}
          </code>
        </div>

        {/* Links */}
        <div className='flex flex-wrap gap-2 mt-auto relative z-10'>
          {image.homepage && (
            <Button
              variant='outline'
              size='sm'
              asChild
              className='flex-1 bg-transparent'
            >
              <a
                href={image.homepage}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center justify-center gap-1.5'
              >
                <ExternalLinkIcon className='size-3.5' />
                <span>Homepage</span>
              </a>
            </Button>
          )}
          {image.paper_link && (
            <Button
              variant='outline'
              size='sm'
              asChild
              className='flex-1 bg-transparent'
            >
              <a
                href={image.paper_link}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center justify-center gap-1.5'
              >
                <FileTextIcon className='size-3.5' />
                <span>Paper</span>
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
