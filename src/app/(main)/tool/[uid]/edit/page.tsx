'use client'

import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  ToolConfigForm,
  type ToolConfigValues,
} from '@/components/tool/tool-config-form'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import {
  useRefreshDocument,
  useTool,
  useToolGroupList,
  useToolTagList,
  useUpdateTool,
} from '@/hooks/use-tool'
import type {
  DockerToolCreate,
  FileMount,
  ParamDefine,
  ToolTag,
} from '@/types/tool'

export default function EditToolPage() {
  const params = useParams()
  const router = useRouter()
  const toolUid = params.uid as string
  const { data: tool, isLoading } = useTool(toolUid)
  const { data: toolGroups = [] } = useToolGroupList()
  const { data: availableTags = [] } = useToolTagList()
  const { mutate: updateTool, isPending: isUpdating } = useUpdateTool()
  const { mutate: refreshDoc, isPending: isRefreshing } = useRefreshDocument()

  const [formState, setFormState] = useState<ToolConfigValues | null>(null)

  const defaultGroupId = useMemo(() => {
    return tool?.group_id ?? toolGroups[0]?.id ?? 1
  }, [tool?.group_id, toolGroups])

  useEffect(() => {
    if (tool) {
      setFormState({
        name: tool.name,
        image_uid: tool.image.uid || '',
        description: tool.description,
        help_command: tool.help_doc.help_command,
        group_id: defaultGroupId,
        command_template: tool.command_template,
        dynamic_params: tool.dynamic_params.map((param, idx) => ({
          ...param,
          index: param.index ?? idx,
        })),
        immutable_static_params: tool.immutable_static_params ?? null,
        modifiable_static_params: tool.modifiable_static_params ?? null,
        file_mounts: tool.file_mounts.map((file) => ({ ...file })),
        tags: tool.tags || [],
      })
    }
  }, [tool, defaultGroupId])

  const updateFormField = (
    field: keyof ToolConfigValues,
    value:
      | string
      | number
      | boolean
      | null
      | ParamDefine[]
      | FileMount[]
      | ToolTag[],
  ) => {
    setFormState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [field]: value,
      }
    })
  }

  const addDynamicParam = () => {
    setFormState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        dynamic_params: [
          ...prev.dynamic_params,
          {
            description: '',
            command: '',
            is_position: false,
            index: prev.dynamic_params.length,
            required: true,
          },
        ],
      }
    })
  }

  const updateDynamicParam = (
    index: number,
    field: keyof ParamDefine,
    value: string | number | boolean,
  ) => {
    setFormState((prev) => {
      if (!prev) return prev
      const updated = prev.dynamic_params.map((param, idx) =>
        idx === index ? { ...param, [field]: value } : param,
      )
      return {
        ...prev,
        dynamic_params: updated,
      }
    })
  }

  const removeDynamicParam = (index: number) => {
    setFormState((prev) => {
      if (!prev) return prev
      const updated = prev.dynamic_params
        .filter((_, idx) => idx !== index)
        .map((param, idx) => ({ ...param, index: idx }))
      return {
        ...prev,
        dynamic_params: updated,
      }
    })
  }

  const addFileMount = () => {
    setFormState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        file_mounts: [
          ...prev.file_mounts,
          {
            name: '',
            description: '',
            file_path: '',
            file_type: 'OUTPUT',
            is_report: false,
            is_log: false,
            mount_path: '',
          },
        ],
      }
    })
  }

  const updateFileMount = (
    index: number,
    field: keyof FileMount,
    value: string | boolean,
  ) => {
    setFormState((prev) => {
      if (!prev) return prev
      const updated = prev.file_mounts.map((file, idx) =>
        idx === index ? { ...file, [field]: value } : file,
      )
      return {
        ...prev,
        file_mounts: updated,
      }
    })
  }

  const removeFileMount = (index: number) => {
    setFormState((prev) => {
      if (!prev) return prev
      const updated = prev.file_mounts.filter((_, idx) => idx !== index)
      return {
        ...prev,
        file_mounts: updated,
      }
    })
  }

  const reorderDynamicParams = (newParams: ParamDefine[]) =>
    setFormState((prev) =>
      prev ? { ...prev, dynamic_params: newParams } : prev,
    )

  const reorderFileMounts = (newMounts: FileMount[]) =>
    setFormState((prev) => (prev ? { ...prev, file_mounts: newMounts } : prev))

  const canSave =
    !!formState &&
    formState.name.trim().length > 0 &&
    formState.command_template.trim().length > 0

  const handleSaveChanges = () => {
    if (!tool || !formState || !canSave) return

    // 将 ToolConfigValues 转换为 DockerToolCreate
    const requestData: Partial<DockerToolCreate> = {
      ...formState,
      tag_ids: formState.tags.map((tag) => tag.id),
      immutable_static_params: formState.immutable_static_params ?? '',
      modifiable_static_params: formState.modifiable_static_params ?? '',
    }

    updateTool(
      { uid: tool.uid, tool: requestData },
      {
        onSuccess: () => {
          router.push(`/tool/${tool.uid}`)
        },
      },
    )
  }

  if (isLoading || !formState) {
    return (
      <SidebarInset className='h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center gap-2 text-muted-foreground'>
          <Loader2 className='size-6 animate-spin' />
          <span>加载工具信息...</span>
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset className='h-screen flex flex-col'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center gap-2 px-4 h-12 bg-background'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='!mr-2 !h-4' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbLink asChild>
                  <Link href='/tool'>工具</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className='hidden md:block' />
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbLink asChild>
                  <Link href={`/tool/${tool?.uid}`}>{tool?.name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className='hidden md:block' />
              <BreadcrumbItem>
                <BreadcrumbPage>编辑工具</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className='flex-1 overflow-y-auto'>
        <div className='container mx-auto py-6 max-w-4xl'>
          <div className='mb-6'>
            <Link
              href={`/tool/${tool?.uid}`}
              className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2'
            >
              <ArrowLeft className='size-4 mr-1' />
              返回工具详情
            </Link>
            <h1 className='text-2xl font-semibold'>编辑工具</h1>
            <p className='text-muted-foreground mt-1'>
              更新工具参数与文件挂载配置
            </p>
          </div>

          <ToolConfigForm
            value={formState}
            toolGroups={toolGroups}
            availableTags={availableTags}
            onFieldChange={updateFormField}
            onAddDynamicParam={addDynamicParam}
            onUpdateDynamicParam={updateDynamicParam}
            onRemoveDynamicParam={removeDynamicParam}
            onAddFileMount={addFileMount}
            onUpdateFileMount={updateFileMount}
            onRemoveFileMount={removeFileMount}
            onReorderDynamicParams={reorderDynamicParams}
            onReorderFileMounts={reorderFileMounts}
            imageSummary={{
              name: tool?.image.name,
              version: tool?.image.version,
            }}
            imageUid={tool?.image.uid}
          />

          <div className='flex justify-between pt-4 border-t'>
            <Button
              variant='outline'
              onClick={() =>
                tool?.help_doc.uid && refreshDoc(tool.help_doc.uid)
              }
              disabled={!tool?.help_doc.uid || isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className='size-4 mr-2 animate-spin' />
                  刷新中...
                </>
              ) : (
                <>
                  <RefreshCw className='size-4 mr-2' />
                  刷新文档
                </>
              )}
            </Button>
            <div className='flex gap-3'>
              <Button
                variant='outline'
                onClick={() => router.push(`/tool/${tool?.uid}`)}
                disabled={isUpdating}
              >
                取消
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={!canSave || isUpdating}
              >
                {isUpdating ? '保存中...' : '保存修改'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}
