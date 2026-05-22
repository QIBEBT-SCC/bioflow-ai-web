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

interface ToolGroupWithChildren extends ToolGroup {
  children?: ToolGroupWithChildren[]
}

function calculateTotalToolCount(group: ToolGroupWithChildren): number {
  let total = group.tool_count || 0
  if (group.children && group.children.length > 0) {
    for (const child of group.children) {
      total += calculateTotalToolCount(child)
    }
  }
  return total
}

interface GroupTreeProps {
  groups: ToolGroupWithChildren[]
  level: number
  selectedGroupId: number | null
  expandedGroups: Record<number, boolean>
  onSelectGroup: (id: number | null) => void
  onToggleExpand: (id: number) => void
}

function GroupTree({
  groups,
  level,
  selectedGroupId,
  expandedGroups,
  onSelectGroup,
  onToggleExpand,
}: GroupTreeProps) {
  return groups.map((group) => {
    const isExpanded = expandedGroups[group.id] || false
    return (
      <div key={group.id} className='space-y-1'>
        <div className={`pl-${level * 4}`}>
          {group.children && group.children.length > 0 ? (
            <Collapsible
              open={isExpanded}
              onOpenChange={() => onToggleExpand(group.id)}
              className='space-y-1'
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant={selectedGroupId === group.id ? 'secondary' : 'ghost'}
                  className='w-full justify-start'
                  size='sm'
                  onClick={() => onSelectGroup(group.id)}
                >
                  {isExpanded ? (
                    <FolderOpen className='size-4 mr-2 shrink-0' />
                  ) : (
                    <Folder className='size-4 mr-2 shrink-0' />
                  )}
                  <span className='flex-1 truncate'>{group.name}</span>
                  <Badge className='ml-2 shrink-0'>
                    {calculateTotalToolCount(group)}
                  </Badge>
                  <ChevronRight
                    className={`size-4 ml-2 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className='pl-4 space-y-1'>
                <GroupTree
                  groups={group.children}
                  level={level + 1}
                  selectedGroupId={selectedGroupId}
                  expandedGroups={expandedGroups}
                  onSelectGroup={onSelectGroup}
                  onToggleExpand={onToggleExpand}
                />
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
    )
  })
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

  const toggleGroupExpanded = (groupId: number) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  const buildGroupTree = (groups: ToolGroup[]): ToolGroupWithChildren[] => {
    const groupMap: Record<number, ToolGroupWithChildren> = {}
    const rootGroups: ToolGroupWithChildren[] = []
    for (const group of groups) {
      groupMap[group.id] = { ...group, children: [] }
    }
    for (const group of groups) {
      if (!group.parent_id) {
        rootGroups.push(groupMap[group.id])
      } else if (groupMap[group.parent_id]) {
        const parentGroup = groupMap[group.parent_id]
        if (!parentGroup.children) parentGroup.children = []
        parentGroup.children.push(groupMap[group.id])
      }
    }
    return rootGroups
  }

  const groupTree = buildGroupTree(toolGroups)

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

            <GroupTree
              groups={groupTree}
              level={0}
              selectedGroupId={selectedGroupId}
              expandedGroups={expandedGroups}
              onSelectGroup={onSelectGroup}
              onToggleExpand={toggleGroupExpanded}
            />
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}
