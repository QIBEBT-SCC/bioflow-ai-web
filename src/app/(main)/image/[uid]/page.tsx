'use client'

import {
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  EditIcon,
  ExternalLinkIcon,
  FileTextIcon,
  PackageIcon,
  SaveIcon,
  WrenchIcon,
  XIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import { SectionCard } from '@/components/layout/section-card'
import { ToolTagBadge } from '@/components/tool/tool-tag-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useImage, useUpdateImage } from '@/hooks/use-tool'
import { formatImageTag, parseImageAliases } from '@/lib/image-utils'
import type { ToolImage, ToolImagePublic } from '@/types/tool'

function ImageEditForm({
  formData,
  aliasesText,
  onChange,
  onAliasesTextChange,
}: {
  formData: Partial<ToolImage>
  aliasesText: string
  onChange: (updater: (prev: Partial<ToolImage>) => Partial<ToolImage>) => void
  onAliasesTextChange: (value: string) => void
}) {
  const t = useTranslations('image.detail')
  return (
    <>
      <div className='space-y-2'>
        <Label htmlFor='name'>{t('nameLabel')}</Label>
        <Input
          id='name'
          value={formData.name || ''}
          onChange={(e) =>
            onChange((prev) => ({ ...prev, name: e.target.value }))
          }
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='version'>{t('versionLabel')}</Label>
        <Input
          id='version'
          value={formData.version || ''}
          onChange={(e) =>
            onChange((prev) => ({ ...prev, version: e.target.value }))
          }
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='aliases'>{t('aliasesLabel')}</Label>
        <Input
          id='aliases'
          value={aliasesText}
          placeholder={t('aliasesPlaceholder')}
          onChange={(e) => onAliasesTextChange(e.target.value)}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='description'>{t('descLabel')}</Label>
        <Textarea
          id='description'
          rows={4}
          value={formData.description || ''}
          onChange={(e) =>
            onChange((prev) => ({ ...prev, description: e.target.value }))
          }
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='homepage'>Homepage</Label>
        <Input
          id='homepage'
          type='url'
          value={formData.homepage || ''}
          onChange={(e) =>
            onChange((prev) => ({ ...prev, homepage: e.target.value }))
          }
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='paper_link'>Paper Link</Label>
        <Input
          id='paper_link'
          type='url'
          value={formData.paper_link || ''}
          onChange={(e) =>
            onChange((prev) => ({ ...prev, paper_link: e.target.value }))
          }
        />
      </div>
      <Separator />
      <div className='space-y-4'>
        <h3 className='text-sm font-medium'>{t('config')}</h3>
        <div className='grid grid-cols-2 gap-4'>
          {(['registry', 'namespace', 'repository', 'tag'] as const).map(
            (field) => (
              <div key={field} className='space-y-2'>
                <Label htmlFor={field}>{t(field)}</Label>
                <Input
                  id={field}
                  value={formData.image?.[field] || ''}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      image: {
                        registry: '',
                        namespace: '',
                        repository: '',
                        tag: '',
                        ...prev.image,
                        [field]: e.target.value,
                      },
                    }))
                  }
                  placeholder={t(`${field}Placeholder`)}
                />
              </div>
            ),
          )}
        </div>
      </div>
    </>
  )
}

function ImageViewContent({
  image,
  onCopy,
  copied,
}: {
  image: ToolImagePublic
  onCopy: () => void
  copied: boolean
}) {
  const t = useTranslations('image.detail')
  const tCard = useTranslations('image.card')
  return (
    <>
      <div>
        <h3 className='mb-2 text-sm font-medium text-muted-foreground'>
          {t('descLabel')}
        </h3>
        <p className='text-sm'>{image.description || t('noDesc')}</p>
      </div>
      <div>
        <h3 className='mb-2 text-sm font-medium text-muted-foreground'>
          {t('aliasesLabel')}
        </h3>
        {image.aliases.length > 0 ? (
          <div className='flex flex-wrap gap-2'>
            {image.aliases.map((alias) => (
              <Badge key={alias} variant='secondary'>
                {alias}
              </Badge>
            ))}
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>{t('noAliases')}</p>
        )}
      </div>
      <div>
        <h3 className='mb-2 text-sm font-medium text-muted-foreground'>
          {t('imageTag')}
        </h3>
        <div className='flex items-center gap-2'>
          <div className='min-w-0 flex-1 rounded-md bg-muted p-3'>
            <code className='font-mono text-sm break-all'>
              {formatImageTag(image)}
            </code>
          </div>
          <Button
            variant='outline'
            size='icon'
            onClick={onCopy}
            className='shrink-0'
          >
            {copied ? (
              <CheckIcon className='size-4 text-success' />
            ) : (
              <CopyIcon className='size-4' />
            )}
          </Button>
        </div>
      </div>
      <div className='flex flex-wrap gap-3'>
        {image.homepage && (
          <Button variant='outline' size='sm' asChild>
            <a href={image.homepage} target='_blank' rel='noopener noreferrer'>
              <ExternalLinkIcon className='size-4' />
              {tCard('homepageBtn')}
            </a>
          </Button>
        )}
        {image.paper_link && (
          <Button variant='outline' size='sm' asChild>
            <a
              href={image.paper_link}
              target='_blank'
              rel='noopener noreferrer'
            >
              <FileTextIcon className='size-4' />
              {tCard('paperBtn')}
            </a>
          </Button>
        )}
      </div>
    </>
  )
}

export default function ImageDetailPage() {
  const t = useTranslations('image.detail')
  const tList = useTranslations('image')
  const params = useParams()
  const { push } = useRouter()
  const uid = params.uid as string
  const [isEditing, setIsEditing] = useState(false)

  const { data: image, isLoading, error } = useImage(uid)
  const updateImageMutation = useUpdateImage()

  const [formData, setFormData] = useState<Partial<ToolImage>>({})
  const [aliasesText, setAliasesText] = useState('')
  const [copied, setCopied] = useState(false)

  // 复制镜像标签到剪贴板
  const handleCopy = async () => {
    if (image) {
      const imageTag = formatImageTag(image)
      try {
        await navigator.clipboard.writeText(imageTag)
        setCopied(true)
        toast.success(t('copySuccess'))
        setTimeout(() => setCopied(false), 2000)
      } catch (_err) {
        toast.error(t('copyFail'))
      }
    }
  }

  // 进入编辑模式时初始化表单数据
  const handleEdit = () => {
    if (image) {
      setFormData({
        name: image.name,
        aliases: image.aliases,
        version: image.version,
        description: image.description,
        homepage: image.homepage,
        paper_link: image.paper_link,
        image: {
          registry: image.image?.registry || '',
          namespace: image.image?.namespace || '',
          repository: image.image?.repository || '',
          tag: image.image?.tag || '',
        },
      })
      setAliasesText(image.aliases.join(', '))
    }
    setIsEditing(true)
  }

  // 保存编辑
  const handleSave = () => {
    updateImageMutation.mutate(
      {
        uid,
        image: { ...formData, aliases: parseImageAliases(aliasesText) },
      },
      {
        onSuccess: () => {
          setIsEditing(false)
        },
      },
    )
  }

  // 取消编辑
  const handleCancel = () => {
    setIsEditing(false)
    setFormData({})
    setAliasesText('')
  }

  return (
    <PageShell
      breadcrumbs={[
        { label: tList('title'), href: '/image' },
        { label: image?.name ?? t('loading') },
      ]}
    >
      <PageContainer>
        {isLoading && (
          <div className='space-y-6'>
            <Skeleton className='h-10 w-72' />
            <Skeleton className='h-64 rounded-xl' />
          </div>
        )}

        {!isLoading && (error || !image) && (
          <Empty className='border border-dashed'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <PackageIcon />
              </EmptyMedia>
              <EmptyTitle>{t('notFoundTitle')}</EmptyTitle>
              <EmptyDescription>
                {error?.message || t('notFoundDesc')}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => push('/image')} variant='outline'>
                <ArrowLeftIcon className='size-4' />
                {t('backToList')}
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {!isLoading && image && (
          <>
            <PageHeader
              title={image.name}
              titleAddon={
                <Badge variant='secondary' className='font-mono'>
                  {image.version}
                </Badge>
              }
              actions={
                !isEditing ? (
                  <Button onClick={handleEdit} variant='outline'>
                    <EditIcon className='size-4' />
                    {t('edit')}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleCancel}
                      variant='outline'
                      disabled={updateImageMutation.isPending}
                    >
                      <XIcon className='size-4' />
                      {t('cancel')}
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={updateImageMutation.isPending}
                    >
                      <SaveIcon className='size-4' />
                      {t('save')}
                    </Button>
                  </>
                )
              }
            />

            <SectionCard
              icon={<PackageIcon />}
              title={t('config')}
              contentClassName='space-y-6'
            >
              {isEditing ? (
                <ImageEditForm
                  formData={formData}
                  aliasesText={aliasesText}
                  onChange={setFormData}
                  onAliasesTextChange={setAliasesText}
                />
              ) : (
                <ImageViewContent
                  image={image}
                  onCopy={handleCopy}
                  copied={copied}
                />
              )}
            </SectionCard>

            <ImageRelatedTools image={image} />
          </>
        )}
      </PageContainer>
    </PageShell>
  )
}

function ImageRelatedTools({ image }: { image: ToolImagePublic }) {
  const t = useTranslations('image.detail')

  return (
    <section className='mt-8 space-y-4'>
      <h2 className='text-lg font-semibold tracking-tight'>
        {t('relatedTools', { count: image.tools?.length || 0 })}
      </h2>
      {!image.tools || image.tools.length === 0 ? (
        <div className='rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground'>
          {t('noTools')}
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {image.tools.map((tool) => (
            <Card
              key={tool.uid}
              className='group relative gap-3 p-5 transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-md'
            >
              <div className='flex items-center gap-3'>
                <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                  <WrenchIcon className='size-5' />
                </div>
                <Link
                  href={`/tool/${tool.uid}`}
                  className='truncate font-semibold after:absolute after:inset-0 group-hover:text-primary'
                >
                  {tool.name}
                </Link>
              </div>
              <p className='line-clamp-2 text-sm text-muted-foreground'>
                {tool.description || t('noDesc')}
              </p>
              {tool.tags && tool.tags.length > 0 && (
                <div className='flex flex-wrap gap-1'>
                  {tool.tags.map((tag) => (
                    <ToolTagBadge key={tag.id} name={tag.name} />
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
