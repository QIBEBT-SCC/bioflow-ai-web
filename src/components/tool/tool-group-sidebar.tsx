'use client'

import { ChevronRight, Folder, FolderOpen, FolderPlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { FilterPanel } from '@/components/layout/filter-panel'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useToolGroupList, useToolList } from '@/hooks/use-tool'
import { cn } from '@/lib/utils'
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

function buildGroupTree(groups: ToolGroup[]): ToolGroupWithChildren[] {
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

function groupItemClass(selected: boolean) {
  return cn(
    'flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors hover:bg-muted',
    selected && 'bg-accent font-medium text-accent-foreground hover:bg-accent',
  )
}

function GroupCount({ value }: { value: number }) {
  return (
    <span className='ml-auto shrink-0 text-xs text-muted-foreground tabular-nums'>
      {value}
    </span>
  )
}

interface GroupTreeProps {
  groups: ToolGroupWithChildren[]
  selectedGroupId: number | null
  expandedGroups: Record<number, boolean>
  onSelectGroup: (id: number | null) => void
  onToggleExpand: (id: number) => void
}

function GroupTree({
  groups,
  selectedGroupId,
  expandedGroups,
  onSelectGroup,
  onToggleExpand,
}: GroupTreeProps) {
  return groups.map((group) => {
    const isExpanded = expandedGroups[group.id] || false
    const isSelected = selectedGroupId === group.id
    const hasChildren = Boolean(group.children && group.children.length > 0)

    if (!hasChildren) {
      return (
        <button
          key={group.id}
          type='button'
          className={groupItemClass(isSelected)}
          onClick={() => onSelectGroup(group.id)}
        >
          <Folder className='size-4 shrink-0 text-muted-foreground' />
          <span className='truncate'>{group.name}</span>
          <GroupCount value={calculateTotalToolCount(group)} />
        </button>
      )
    }

    return (
      <Collapsible
        key={group.id}
        open={isExpanded}
        onOpenChange={() => onToggleExpand(group.id)}
      >
        <CollapsibleTrigger asChild>
          <button
            type='button'
            className={groupItemClass(isSelected)}
            onClick={() => onSelectGroup(group.id)}
          >
            {isExpanded ? (
              <FolderOpen className='size-4 shrink-0 text-muted-foreground' />
            ) : (
              <Folder className='size-4 shrink-0 text-muted-foreground' />
            )}
            <span className='truncate'>{group.name}</span>
            <GroupCount value={calculateTotalToolCount(group)} />
            <ChevronRight
              className={cn(
                'size-3.5 shrink-0 text-muted-foreground transition-transform',
                isExpanded && 'rotate-90',
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className='ml-4 space-y-0.5 border-l pt-0.5 pl-1'>
          <GroupTree
            groups={group.children ?? []}
            selectedGroupId={selectedGroupId}
            expandedGroups={expandedGroups}
            onSelectGroup={onSelectGroup}
            onToggleExpand={onToggleExpand}
          />
        </CollapsibleContent>
      </Collapsible>
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

  const { data: allToolsPage } = useToolList(0, 1)
  const allToolsCount = allToolsPage?.total ?? 0
  const { data: toolGroups = [] } = useToolGroupList()

  const toggleGroupExpanded = (groupId: number) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  const groupTree = buildGroupTree(toolGroups)

  return (
    <FilterPanel
      title={t('title')}
      action={
        <Button
          variant='ghost'
          size='icon'
          className='size-7'
          aria-label={t('createGroup')}
        >
          <FolderPlus className='size-4' />
        </Button>
      }
    >
      <div className='space-y-0.5'>
        <button
          type='button'
          className={groupItemClass(selectedGroupId === null)}
          onClick={() => onSelectGroup(null)}
        >
          <span className='truncate'>{t('allTools')}</span>
          <GroupCount value={allToolsCount} />
        </button>
        <GroupTree
          groups={groupTree}
          selectedGroupId={selectedGroupId}
          expandedGroups={expandedGroups}
          onSelectGroup={onSelectGroup}
          onToggleExpand={toggleGroupExpanded}
        />
      </div>
    </FilterPanel>
  )
}
