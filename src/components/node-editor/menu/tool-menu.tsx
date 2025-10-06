'use client'

import { ChevronRightIcon, SearchIcon, XIcon } from 'lucide-react'
import type React from 'react'
import { useRef, useState } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useGroupTools,
  useSearchTools,
  useToolGroupList,
} from '@/hooks/use-tool'
import { useToolNodeStore } from '@/stores/toolStore'
import type { SimpleToolInfo, ToolGroup } from '@/types/tool'

interface ToolMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelectTool: (toolType: string, toolUid: string) => void
}

// 工具骨架屏组件
const ToolSkeleton = () => (
  <div className='p-3 border rounded-lg'>
    <Skeleton className='h-5 w-3/4 mb-2' />
    <Skeleton className='h-4 w-full mb-1' />
    <Skeleton className='h-4 w-2/3' />
  </div>
)

// 分组骨架屏组件
const GroupSkeleton = () => (
  <div className='w-full p-2 rounded flex justify-between items-center'>
    <Skeleton className='h-5 w-3/4' />
    <Skeleton className='h-4 w-4 rounded-full' />
  </div>
)

export const ToolMenu: React.FC<ToolMenuProps> = ({
  isOpen,
  onClose,
  onSelectTool,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const isSearchMode = searchQuery.trim() !== ''

  const { currentGroupId, setCurrentGroupId } = useToolNodeStore()
  const { data: allGroups = [], isLoading: loadingGroups } = useToolGroupList()
  const { data: tools = [], isLoading: loadingTools } =
    useGroupTools(currentGroupId)
  const { data: searchResults = [], isLoading: searchLoading } =
    useSearchTools(searchQuery)

  const toolsContainerRef = useRef<HTMLDivElement>(null)

  // 获取顶级分组
  const topLevelGroups = allGroups.filter(
    (group) => group.parent_id === undefined || group.parent_id === null,
  )

  // 获取当前选中分组的子分组
  const getChildGroups = (parentId: number | undefined) => {
    return allGroups.filter((group) => group.parent_id === parentId)
  }

  // 递归查找分组路径
  function getGroupPath(
    currentGroupId: number | undefined,
    allGroups: ToolGroup[],
  ): ToolGroup[] {
    if (!currentGroupId) return []
    const path: ToolGroup[] = []
    const currentGroup = allGroups.find((g) => g.id === currentGroupId)
    if (!currentGroup) return path

    let group = currentGroup
    path.unshift(group)

    while (group.parent_id !== undefined && group.parent_id !== null) {
      const parentGroup = allGroups.find((g) => g.id === group.parent_id)
      if (!parentGroup) break
      path.unshift(parentGroup)
      group = parentGroup
    }

    return path
  }

  // 处理分组选择
  const handleGroupSelect = (groupId: number) => {
    setCurrentGroupId(groupId)
  }

  // 处理工具选择
  const handleToolSelect = (tool: SimpleToolInfo) => {
    onSelectTool('tool', String(tool.uid))
    onClose()
  }

  const renderBreadcrumbs = () => {
    const path = getGroupPath(currentGroupId, allGroups)
    if (path.length === 0) return null
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button
                type='button'
                onClick={() => setCurrentGroupId(undefined)}
                className='hover:text-gray-900 whitespace-nowrap font-medium bg-transparent border-none p-0 m-0'
              >
                全部
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {path.map((group) => (
            <div key={group.id} className='flex items-center'>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <button
                    type='button'
                    onClick={() => setCurrentGroupId(group.id)}
                    className='hover:text-gray-900 whitespace-nowrap bg-transparent border-none p-0 m-0'
                  >
                    {group.name}
                  </button>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center animate-in fade-in'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in zoom-in-95'>
        {/* 菜单头部 */}
        <div className='p-4 border-b flex justify-between items-center shrink-0'>
          <h2 className='text-xl font-semibold'>选择工具</h2>
          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='rounded-full'
          >
            <XIcon className='h-5 w-5' />
          </Button>
        </div>

        {/* 搜索框 */}
        <div className='p-4 border-b shrink-0'>
          <div className='relative'>
            <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
            <Input
              type='text'
              placeholder='搜索工具...'
              className='pl-10 pr-10'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant='ghost'
                size='icon'
                className='absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8'
                onClick={() => setSearchQuery('')}
              >
                <XIcon className='h-4 w-4' />
              </Button>
            )}
          </div>
        </div>

        {/* 菜单内容 */}
        <div className='flex flex-1 overflow-hidden min-h-0'>
          {/* 分组导航 - 只在非搜索模式显示 */}
          {!isSearchMode && (
            <div className='w-1/3 border-r'>
              <ScrollArea className='h-full p-4'>
                {currentGroupId === undefined ? (
                  <div className='space-y-2'>
                    {loadingGroups
                      ? ['g1', 'g2', 'g3', 'g4', 'g5'].map((id) => (
                          <GroupSkeleton key={id} />
                        ))
                      : topLevelGroups.map((group) => (
                          <Button
                            key={group.id}
                            variant='ghost'
                            className='w-full justify-between'
                            onClick={() => handleGroupSelect(group.id)}
                          >
                            <span>{group.name}</span>
                            <ChevronRightIcon className='h-4 w-4' />
                          </Button>
                        ))}
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {renderBreadcrumbs()}
                    <div className='mt-4 space-y-2'>
                      {loadingGroups
                        ? ['c1', 'c2', 'c3'].map((id) => (
                            <GroupSkeleton key={id} />
                          ))
                        : getChildGroups(currentGroupId).map((group) => (
                            <Button
                              key={group.id}
                              variant='ghost'
                              className='w-full justify-between'
                              onClick={() => handleGroupSelect(group.id)}
                            >
                              <span>{group.name}</span>
                              <ChevronRightIcon className='h-4 w-4' />
                            </Button>
                          ))}
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* 工具列表 */}
          <div
            className={`flex-1 overflow-hidden ${isSearchMode ? 'w-full' : ''}`}
          >
            <ScrollArea className='h-full p-4' ref={toolsContainerRef}>
              {isSearchMode ? (
                // 搜索模式
                <div>
                  <h3 className='text-lg font-medium mb-4'>
                    搜索结果: "{searchQuery}"
                  </h3>
                  {searchLoading ? (
                    <div className='space-y-3'>
                      {['ts1', 'ts2', 'ts3'].map((id) => (
                        <ToolSkeleton key={id} />
                      ))}
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className='grid gap-3'>
                      {searchResults.map((tool) => (
                        <button
                          type='button'
                          key={tool.uid}
                          className='p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-left w-full'
                          onClick={() => handleToolSelect(tool)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handleToolSelect(tool)
                            }
                          }}
                        >
                          <div className='font-medium mb-1'>{tool.name}</div>
                          <div className='text-sm text-gray-600 mb-2'>
                            {tool.description}
                          </div>
                          <div className='text-xs text-gray-500'>
                            分组:{' '}
                            {allGroups.find((g) => g.id === tool.group_id)
                              ?.name || tool.group_id}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-8 text-gray-500'>
                      没有找到匹配的工具
                    </div>
                  )}
                </div>
              ) : (
                // 分组模式
                <div>
                  <h3 className='text-lg font-medium mb-4'>
                    {currentGroupId
                      ? allGroups.find((g) => g.id === currentGroupId)?.name ||
                        ''
                      : '未分组'}{' '}
                    工具
                  </h3>
                  {loadingTools ? (
                    <div className='space-y-3'>
                      {['tl1', 'tl2', 'tl3', 'tl4', 'tl5'].map((id) => (
                        <ToolSkeleton key={id} />
                      ))}
                    </div>
                  ) : tools.length > 0 ? (
                    <div className='grid gap-3'>
                      {tools.map((tool) => (
                        <button
                          type='button'
                          key={tool.uid}
                          className='p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-left w-full'
                          onClick={() => handleToolSelect(tool)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handleToolSelect(tool)
                            }
                          }}
                        >
                          <div className='font-medium mb-1'>{tool.name}</div>
                          <div className='text-sm text-gray-600'>
                            {tool.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-8 text-gray-500'>
                      该分组下没有工具
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}
