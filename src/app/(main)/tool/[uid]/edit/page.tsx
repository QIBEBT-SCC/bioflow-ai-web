'use client'

import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ToolConfigForm, type ToolConfigValues } from '@/components/tool/tool-config-form'
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
  useTool,
  useToolGroupList,
  useUpdateTool,
} from '@/hooks/use-tool'
import type { FileMount, ParamDefine } from '@/types/tool'

export default function EditToolPage() {
  const params = useParams()
  const router = useRouter()
  const toolUid = params.uid as string
  const { data: tool, isLoading } = useTool(toolUid)
  const { data: toolGroups = [] } = useToolGroupList()
  const { mutate: updateTool, isPending: isUpdating } = useUpdateTool()

  const [formState, setFormState] = useState<ToolConfigValues | null>(null)

  const defaultGroupId = useMemo(() => {
    return tool?.group_id ?? toolGroups[0]?.id ?? 1
  }, [tool?.group_id, toolGroups])

  useEffect(() => {
    if (tool) {
      setFormState({
        name: tool.name,
        description: tool.description,
        group_id: defaultGroupId,
        command_template: tool.command_template,
        dynamic_params: tool.dynamic_params.map((param, idx) => ({
          ...param,
          index: param.index ?? idx,
        })),
        immutable_static_params: tool.immutable_static_params ?? null,
        modifiable_static_params: tool.modifiable_static_params ?? null,
        file_mounts: tool.file_mounts.map((file) => ({ ...file })),
      })
    }
  }, [tool, defaultGroupId])

  const updateFormField = (
    field: keyof EditableToolForm,
    value:
      | string
      | number
      | boolean
      | ParamDefine[]
      | FileMount[],
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

  const canSave =
    !!formState &&
    formState.name.trim().length > 0 &&
    formState.command_template.trim().length > 0

  const handleSaveChanges = () => {
    if (!tool || !formState || !canSave) return
    updateTool(
      { uid: tool.uid, tool: formState },
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
          <Loader2 className='h-6 w-6 animate-spin' />
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
                  <Link href={`/tool/${tool.uid}`}>{tool.name}</Link>
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
              href={`/tool/${tool.uid}`}
              className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2'
            >
              <ArrowLeft className='h-4 w-4 mr-1' />
              返回工具详情
            </Link>
            <h1 className='text-2xl font-bold'>编辑工具</h1>
            <p className='text-muted-foreground mt-1'>
              更新工具参数与文件挂载配置
            </p>
          </div>

          <ToolConfigForm
            value={formState}
            toolGroups={toolGroups}
            onFieldChange={updateFormField}
            onAddDynamicParam={addDynamicParam}
            onUpdateDynamicParam={updateDynamicParam}
            onRemoveDynamicParam={removeDynamicParam}
            onAddFileMount={addFileMount}
            onUpdateFileMount={updateFileMount}
            onRemoveFileMount={removeFileMount}
            imageSummary={{
              name: tool.image.name,
              version: tool.image.version,
            }}
          />

          <div className='flex justify-end pt-4 border-t'>
            <Button
              variant='outline'
              className='mr-3'
              onClick={() => router.push(`/tool/${tool.uid}`)}
              disabled={isUpdating}
            >
              取消
            </Button>
            <Button onClick={handleSaveChanges} disabled={!canSave || isUpdating}>
              {isUpdating ? '保存中...' : '保存修改'}
            </Button>
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}
