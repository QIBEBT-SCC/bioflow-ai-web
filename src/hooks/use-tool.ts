'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getDocument, refreshDocument } from '@/app/actions/document'
import {
  createImage,
  getImage,
  getImageCount,
  getImageList,
  runInImage,
  searchImages,
  updateImage,
} from '@/app/actions/image'
import {
  createTool,
  deleteTool,
  getGroupTools,
  getTool,
  getToolArg,
  getToolCount,
  getToolGroupList,
  getToolList,
  getToolTagList,
  searchTools,
  updateTool,
} from '@/app/actions/tool'
import type { ToolArgPublic } from '@/types/node'
import type {
  DockerToolCreate,
  DockerToolUpdate,
  SimpleToolInfo,
  ToolGroup,
  ToolHelpDoc,
  ToolImage,
  ToolImagePublic,
  ToolInfo,
  ToolTag,
} from '@/types/tool'

/**
 * 获取工具参数（用于节点编辑器）
 */
export const useToolArg = (uid: string) => {
  return useQuery<ToolArgPublic>({
    queryKey: ['toolArg', uid],
    queryFn: () => getToolArg(uid),
    enabled: !!uid,
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * 获取工具分组列表
 */
export const useToolGroupList = () => {
  return useQuery<ToolGroup[]>({
    queryKey: ['toolGroupList'],
    queryFn: () => getToolGroupList(),
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * 获取分组下的工具列表
 */
export const useGroupTools = (parent_id?: number) => {
  return useQuery<SimpleToolInfo[]>({
    queryKey: ['groupTools', parent_id],
    queryFn: () => getGroupTools(parent_id),
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * 搜索工具
 */
export const useSearchTools = (name: string, offset: number = 0) => {
  return useQuery<SimpleToolInfo[]>({
    queryKey: ['searchTools', name, offset],
    queryFn: () => searchTools(name, offset),
    enabled: !!name,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * 获取工具标签列表
 */
export const useToolTagList = () => {
  return useQuery<ToolTag[]>({
    queryKey: ['toolTagList'],
    queryFn: () => getToolTagList(),
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * 获取工具总数
 */
export const useToolCount = () => {
  return useQuery<number>({
    queryKey: ['toolCount'],
    queryFn: () => getToolCount(),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 获取工具列表
 */
export const useToolList = (offset: number = 0, limit: number = 10) => {
  return useQuery<SimpleToolInfo[]>({
    queryKey: ['toolList', offset, limit],
    queryFn: () => getToolList(offset, limit),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 获取工具详情
 */
export const useTool = (uid: string) => {
  return useQuery<ToolInfo>({
    queryKey: ['tool', uid],
    queryFn: () => getTool(uid),
    enabled: !!uid,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 创建工具
 */
export const useCreateTool = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tool: DockerToolCreate) => createTool(tool),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toolList'] })
      queryClient.invalidateQueries({ queryKey: ['toolCount'] })
      queryClient.invalidateQueries({ queryKey: ['groupTools'] })
      queryClient.invalidateQueries({ queryKey: ['searchTools'] })
      toast.success('工具创建成功')
    },
    onError: (error: Error) => {
      toast.error(`工具创建失败: ${error.message}`)
    },
  })
}

/**
 * 删除工具
 */
export const useDeleteTool = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uid: string) => deleteTool(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toolList'] })
      queryClient.invalidateQueries({ queryKey: ['toolCount'] })
      queryClient.invalidateQueries({ queryKey: ['groupTools'] })
      toast.success('工具删除成功')
    },
    onError: (error: Error) => {
      toast.error(`工具删除失败: ${error.message}`)
    },
  })
}

/**
 * 更新工具
 */
export const useUpdateTool = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      uid,
      tool,
    }: {
      uid: string
      tool: Partial<DockerToolUpdate>
    }) => updateTool(uid, tool),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tool', variables.uid] })
      queryClient.invalidateQueries({ queryKey: ['toolList'] })
      queryClient.invalidateQueries({ queryKey: ['groupTools'] })
      toast.success('工具更新成功')
    },
    onError: (error: Error) => {
      toast.error(`工具更新失败: ${error.message}`)
    },
  })
}

/**
 * 搜索镜像
 */
export const useSearchImages = (name: string) => {
  return useQuery<ToolImage[]>({
    queryKey: ['images', name],
    queryFn: () => searchImages(name),
    enabled: !!name,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 获取镜像列表
 */
export const useImageList = (offset: number = 0, limit: number = 12) => {
  return useQuery<ToolImage[]>({
    queryKey: ['imageList', offset, limit],
    queryFn: () => getImageList(offset, limit),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 获取镜像总数
 */
export const useImageCount = () => {
  return useQuery<number>({
    queryKey: ['imageCount'],
    queryFn: () => getImageCount(),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 获取镜像详情
 */
export const useImage = (uid: string) => {
  return useQuery<ToolImagePublic>({
    queryKey: ['image', uid],
    queryFn: () => getImage(uid),
    enabled: !!uid,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 创建镜像
 */
export const useCreateImage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (image: ToolImage) => createImage(image),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] })
      queryClient.invalidateQueries({ queryKey: ['imageList'] })
      queryClient.invalidateQueries({ queryKey: ['imageCount'] })
      toast.success('镜像创建成功')
    },
    onError: (error: Error) => {
      toast.error(`镜像创建失败: ${error.message}`)
    },
  })
}

/**
 * 更新镜像
 */
export const useUpdateImage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uid, image }: { uid: string; image: Partial<ToolImage> }) =>
      updateImage(uid, image),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['images', variables.uid] })
      queryClient.invalidateQueries({ queryKey: ['imageList'] })
      queryClient.invalidateQueries({ queryKey: ['imageCount'] })
      toast.success('镜像更新成功')
    },
    onError: (error: Error) => {
      toast.error(`镜像更新失败: ${error.message}`)
    },
  })
}

/**
 * 在镜像中运行命令
 */
export const useRunInImage = () => {
  return useMutation({
    mutationFn: ({ uid, command }: { uid: string; command: string }) =>
      runInImage(uid, command),
  })
}

/**
 * 刷新文档
 */
export const useRefreshDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uid: string) => refreshDocument(uid),
    onSuccess: (_data, uid) => {
      queryClient.invalidateQueries({ queryKey: ['tool', uid] })
      toast.success('文档刷新成功')
    },
    onError: (error: Error) => {
      toast.error(`文档刷新失败: ${error.message}`)
    },
  })
}
