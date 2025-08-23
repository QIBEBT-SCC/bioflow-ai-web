"use client"

import React, {useState, useRef} from "react"
import {Search, X, ChevronRight} from "lucide-react"
import {Skeleton} from "@/components/ui/skeleton.tsx"
import {useGroupTools, useSearchTools, useToolGroupList} from "@/hooks/use-tool.tsx";
import {useToolNodeStore} from "@/stores/toolStore.tsx";
import {type SimpleToolInfo, ToolGroup} from "@/types/tool.tsx";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbSeparator,
    BreadcrumbLink
} from "@/components/ui/breadcrumb.tsx";


interface ToolMenuProps {
    isOpen: boolean
    onClose: () => void
    onSelectTool: (toolType: string, toolUid: string) => void
}

// 工具骨架屏组件
const ToolSkeleton = () => (
    <div className="p-3 border rounded-lg">
        <Skeleton className="h-5 w-3/4 mb-2"/>
        <Skeleton className="h-4 w-full mb-1"/>
        <Skeleton className="h-4 w-2/3"/>
    </div>
)

// 分组骨架屏组件
const GroupSkeleton = () => (
    <div className="w-full p-2 rounded flex justify-between items-center">
        <Skeleton className="h-5 w-3/4"/>
        <Skeleton className="h-4 w-4 rounded-full"/>
    </div>
)

export const ToolMenu: React.FC<ToolMenuProps> = ({isOpen, onClose, onSelectTool}) => {
    const [searchQuery, setSearchQuery] = useState("")
    const isSearchMode = searchQuery.trim() !== '';

    const {currentGroupId, setCurrentGroupId} = useToolNodeStore();
    const {data: allGroups = [], isLoading: loadingGroups} = useToolGroupList();
    const {data: tools = [], isLoading: loadingTools} = useGroupTools({parent_id: currentGroupId});
    const {data: searchResults = [], isLoading: searchLoading} = useSearchTools({name: searchQuery})

    const toolsContainerRef = useRef<HTMLDivElement>(null)

    // 获取顶级分组
    const topLevelGroups = allGroups.filter((group) => group.parent_id === undefined || group.parent_id === null)

    // 获取当前选中分组的子分组
    const getChildGroups = (parentId: number | undefined) => {
        return allGroups.filter((group) => group.parent_id === parentId)
    }

    // 递归查找分组路径
    function getGroupPath(currentGroupId: number | undefined, allGroups: ToolGroup[]): ToolGroup[] {
        if (!currentGroupId) return [];
        const path: ToolGroup[] = [];
        const currentGroup = allGroups.find(g => g.id === currentGroupId);
        if (!currentGroup) return path;

        let group = currentGroup;
        path.unshift(group);

        while (group.parent_id !== undefined && group.parent_id !== null) {
            const parentGroup = allGroups.find(g => g.id === group.parent_id);
            if (!parentGroup) break;
            path.unshift(parentGroup);
            group = parentGroup;
        }

        return path;
    }

    // 处理分组选择
    const handleGroupSelect = (groupId: number) => {
        setCurrentGroupId(groupId);
    }

    // 处理工具选择
    const handleToolSelect = (tool: SimpleToolInfo) => {
        onSelectTool('tool', String(tool.id))
        onClose()
    }

    const renderBreadcrumbs = () => {
        const path = getGroupPath(currentGroupId, allGroups);
        if (path.length === 0) return null;
        return (
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <button onClick={() => setCurrentGroupId(undefined)}
                                    className="hover:text-gray-900 whitespace-nowrap font-medium bg-transparent border-none p-0 m-0">全部
                            </button>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    {path.map((group) => (
                        <React.Fragment key={group.id}>
                            <BreadcrumbSeparator/>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <button onClick={() => setCurrentGroupId(group.id)}
                                            className="hover:text-gray-900 whitespace-nowrap bg-transparent border-none p-0 m-0">{group.name}</button>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </React.Fragment>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>
        );
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
                {/* 菜单头部 */}
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold">工具菜单</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                        <X className="h-6 w-6"/>
                    </button>
                </div>

                {/* 搜索框 */}
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"/>
                        <input
                            type="text"
                            placeholder="搜索工具..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => {
                                const value = e.target.value
                                setSearchQuery(value)
                            }}
                        />
                        {searchQuery && (
                            <button
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                onClick={() => {
                                    setSearchQuery("")
                                }}
                            >
                                <X className="h-4 w-4"/>
                            </button>
                        )}
                    </div>
                </div>

                {/* 菜单内容 */}
                <div className="flex flex-1 overflow-hidden">
                    {/* 分组导航 - 只在非搜索模式显示 */}
                    {!isSearchMode && (
                        <div className="w-1/3 border-r overflow-y-auto p-4">
                            {currentGroupId === undefined ? (
                                <div className="space-y-2">
                                    {topLevelGroups.map((group) => (
                                        <button
                                            key={group.id}
                                            className="w-full text-left p-2 rounded hover:bg-gray-100 flex justify-between items-center"
                                            onClick={() => handleGroupSelect(group.id)}
                                        >
                                            <span>{group.name}</span>
                                            <ChevronRight className="h-4 w-4"/>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {renderBreadcrumbs()}
                                    <div className="mt-4 space-y-2">
                                        {loadingGroups
                                            ? Array.from({length: 3}).map((_, index) => <GroupSkeleton key={index}/>)
                                            : getChildGroups(currentGroupId).map((group) => (
                                                <button
                                                    key={group.id}
                                                    className="w-full text-left p-2 rounded hover:bg-gray-100 flex justify-between items-center"
                                                    onClick={() => handleGroupSelect(group.id)}
                                                >
                                                    <span>{group.name}</span>
                                                    <ChevronRight className="h-4 w-4"/>
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 工具列表 */}
                    <div className="flex-1 overflow-y-auto p-4" ref={toolsContainerRef}>
                        {isSearchMode ? (
                            // 搜索模式
                            <div>
                                <h3 className="text-lg font-medium mb-4">搜索结果: "{searchQuery}"</h3>
                                {searchLoading ? (
                                    // 搜索加载中
                                    <div className="space-y-3">
                                        {Array.from({length: 3}).map((_, index) => (
                                            <ToolSkeleton key={index}/>
                                        ))}
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    // 有搜索结果
                                    <div className="space-y-3">
                                        {searchResults.map((tool) => (
                                            <div
                                                key={tool.id}
                                                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                                onClick={() => handleToolSelect(tool)}
                                            >
                                                <div className="font-medium">{tool.name}</div>
                                                <div className="text-sm text-gray-600">{tool.description}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    分组: {allGroups.find((g) => g.id === tool.group_id)?.name || tool.group_id}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    // 无搜索结果
                                    <div className="text-center py-8 text-gray-500">没有找到匹配的工具</div>
                                )}
                            </div>
                        ) : (
                            // 分组模式
                            <div>
                                <h3 className="text-lg font-medium mb-4">
                                    {currentGroupId
                                        ? allGroups.find((g) => g.id === currentGroupId)?.name || ''
                                        : '未分组'} 工具
                                </h3>
                                {loadingTools ? (
                                    // 工具加载中
                                    <div className="space-y-3">
                                        {Array.from({length: 5}).map((_, index) => (
                                            <ToolSkeleton key={index}/>
                                        ))}
                                    </div>
                                ) : tools.length > 0 ? (
                                    // 有工具
                                    <div className="space-y-3">
                                        {tools.map((tool) => (
                                            <div
                                                key={tool.id}
                                                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                                onClick={() => handleToolSelect(tool)}
                                            >
                                                <div className="font-medium">{tool.name}</div>
                                                <div className="text-sm text-gray-600">{tool.description}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    // 无工具
                                    <div className="text-center py-8 text-gray-500">该分组下没有工具</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
