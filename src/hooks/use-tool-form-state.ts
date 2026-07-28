import { useEffect, useMemo, useState } from 'react'
import type { ToolConfigValues } from '@/components/tool/tool-config-form'
import type {
  FileMount,
  ParamDefine,
  ToolGroup,
  ToolInfo,
  ToolTag,
} from '@/types/tool'

export function useToolFormState(
  tool: ToolInfo | undefined,
  toolGroups: ToolGroup[],
) {
  const defaultGroupId = useMemo(() => {
    return tool?.group_id ?? toolGroups[0]?.id ?? 1
  }, [tool?.group_id, toolGroups])

  const [formState, setFormState] = useState<ToolConfigValues | null>(null)

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
    setFormState((prev) => (prev ? { ...prev, [field]: value } : prev))
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
      return {
        ...prev,
        dynamic_params: prev.dynamic_params.map((param, idx) =>
          idx === index ? { ...param, [field]: value } : param,
        ),
      }
    })
  }

  const removeDynamicParam = (index: number) => {
    setFormState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        dynamic_params: prev.dynamic_params.reduce<typeof prev.dynamic_params>(
          (acc, param, idx) => {
            if (idx !== index) acc.push({ ...param, index: acc.length })
            return acc
          },
          [],
        ),
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
      return {
        ...prev,
        file_mounts: prev.file_mounts.map((file, idx) =>
          idx === index ? { ...file, [field]: value } : file,
        ),
      }
    })
  }

  const removeFileMount = (index: number) => {
    setFormState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        file_mounts: prev.file_mounts.filter((_, idx) => idx !== index),
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
    formState.description.trim().length > 0 &&
    formState.command_template.trim().length > 0

  return {
    formState,
    canSave,
    updateFormField,
    addDynamicParam,
    updateDynamicParam,
    removeDynamicParam,
    addFileMount,
    updateFileMount,
    removeFileMount,
    reorderDynamicParams,
    reorderFileMounts,
  }
}
