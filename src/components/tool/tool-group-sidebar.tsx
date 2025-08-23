import {Card, CardContent} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {ChevronRight, Folder, FolderOpen, FolderPlus} from "lucide-react";
import {Badge} from "@/components/ui/badge.tsx";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible.tsx";
import {useState} from "react";
import {useToolCount, useToolGroupList} from "@/hooks/use-tool.tsx";
import {ToolGroup} from "@/types/tool.tsx";

// 扩展ToolGroup类型以支持客户端渲染需要的children属性
interface ToolGroupWithChildren extends ToolGroup {
    children?: ToolGroupWithChildren[]
}

export function ToolGroupSidebar() {
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
    const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({})

    const {data: allToolsCount = 0} = useToolCount();
    const {data: toolGroups = []} = useToolGroupList();

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
            groupMap[group.id] = {...group, children: []}
        })

        // 然后构建树结构
        groups.forEach((group) => {
            if (!group.parent_id) {
                rootGroups.push(groupMap[group.id])
            } else if (groupMap[group.parent_id]) {
                if (!groupMap[group.parent_id].children) {
                    groupMap[group.parent_id].children = []
                }
                groupMap[group.parent_id].children!.push(groupMap[group.id])
            }
        })

        return rootGroups
    }
    // 构建分组树
    const groupTree = buildGroupTree(toolGroups)

    // 递归渲染分组树
    const renderGroupTree = (groups: ToolGroupWithChildren[], level = 0) => {
        return groups.map((group) => (
            <div key={group.id} className="space-y-1">
                <div className={`pl-${level * 4}`}>
                    {group.children && group.children.length > 0 ? (
                        <Collapsible
                            open={isGroupExpanded(group.id)}
                            onOpenChange={() => toggleGroupExpanded(group.id)}
                            className="space-y-1"
                        >
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant={selectedGroupId === group.id ? "secondary" : "ghost"}
                                    className="w-full justify-start"
                                    size="sm"
                                    onClick={() => setSelectedGroupId(group.id)}
                                >
                                    {isGroupExpanded(group.id) ? (
                                        <FolderOpen className="h-4 w-4 mr-2"/>
                                    ) : (
                                        <Folder className="h-4 w-4 mr-2"/>
                                    )}
                                    <span>{group.name}</span>
                                    <Badge className="ml-auto">{group.tool_count}</Badge>
                                    <ChevronRight
                                        className={`h-4 w-4 ml-2 transition-transform ${isGroupExpanded(group.id) ? "rotate-90" : ""}`}
                                    />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pl-4 space-y-1">
                                {renderGroupTree(group.children, level + 1)}
                            </CollapsibleContent>
                        </Collapsible>
                    ) : (
                        <Button
                            variant={selectedGroupId === group.id ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            size="sm"
                            onClick={() => setSelectedGroupId(group.id)}
                        >
                            <Folder className="h-4 w-4 mr-2"/>
                            <span>{group.name}</span>
                            <Badge className="ml-auto">{group.tool_count}</Badge>
                        </Button>
                    )}
                </div>
            </div>
        ))
    }

    return (
        <aside className="w-full md:w-64 shrink-0">
            <Card className="py-0 gap-0">
                <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-md font-medium">工具分组</h2>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <FolderPlus className="h-4 w-4"/>
                        </Button>
                    </div>

                    <div className="space-y-1 mb-4">
                        <Button
                            variant={selectedGroupId === null ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            size="sm"
                            onClick={() => setSelectedGroupId(null)}
                        >
                            <span>所有工具</span>
                            <Badge className="ml-auto">{allToolsCount}</Badge>
                        </Button>

                        {renderGroupTree(groupTree)}
                    </div>
                </CardContent>
            </Card>
        </aside>
    )
}