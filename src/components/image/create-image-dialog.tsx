'use client'

import { ClipboardPaste, Package, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useReducer, useState } from 'react'
import { toast } from 'sonner'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCreateImage } from '@/hooks/use-tool'
import { parseImageUrl } from '@/lib/image-utils'
import type { ToolImage } from '@/types/tool'

type ImageFormState = {
  name: string
  version: string
  description: string
  homepage: string
  paperLink: string
  registry: string
  namespace: string
  repository: string
  tag: string
}
type ImageFormAction =
  | { type: 'SET'; field: keyof ImageFormState; value: string }
  | {
      type: 'IMPORT_IMAGE_URL'
      value: Pick<
        ImageFormState,
        'registry' | 'namespace' | 'repository' | 'tag'
      >
    }
  | { type: 'RESET' }

const INITIAL_IMAGE_FORM: ImageFormState = {
  name: '',
  version: '',
  description: '',
  homepage: '',
  paperLink: '',
  registry: 'docker.io',
  namespace: 'biocontainers',
  repository: '',
  tag: '',
}

function imageFormReducer(
  state: ImageFormState,
  action: ImageFormAction,
): ImageFormState {
  switch (action.type) {
    case 'SET':
      return { ...state, [action.field]: action.value }
    case 'IMPORT_IMAGE_URL':
      return { ...state, ...action.value }
    case 'RESET':
      return INITIAL_IMAGE_FORM
  }
}

const DEFAULT_TRIGGER = (
  <Button>
    <Plus className='size-4 mr-2' />
    新建镜像
  </Button>
)

interface CreateImageDialogProps {
  trigger?: React.ReactNode
}

type ImportImageUrlButtonProps = {
  onImport: (
    value: Pick<
      ImageFormState,
      'registry' | 'namespace' | 'repository' | 'tag'
    >,
  ) => void
}

function ImportImageUrlButton({ onImport }: ImportImageUrlButtonProps) {
  const t = useTranslations('image.dialog')
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = async () => {
    if (!navigator.clipboard?.readText) {
      toast.error(t('clipboardUnavailable'))
      return
    }

    setIsImporting(true)
    try {
      const parsedUrl = parseImageUrl(await navigator.clipboard.readText())
      if (!parsedUrl) {
        toast.error(t('importInvalid'))
        return
      }

      onImport(parsedUrl)
      toast.success(t('importSuccess'))
    } catch {
      toast.error(t('clipboardReadFail'))
    } finally {
      setIsImporting(false)
    }
  }

  const label = isImporting ? t('importing') : t('importFromClipboard')

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type='button'
            variant='outline'
            size='icon-sm'
            disabled={isImporting}
            aria-label={label}
            onClick={handleImport}
          >
            <ClipboardPaste
              className={isImporting ? 'size-4 animate-pulse' : 'size-4'}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function CreateImageDialog({ trigger }: CreateImageDialogProps) {
  const [
    {
      name,
      version,
      description,
      homepage,
      paperLink,
      registry,
      namespace,
      repository,
      tag,
    },
    dispatch,
  ] = useReducer(imageFormReducer, INITIAL_IMAGE_FORM)
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
      image: { registry, namespace, repository, tag },
    }

    createImage(newImage, {
      onSuccess: () => {
        setOpen(false)
        dispatch({ type: 'RESET' })
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
                  onChange={(e) =>
                    dispatch({
                      type: 'SET',
                      field: 'name',
                      value: e.target.value,
                    })
                  }
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
                  onChange={(e) =>
                    dispatch({
                      type: 'SET',
                      field: 'version',
                      value: e.target.value,
                    })
                  }
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
                onChange={(e) =>
                  dispatch({
                    type: 'SET',
                    field: 'description',
                    value: e.target.value,
                  })
                }
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
                  onChange={(e) =>
                    dispatch({
                      type: 'SET',
                      field: 'homepage',
                      value: e.target.value,
                    })
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='paperLink'>论文链接</Label>
                <Input
                  id='paperLink'
                  type='url'
                  placeholder='https://doi.org/...'
                  value={paperLink}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET',
                      field: 'paperLink',
                      value: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Docker 镜像配置 */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between gap-3'>
              <h3 className='text-sm font-semibold text-foreground'>
                Docker 镜像配置
              </h3>
              <ImportImageUrlButton
                onImport={(value) =>
                  dispatch({ type: 'IMPORT_IMAGE_URL', value })
                }
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='registry'>
                  Registry <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='registry'
                  placeholder='例如: docker.io'
                  value={registry}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET',
                      field: 'registry',
                      value: e.target.value,
                    })
                  }
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
                  onChange={(e) =>
                    dispatch({
                      type: 'SET',
                      field: 'namespace',
                      value: e.target.value,
                    })
                  }
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
                  onChange={(e) =>
                    dispatch({
                      type: 'SET',
                      field: 'repository',
                      value: e.target.value,
                    })
                  }
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
                  onChange={(e) =>
                    dispatch({
                      type: 'SET',
                      field: 'tag',
                      value: e.target.value,
                    })
                  }
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
