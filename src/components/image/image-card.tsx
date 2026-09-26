import { ExternalLinkIcon, FileTextIcon, PackageIcon } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
  const t = useTranslations('image.card')
  const hasLinks = Boolean(image.homepage || image.paper_link)

  return (
    <Card className='group relative h-full gap-4 p-5 transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-md'>
      <div className='flex items-start gap-3'>
        <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
          <PackageIcon className='size-5' />
        </div>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <Link
              href={`/image/${image.uid}`}
              className='truncate font-semibold after:absolute after:inset-0 group-hover:text-primary'
            >
              {image.name}
            </Link>
            {image.version && (
              <Badge variant='secondary' className='shrink-0 font-mono'>
                {image.version}
              </Badge>
            )}
          </div>
          <code className='mt-1 block truncate font-mono text-xs text-muted-foreground'>
            {formatImageTag(image)}
          </code>
        </div>
      </div>

      <p className='line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground'>
        {image.description || t('noDesc')}
      </p>

      {hasLinks && (
        <div className='relative z-10 -mb-1 flex gap-1 border-t pt-3'>
          {image.homepage && (
            <Button variant='ghost' size='sm' asChild>
              <a
                href={image.homepage}
                target='_blank'
                rel='noopener noreferrer'
              >
                <ExternalLinkIcon />
                {t('homepageBtn')}
              </a>
            </Button>
          )}
          {image.paper_link && (
            <Button variant='ghost' size='sm' asChild>
              <a
                href={image.paper_link}
                target='_blank'
                rel='noopener noreferrer'
              >
                <FileTextIcon />
                {t('paperBtn')}
              </a>
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
