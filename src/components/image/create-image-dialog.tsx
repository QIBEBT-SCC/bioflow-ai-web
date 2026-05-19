'use client'

import { Package, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateImage } from '@/hooks/use-tool'
import type { ToolImage } from '@/types/tool'

const DEFAULT_TRIGGER = (
  <Button>
    <Plus className='size-4 mr-2' />
    新建镜像
  </Button>
)

interface CreateImageDialogProps {
  trigger?: React.ReactNode
}

export function CreateImageDialog({ trigger }: CreateImageDialogProps) {
  const [name, setName] = useState('')
  const [version, setVersion] = useState('')
  const [description, setDescription] = useState('')
  const [homepage, setHomepage] = useState('')
  const [paperLink, setPaperLink] = useState('')

  // 镜像配置
  const [registry, setRegistry] = useState('docker.io')
  const [namespace, setNamespace] = useState('biocontainers')
  const [repository, setRepository] = useState('')
  const [tag, setTag] = useState('')

  const [open, setOpen] = useState(false)

  const { mutate: createImage, isPending } = useCreateImage()

  const handleCreate = () => {
    if (!name || !version || !registry || !namespace || !repository || !tag) {
      return
    }

    const newImage: ToolImage = {
      name,
      version,
      description,
      homepage,
      paper_link: paperLink,
      image: {
        registry,
        namespace,
        repository,
        tag,
      },
    }

    createImage(newImage, {
      onSuccess: () => {
        setOpen(false)
        // 重置表单
        setName('')
        setVersion('')
        setDescription('')
        setHomepage('')
        setPaperLink('')
        setRegistry('')
        setNamespace('')
        setRepository('')
        setTag('latest')
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || DEFAULT_TRIGGER}</DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Package className='size-5' />
            创建新镜像
          </DialogTitle>
          <DialogDescription>
            填写镜像的基本信息和 Docker 配置
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {/* 基本信息 */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold text-foreground'>基本信息</h3>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>
                  名称 <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='name'
                  placeholder='例如: FastQC'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='version'>
                  版本 <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='version'
                  placeholder='例如: 0.11.9'
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>描述</Label>
              <Textarea
                id='description'
                placeholder='简要描述该镜像的功能和用途'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='homepage'>主页链接</Label>
                <Input
                  id='homepage'
                  type='url'
                  placeholder='https://example.com'
                  value={homepage}
                  onChange={(e) => setHomepage(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='paperLink'>论文链接</Label>
                <Input
                  id='paperLink'
                  type='url'
                  placeholder='https://doi.org/...'
                  value={paperLink}
                  onChange={(e) => setPaperLink(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Docker 镜像配置 */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold text-foreground'>
              Docker 镜像配置
            </h3>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='registry'>
                  Registry <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='registry'
                  placeholder='例如: docker.io'
                  value={registry}
                  onChange={(e) => setRegistry(e.target.value)}
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='namespace'>
                  Namespace <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='namespace'
                  placeholder='例如: biocontainers'
                  value={namespace}
                  onChange={(e) => setNamespace(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='repository'>
                  Repository <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='repository'
                  placeholder='例如: fastqc'
                  value={repository}
                  onChange={(e) => setRepository(e.target.value)}
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='tag'>
                  Tag <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='tag'
                  placeholder='例如: latest'
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 预览完整镜像地址 */}
            <div className='space-y-2'>
              <Label>镜像地址预览</Label>
              <div className='p-3 bg-muted rounded-md'>
                <code className='text-xs font-mono text-foreground break-all'>
                  {registry && namespace && repository && tag
                    ? `${registry}/${namespace}/${repository}:${tag}`
                    : '请填写所有必填字段以预览镜像地址'}
                </code>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => setOpen(false)}
          >
            取消
          </Button>
          <Button
            type='button'
            onClick={handleCreate}
            disabled={
              isPending ||
              !name ||
              !version ||
              !registry ||
              !namespace ||
              !repository ||
              !tag
            }
          >
            {isPending ? '创建中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
