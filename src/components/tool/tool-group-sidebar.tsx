'use client'

import { ChevronRight, Folder, FolderOpen, FolderPlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useToolCount, useToolGroupList } from '@/hooks/use-tool'
import type { ToolGroup } from '@/types/tool'

// 扩展ToolGroup类型以支持客户端渲染需要的children属性
interface ToolGroupWithChildren extends ToolGroup {
  children?: ToolGroupWithChildren[]
}

interface ToolGroupSidebarProps {
  selectedGroupId: number | null
  onSelectGroup: (groupId: number | null) => void
}

export function ToolGroupSidebar({
  selectedGroupId,
  onSelectGroup,
}: ToolGroupSidebarProps) {
  const t = useTranslations('tool.Sidebar')
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>(
    {},
  )

  const { data: allToolsCount = 0 } = useToolCount()
  const { data: toolGroups = [] } = useToolGroupList()

  // 切换分组展开/折叠状态
  const toggleGroupExpanded = (groupId: number) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  // 检查分组是否展开
  const isGroupExpanded = (groupId: number) => {
    return expandedGroups[groupId] || false
  }

  // 构建分组树
  const buildGroupTree = (groups: ToolGroup[]): ToolGroupWithChildren[] => {
    const groupMap: Record<number, ToolGroupWithChildren> = {}
    const rootGroups: ToolGroupWithChildren[] = []

    // 首先创建所有分组的映射
    groups.forEach((group) => {
      groupMap[group.id] = { ...group, children: [] }
    })

    // 然后构建树结构
    groups.forEach((group) => {
      if (!group.parent_id) {
        rootGroups.push(groupMap[group.id])
      } else if (groupMap[group.parent_id]) {
        const parentGroup = groupMap[group.parent_id]
        if (!parentGroup.children) {
          parentGroup.children = []
        }
        parentGroup.children.push(groupMap[group.id])
      }
    })

    return rootGroups
  }

  // 递归计算分组的总工具数（包括所有子分组）
  const calculateTotalToolCount = (group: ToolGroupWithChildren): number => {
    let total = group.tool_count || 0
    if (group.children && group.children.length > 0) {
      group.children.forEach((child) => {
        total += calculateTotalToolCount(child)
      })
    }
    return total
  }

  // 构建分组树
  const groupTree = buildGroupTree(toolGroups)

  // 递归渲染分组树
  const renderGroupTree = (groups: ToolGroupWithChildren[], level = 0) => {
    return groups.map((group) => (
      <div key={group.id} className='space-y-1'>
        <div className={`pl-${level * 4}`}>
          {group.children && group.children.length > 0 ? (
            <Collapsible
              open={isGroupExpanded(group.id)}
              onOpenChange={() => toggleGroupExpanded(group.id)}
              className='space-y-1'
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant={selectedGroupId === group.id ? 'secondary' : 'ghost'}
                  className='w-full justify-start'
                  size='sm'
                  onClick={() => onSelectGroup(group.id)}
                >
                  {isGroupExpanded(group.id) ? (
                    <FolderOpen className='size-4 mr-2 shrink-0' />
                  ) : (
                    <Folder className='size-4 mr-2 shrink-0' />
                  )}
                  <span className='flex-1 truncate'>{group.name}</span>
                  <Badge className='ml-2 shrink-0'>
                    {calculateTotalToolCount(group)}
                  </Badge>
                  <ChevronRight
                    className={`size-4 ml-2 shrink-0 transition-transform ${
                      isGroupExpanded(group.id) ? 'rotate-90' : ''
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className='pl-4 space-y-1'>
                {renderGroupTree(group.children, level + 1)}
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <Button
              variant={selectedGroupId === group.id ? 'secondary' : 'ghost'}
              className='w-full justify-start'
              size='sm'
              onClick={() => onSelectGroup(group.id)}
            >
              <Folder className='size-4 mr-2 shrink-0' />
              <span className='flex-1 truncate'>{group.name}</span>
              <Badge className='ml-2 shrink-0'>
                {calculateTotalToolCount(group)}
              </Badge>
            </Button>
          )}
        </div>
      </div>
    ))
  }

  return (
    <aside className='w-full md:w-64 shrink-0'>
      <Card className='py-0 gap-0'>
        <CardContent className='p-4'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-md font-medium'>{t('title')}</h2>
            <Button variant='ghost' size='icon' className='size-8'>
              <FolderPlus className='size-4' />
            </Button>
          </div>

          <div className='space-y-1 mb-4'>
            <Button
              variant={selectedGroupId === null ? 'secondary' : 'ghost'}
              className='w-full justify-start'
              size='sm'
              onClick={() => onSelectGroup(null)}
            >
              <span className='flex-1 truncate'>{t('allTools')}</span>
              <Badge className='ml-2 shrink-0'>{allToolsCount}</Badge>
            </Button>

            {renderGroupTree(groupTree)}
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}
