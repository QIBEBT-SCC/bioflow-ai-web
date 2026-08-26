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
  XIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
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
  return (
    <>
      <div>
        <h3 className='text-sm font-medium text-muted-foreground mb-2'>
          {t('descLabel')}
        </h3>
        <p className='text-sm'>{image.description || t('noDesc')}</p>
      </div>
      <div>
        <h3 className='text-sm font-medium text-muted-foreground mb-2'>
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
        <h3 className='text-sm font-medium text-muted-foreground mb-2'>
          {t('imageTag')}
        </h3>
        <div className='flex items-center gap-2'>
          <div className='flex-1 p-3 bg-muted rounded-md'>
            <code className='text-sm font-mono'>{formatImageTag(image)}</code>
          </div>
          <Button
            variant='outline'
            size='icon'
            onClick={onCopy}
            className='shrink-0'
          >
            {copied ? (
              <CheckIcon className='size-4 text-green-600' />
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
              <ExternalLinkIcon className='size-4 mr-2' />
              Homepage
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
              <FileTextIcon className='size-4 mr-2' />
              Paper
            </a>
          </Button>
        )}
      </div>
    </>
  )
}

export default function ImageDetailPage() {
  const t = useTranslations('image.detail')
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

  if (isLoading) {
    return (
      <SidebarInset className='h-screen flex flex-col'>
        <header className='flex flex-col shrink-0 border-b'>
          <div className='flex items-center justify-between px-4 h-12 bg-background'>
            <div className='flex items-center gap-2'>
              <SidebarTrigger className='-ml-1' />
              <Separator orientation='vertical' className='!mr-2 !h-4' />
            </div>
          </div>
        </header>
        <div className='flex-1 overflow-y-auto flex items-center justify-center'>
          <div className='text-muted-foreground'>{t('loading')}</div>
        </div>
      </SidebarInset>
    )
  }

  if (error || !image) {
    return (
      <SidebarInset className='h-screen flex flex-col'>
        <header className='flex flex-col shrink-0 border-b'>
          <div className='flex items-center justify-between px-4 h-12 bg-background'>
            <div className='flex items-center gap-2'>
              <SidebarTrigger className='-ml-1' />
              <Separator orientation='vertical' className='!mr-2 !h-4' />
            </div>
          </div>
        </header>
        <div className='flex-1 overflow-y-auto flex items-center justify-center'>
          <div className='text-center'>
            <PackageIcon className='size-12 mx-auto mb-4 text-muted-foreground' />
            <h2 className='text-xl font-semibold mb-2'>{t('notFoundTitle')}</h2>
            <p className='text-muted-foreground mb-4'>
              {error?.message || t('notFoundDesc')}
            </p>
            <Button onClick={() => push('/image')} variant='outline'>
              <ArrowLeftIcon className='size-4 mr-2' />
              {t('backToList')}
            </Button>
          </div>
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset className='h-screen flex flex-col'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center justify-between px-4 h-12 bg-background'>
          <div className='flex items-center gap-2'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='!mr-2 !h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href='/image'>Images</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{image.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </header>

      <div className='flex-1 overflow-y-auto'>
        <div className='container mx-auto px-4 py-8 max-w-7xl'>
          {/* 镜像基本信息卡片 */}
          <Card className='mb-8'>
            <CardHeader>
              <div className='flex items-start justify-between'>
                <div className='flex items-center gap-3'>
                  <PackageIcon className='size-8 text-primary' />
                  <div>
                    <CardTitle className='text-2xl'>{image.name}</CardTitle>
                    <CardDescription>
                      {t('version', { val: image.version })}
                    </CardDescription>
                  </div>
                </div>
                {!isEditing ? (
                  <Button onClick={handleEdit} variant='outline' size='sm'>
                    <EditIcon className='size-4 mr-2' />
                    {t('edit')}
                  </Button>
                ) : (
                  <div className='flex gap-2'>
                    <Button
                      onClick={handleCancel}
                      variant='outline'
                      size='sm'
                      disabled={updateImageMutation.isPending}
                    >
                      <XIcon className='size-4 mr-2' />
                      {t('cancel')}
                    </Button>
                    <Button
                      onClick={handleSave}
                      size='sm'
                      disabled={updateImageMutation.isPending}
                    >
                      <SaveIcon className='size-4 mr-2' />
                      {t('save')}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className='space-y-6'>
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
            </CardContent>
          </Card>

          <ImageRelatedTools image={image} />
        </div>
      </div>
    </SidebarInset>
  )
}

function ImageRelatedTools({ image }: { image: ToolImagePublic }) {
  const t = useTranslations('image.detail')
  const getTagStyle = (tagName: string) => {
    switch (tagName) {
      case 'AI Checked':
        return 'bg-green-50 text-green-600 border-green-200'
      case 'AI Unchecked':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200'
      default:
        return 'bg-blue-50 text-blue-600 border-blue-200'
    }
  }

  return (
    <div className='mt-8'>
      <h2 className='text-xl font-semibold mb-4'>
        {t('relatedTools', { count: image.tools?.length || 0 })}
      </h2>
      {!image.tools || image.tools.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center text-muted-foreground'>
            {t('noTools')}
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {image.tools.map((tool) => (
            <Link key={tool.uid} href={`/tool/${tool.uid}`}>
              <Card className='h-full hover:shadow-lg transition-shadow cursor-pointer'>
                <CardHeader>
                  <CardTitle className='text-lg'>{tool.name}</CardTitle>
                  <CardDescription className='line-clamp-2'>
                    {tool.description || t('noDesc')}
                  </CardDescription>
                </CardHeader>
                {tool.tags && tool.tags.length > 0 && (
                  <CardContent>
                    <div className='flex flex-wrap gap-1'>
                      {tool.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant='outline'
                          className={`${getTagStyle(tag.name)} text-xs`}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
