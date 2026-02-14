'use client'

import { ArrowLeftIcon, CheckIcon, CopyIcon, EditIcon, ExternalLinkIcon, FileTextIcon, PackageIcon, SaveIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Textarea } from '@/components/ui/textarea'
import { useImage, useUpdateImage } from '@/hooks/use-tool'
import { formatImageTag } from '@/lib/image-utils'
import type { ToolImage } from '@/types/tool'
import { Badge } from '@/components/ui/badge'

export default function ImageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const uid = params.uid as string
  const [isEditing, setIsEditing] = useState(false)

  const { data: image, isLoading, error } = useImage(uid)
  const updateImageMutation = useUpdateImage()

  const [formData, setFormData] = useState<Partial<ToolImage>>({})
  const [copied, setCopied] = useState(false)

  // 复制镜像标签到剪贴板
  const handleCopy = async () => {
    if (image) {
      const imageTag = formatImageTag(image)
      try {
        await navigator.clipboard.writeText(imageTag)
        setCopied(true)
        toast.success('镜像标签已复制到剪贴板')
        setTimeout(() => setCopied(false), 2000)
      } catch (_err) {
        toast.error('复制失败')
      }
    }
  }

  // 进入编辑模式时初始化表单数据
  const handleEdit = () => {
    if (image) {
      setFormData({
        name: image.name,
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
    }
    setIsEditing(true)
  }

  // 保存编辑
  const handleSave = () => {
    updateImageMutation.mutate(
      { uid, image: formData },
      {
        onSuccess: () => {
          setIsEditing(false)
        },
      }
    )
  }

  // 取消编辑
  const handleCancel = () => {
    setIsEditing(false)
    setFormData({})
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
          <div className='text-muted-foreground'>加载中...</div>
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
            <PackageIcon className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
            <h2 className='text-xl font-semibold mb-2'>镜像未找到</h2>
            <p className='text-muted-foreground mb-4'>
              {error?.message || '请求的镜像不存在'}
            </p>
            <Button onClick={() => router.push('/image')} variant='outline'>
              <ArrowLeftIcon className='h-4 w-4 mr-2' />
              返回列表
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
                  <PackageIcon className='h-8 w-8 text-primary' />
                  <div>
                    <CardTitle className='text-2xl'>{image.name}</CardTitle>
                    <CardDescription>版本 {image.version}</CardDescription>
                  </div>
                </div>
                {!isEditing ? (
                  <Button onClick={handleEdit} variant='outline' size='sm'>
                    <EditIcon className='h-4 w-4 mr-2' />
                    编辑
                  </Button>
                ) : (
                  <div className='flex gap-2'>
                    <Button 
                      onClick={handleCancel} 
                      variant='outline' 
                      size='sm'
                      disabled={updateImageMutation.isPending}
                    >
                      <XIcon className='h-4 w-4 mr-2' />
                      取消
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      size='sm'
                      disabled={updateImageMutation.isPending}
                    >
                      <SaveIcon className='h-4 w-4 mr-2' />
                      保存
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className='space-y-6'>
              {isEditing ? (
                <>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>名称</Label>
                    <Input
                      id='name'
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='version'>版本</Label>
                    <Input
                      id='version'
                      value={formData.version || ''}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='description'>描述</Label>
                    <Textarea
                      id='description'
                      rows={4}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='homepage'>Homepage</Label>
                    <Input
                      id='homepage'
                      type='url'
                      value={formData.homepage || ''}
                      onChange={(e) => setFormData({ ...formData, homepage: e.target.value })}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='paper_link'>Paper Link</Label>
                    <Input
                      id='paper_link'
                      type='url'
                      value={formData.paper_link || ''}
                      onChange={(e) => setFormData({ ...formData, paper_link: e.target.value })}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className='space-y-4'>
                    <h3 className='text-sm font-medium'>镜像配置</h3>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='registry'>Registry</Label>
                        <Input
                          id='registry'
                          value={formData.image?.registry || ''}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            image: { 
                              ...(formData.image || { namespace: '', repository: '', tag: '' }),
                              registry: e.target.value 
                            } 
                          })}
                          placeholder='例如: quay.io'
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='namespace'>Namespace</Label>
                        <Input
                          id='namespace'
                          value={formData.image?.namespace || ''}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            image: { 
                              ...(formData.image || { registry: '', repository: '', tag: '' }),
                              namespace: e.target.value 
                            } 
                          })}
                          placeholder='例如: biocontainers'
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='repository'>Repository</Label>
                        <Input
                          id='repository'
                          value={formData.image?.repository || ''}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            image: { 
                              ...(formData.image || { registry: '', namespace: '', tag: '' }),
                              repository: e.target.value 
                            } 
                          })}
                          placeholder='例如: blast'
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='tag'>Tag</Label>
                        <Input
                          id='tag'
                          value={formData.image?.tag || ''}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            image: { 
                              ...(formData.image || { registry: '', namespace: '', repository: '' }),
                              tag: e.target.value 
                            } 
                          })}
                          placeholder='例如: 2.14.0'
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className='text-sm font-medium text-muted-foreground mb-2'>描述</h3>
                    <p className='text-sm'>{image.description || '无描述'}</p>
                  </div>

                  <div>
                    <h3 className='text-sm font-medium text-muted-foreground mb-2'>镜像标签</h3>
                    <div className='flex items-center gap-2'>
                      <div className='flex-1 p-3 bg-muted rounded-md'>
                        <code className='text-sm font-mono'>{formatImageTag(image)}</code>
                      </div>
                      <Button
                        variant='outline'
                        size='icon'
                        onClick={handleCopy}
                        className='shrink-0'
                      >
                        {copied ? (
                          <CheckIcon className='h-4 w-4 text-green-600' />
                        ) : (
                          <CopyIcon className='h-4 w-4' />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className='flex flex-wrap gap-3'>
                    {image.homepage && (
                      <Button variant='outline' size='sm' asChild>
                        <a href={image.homepage} target='_blank' rel='noopener noreferrer'>
                          <ExternalLinkIcon className='h-4 w-4 mr-2' />
                          Homepage
                        </a>
                      </Button>
                    )}
                    {image.paper_link && (
                      <Button variant='outline' size='sm' asChild>
                        <a href={image.paper_link} target='_blank' rel='noopener noreferrer'>
                          <FileTextIcon className='h-4 w-4 mr-2' />
                          Paper
                        </a>
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 工具列表 */}
          <div className='mt-8'>
            <h2 className='text-xl font-semibold mb-4'>
              关联工具 ({image.tools?.length || 0})
            </h2>
              {(!image.tools || image.tools.length === 0) ? (
                <Card>
                  <CardContent className='py-12 text-center text-muted-foreground'>
                    该镜像暂无关联的工具
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
                            {tool.description || '无描述'}
                          </CardDescription>
                        </CardHeader>
                        {tool.tags && tool.tags.length > 0 && (
                          <CardContent>
                            <div className='flex flex-wrap gap-1'>
                              {tool.tags.map((tag) => {
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
                                  <Badge
                                    key={tag.id}
                                    variant='outline'
                                    className={`${getTagStyle(tag.name)} text-xs`}
                                  >
                                    {tag.name}
                                  </Badge>
                                )
                              })}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
    </SidebarInset>
  )
}
