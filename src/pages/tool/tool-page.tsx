"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Search,
    Plus,
    Clock,
    MoreHorizontal,
    Edit,
    Trash2,
    Copy,
    Download,
    FolderPlus,
    Tag,
    Grid,
    List,
    Filter,
    ChevronRight,
    ChevronDown,
    FolderOpen,
    Folder,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {Link} from "react-router-dom";
import {ToolList} from "@/components/tool/tool-list.tsx";

// 分组类型定义
interface ToolGroup {
    id: string
    name: string
    description?: string
    parentId?: string | null
    children?: ToolGroup[]
}

// 标签类型定义
interface ToolTag {
    id: string
    name: string
}

// 工具类型定义
interface Tool {
    id: string
    name: string
    repository: string
    tag: string
    description: string
    addedAt: string
    groupIds: string[] // 工具所属的分组ID列表
    tags: ToolTag[]
}

export function ToolsPage() {
    const [viewMode, setViewMode] = useState<"list" | "grid">("list")
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

    // 切换分组展开/折叠状态
    const toggleGroupExpanded = (groupId: string) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [groupId]: !prev[groupId],
        }))
    }

    // 检查分组是否展开
    const isGroupExpanded = (groupId: string) => {
        return expandedGroups[groupId] || false
    }

    // 构建分组树
    const buildGroupTree = (groups: ToolGroup[]): ToolGroup[] => {
        const groupMap: Record<string, ToolGroup> = {}
        const rootGroups: ToolGroup[] = []

        // 首先创建所有分组的映射
        groups.forEach((group) => {
            groupMap[group.id] = { ...group, children: [] }
        })

        // 然后构建树结构
        groups.forEach((group) => {
            if (!group.parentId) {
                rootGroups.push(groupMap[group.id])
            } else if (groupMap[group.parentId]) {
                if (!groupMap[group.parentId].children) {
                    groupMap[group.parentId].children = []
                }
                groupMap[group.parentId].children!.push(groupMap[group.id])
            }
        })

        return rootGroups
    }

    // 获取分组及其所有子分组的ID
    const getGroupAndChildrenIds = (groupId: string): string[] => {
        const result: string[] = [groupId]
        const group = allGroups.find((g) => g.id === groupId)

        if (group) {
            const childGroups = allGroups.filter((g) => g.parentId === groupId)
            childGroups.forEach((childGroup) => {
                result.push(...getGroupAndChildrenIds(childGroup.id))
            })
        }

        return result
    }

    // 过滤工具
    const filteredTools = tools.filter((tool) => {
        // 搜索过滤
        const matchesSearch =
            searchQuery === "" ||
            tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchQuery.toLowerCase())

        // 分组过滤
        let matchesGroup = true
        if (selectedGroupId) {
            const groupIds = getGroupAndChildrenIds(selectedGroupId)
            matchesGroup = tool.groupIds.some((id) => groupIds.includes(id))
        }

        return matchesSearch && matchesGroup
    })

    // 构建分组树
    const groupTree = buildGroupTree(allGroups)

    // 递归渲染分组树
    const renderGroupTree = (groups: ToolGroup[], level = 0) => {
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
                                        <FolderOpen className="h-4 w-4 mr-2" />
                                    ) : (
                                        <Folder className="h-4 w-4 mr-2" />
                                    )}
                                    <span>{group.name}</span>
                                    <Badge className="ml-auto">
                                        {
                                            tools.filter((tool) => getGroupAndChildrenIds(group.id).some((id) => tool.groupIds.includes(id)))
                                                .length
                                        }
                                    </Badge>
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
                            <Folder className="h-4 w-4 mr-2" />
                            <span>{group.name}</span>
                            <Badge className="ml-auto">{tools.filter((tool) => tool.groupIds.includes(group.id)).length}</Badge>
                        </Button>
                    )}
                </div>
            </div>
        ))
    }

    // 获取当前选中分组的完整路径
    const getSelectedGroupPath = (groupId: string | null): string => {
        if (!groupId) return "所有工具"

        const path: string[] = []
        let currentId = groupId

        while (currentId) {
            const group = allGroups.find((g) => g.id === currentId)
            if (group) {
                path.unshift(group.name)
                currentId = group.parentId || ""
            } else {
                break
            }
        }

        return path.join(" > ")
    }

    // 按分组组织工具
    const organizeToolsByGroup = () => {
        const result: Record<string, Tool[]> = {}

        // 初始化所有分组
        allGroups.forEach((group) => {
            result[group.id] = []
        })

        // 将工具分配到各个分组
        filteredTools.forEach((tool) => {
            tool.groupIds.forEach((groupId) => {
                if (result[groupId]) {
                    result[groupId].push(tool)
                }
            })
        })

        return result
    }

    const toolsByGroup = organizeToolsByGroup()

    return (
        <div className="container mx-auto py-6">
            {/* 顶部操作栏 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                <h1 className="text-2xl font-bold">工具管理</h1>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="搜索工具..."
                            className="pl-8 w-full sm:w-[250px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                添加
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <Link to="/tool/add">
                                <DropdownMenuItem>
                                    <Plus className="h-4 w-4 mr-2" />
                                    添加工具
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem>
                                <FolderPlus className="h-4 w-4 mr-2" />
                                创建分组
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                导入工具
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* 侧边栏 - 分组筛选 */}
                <aside className="w-full md:w-64 shrink-0">
                    <Card className="py-0 gap-0">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-md font-medium">工具分组</h2>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <FolderPlus className="h-4 w-4" />
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
                                    <Badge className="ml-auto">{tools.length}</Badge>
                                </Button>

                                {renderGroupTree(groupTree)}
                            </div>

                            <div className="mt-6">
                                <h3 className="text-sm font-medium mb-2">常用标签</h3>
                                <div className="flex flex-wrap gap-1">
                                    {commonTags.map((tag) => (
                                        <Badge
                                            key={tag.id}
                                            variant="outline"
                                            className="bg-blue-50 text-blue-600 border-blue-200 cursor-pointer"
                                        >
                                            {tag.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </aside>

                {/* 主内容区 */}
                <main className="flex-1 space-y-6">
                    {/* 视图切换和筛选 */}
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-medium">
                            {getSelectedGroupPath(selectedGroupId)} ({filteredTools.length})
                        </h2>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <Filter className="h-4 w-4 mr-2" />
                                筛选
                            </Button>
                            <div className="border rounded-md flex">
                                <Button
                                    variant={viewMode === "list" ? "secondary" : "ghost"}
                                    size="sm"
                                    className="rounded-r-none"
                                    onClick={() => setViewMode("list")}
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                                    size="sm"
                                    className="rounded-l-none"
                                    onClick={() => setViewMode("grid")}
                                >
                                    <Grid className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* 工具列表 */}
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList>
                            <TabsTrigger value="all">全部工具</TabsTrigger>
                            <TabsTrigger value="grouped">按分组</TabsTrigger>
                        </TabsList>

                        {/* 全部工具 */}
                        <TabsContent value="all" className="mt-6">
                            {/*{renderToolList(filteredTools)}*/}
                            <ToolList viewMode={viewMode}/>
                        </TabsContent>

                        {/* 按分组显示 */}
                        <TabsContent value="grouped" className="mt-6 space-y-6">
                            {selectedGroupId ? (
                                // 显示选中分组的工具
                                <div>
                                    <Collapsible defaultOpen={true} className="border rounded-md overflow-hidden">
                                        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center">
                                                <h3 className="font-medium">{allGroups.find((g) => g.id === selectedGroupId)?.name || ""}</h3>
                                                <Badge className="ml-2">{toolsByGroup[selectedGroupId]?.length || 0}</Badge>
                                            </div>
                                            <ChevronRight className="h-4 w-4 transition-transform ui-open:rotate-90" />
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>{renderToolList(toolsByGroup[selectedGroupId] || [])}</CollapsibleContent>
                                    </Collapsible>

                                    {/* 子分组的工具 */}
                                    {allGroups
                                        .filter((group) => group.parentId === selectedGroupId)
                                        .map((subGroup) => (
                                            <Collapsible key={subGroup.id} defaultOpen={true} className="border rounded-md overflow-hidden">
                                                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-center">
                                                        <h3 className="font-medium">{subGroup.name}</h3>
                                                        <Badge className="ml-2">{toolsByGroup[subGroup.id]?.length || 0}</Badge>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 transition-transform ui-open:rotate-90" />
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>{renderToolList(toolsByGroup[subGroup.id] || [])}</CollapsibleContent>
                                            </Collapsible>
                                        ))}
                                </div>
                            ) : (
                                // 显示所有顶级分组
                                allGroups
                                    .filter((group) => !group.parentId)
                                    .map((group) => {
                                        const groupTools = toolsByGroup[group.id] || []
                                        if (groupTools.length === 0) return null

                                        return (
                                            <Collapsible key={group.id} defaultOpen={true} className="border rounded-md overflow-hidden">
                                                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-center">
                                                        <h3 className="font-medium">{group.name}</h3>
                                                        <Badge className="ml-2">{groupTools.length}</Badge>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 transition-transform ui-open:rotate-90" />
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>{renderToolList(groupTools)}</CollapsibleContent>
                                            </Collapsible>
                                        )
                                    })
                            )}
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div>
    )

    // 渲染工具列表（列表或网格视图）
    function renderToolList(toolList: Tool[]) {
        if (toolList.length === 0) {
            return <div className="text-center py-8 text-muted-foreground">没有找到匹配的工具</div>
        }

        return viewMode === "list" ? (
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                    <thead className="bg-muted/50">
                    <tr className="border-b">
                        <th className="h-12 px-4 text-left align-middle font-medium">工具名称</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Docker 镜像</th>
                        <th className="h-12 px-4 text-left align-middle font-medium hidden md:table-cell">描述</th>
                        <th className="h-12 px-4 text-left align-middle font-medium hidden lg:table-cell">分组</th>
                        <th className="h-12 px-4 text-left align-middle font-medium hidden lg:table-cell">标签</th>
                        <th className="h-12 px-4 text-right align-middle font-medium">操作</th>
                    </tr>
                    </thead>
                    <tbody>
                    {toolList.map((tool) => (
                        <tr key={tool.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="p-4 font-medium">
                                <Link to={`/tools/${tool.id}`} className="hover:underline">
                                    {tool.name}
                                </Link>
                            </td>
                            <td className="p-4 text-muted-foreground">
                                {tool.repository}:{tool.tag}
                            </td>
                            <td className="p-4 text-muted-foreground hidden md:table-cell">
                                <div className="line-clamp-1">{tool.description || "无描述"}</div>
                            </td>
                            <td className="p-4 hidden lg:table-cell">
                                <div className="flex flex-wrap gap-1">
                                    {tool.groupIds.slice(0, 2).map((groupId) => {
                                        const group = allGroups.find((g) => g.id === groupId)
                                        if (!group) return null
                                        return (
                                            <Badge key={groupId} variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                                {group.name}
                                            </Badge>
                                        )
                                    })}
                                    {tool.groupIds.length > 2 && <Badge variant="outline">+{tool.groupIds.length - 2}</Badge>}
                                </div>
                            </td>
                            <td className="p-4 hidden lg:table-cell">
                                <div className="flex flex-wrap gap-1">
                                    {tool.tags.slice(0, 2).map((tag) => (
                                        <Badge key={tag.id} variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                            {tag.name}
                                        </Badge>
                                    ))}
                                    {tool.tags.length > 2 && <Badge variant="outline">+{tool.tags.length - 2}</Badge>}
                                </div>
                            </td>
                            <td className="p-4 text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">更多选项</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <Edit className="h-4 w-4 mr-2" />
                                            编辑工具
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Copy className="h-4 w-4 mr-2" />
                                            复制工具
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Tag className="h-4 w-4 mr-2" />
                                            管理分组
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            删除工具
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {toolList.map((tool) => (
                    <Card key={tool.id}>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <Link to={`/tools/${tool.id}`} className="font-medium hover:underline">
                                    {tool.name}
                                </Link>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <Edit className="h-4 w-4 mr-2" />
                                            编辑工具
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Copy className="h-4 w-4 mr-2" />
                                            复制工具
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Tag className="h-4 w-4 mr-2" />
                                            管理分组
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            删除工具
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{tool.description || "无描述"}</p>
                            <div className="flex flex-wrap gap-1 mb-3">
                                {tool.groupIds.slice(0, 2).map((groupId) => {
                                    const group = allGroups.find((g) => g.id === groupId)
                                    if (!group) return null
                                    return (
                                        <Badge key={groupId} variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                            {group.name}
                                        </Badge>
                                    )
                                })}
                                {tool.groupIds.length > 2 && <Badge variant="outline">+{tool.groupIds.length - 2}</Badge>}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {tool.repository}:{tool.tag}
                </span>
                                <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {tool.addedAt}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-3">
                                {tool.tags.slice(0, 3).map((tag) => (
                                    <Badge key={tag.id} variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                        {tag.name}
                                    </Badge>
                                ))}
                                {tool.tags.length > 3 && <Badge variant="outline">+{tool.tags.length - 3}</Badge>}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }
}

// 模拟数据 - 工具分组（支持多级结构）
const allGroups: ToolGroup[] = [
    // 顶级分组
    { id: "qc", name: "质控", description: "用于数据质量控制的工具" },
    { id: "align", name: "比对", description: "用于序列比对的工具" },
    { id: "assembly", name: "组装", description: "用于基因组组装的工具" },
    { id: "variant", name: "变异检测", description: "用于变异检测的工具" },
    { id: "anno", name: "注释", description: "用于基因组注释的工具" },

    // 子分组
    { id: "samtools", name: "SAMtools", description: "SAM/BAM处理工具集", parentId: "align" },
    { id: "bwa", name: "BWA", description: "Burrows-Wheeler Aligner工具集", parentId: "align" },
    { id: "fastqc", name: "FastQC", description: "FastQC工具集", parentId: "qc" },
    { id: "spades", name: "SPAdes", description: "SPAdes组装工具集", parentId: "assembly" },

    // 三级分组
    { id: "samtools_view", name: "SAMtools View", description: "SAM/BAM查看工具", parentId: "samtools" },
    { id: "samtools_sort", name: "SAMtools Sort", description: "SAM/BAM排序工具", parentId: "samtools" },
]

// 模拟数据 - 常用标签
const commonTags = [
    { id: "ngs", name: "NGS" },
    { id: "rna", name: "RNA-Seq" },
    { id: "dna", name: "DNA-Seq" },
    { id: "qc", name: "质控" },
    { id: "assembly", name: "组装" },
]

// 模拟数据 - 工具列表
const tools: Tool[] = [
    {
        id: "fastp",
        name: "fastp",
        repository: "staphb/fastp",
        tag: "0.24.0",
        description: "一个用于FASTQ数据的快速全功能预处理工具",
        addedAt: "2023-04-15",
        groupIds: ["qc"],
        tags: [
            { id: "ngs", name: "NGS" },
            { id: "qc", name: "质控" },
            { id: "preproc", name: "预处理" },
        ],
    },
    {
        id: "bwa_mem",
        name: "BWA-MEM",
        repository: "biocontainers/bwa",
        tag: "0.7.17",
        description: "用于将DNA序列比对到大型参考基因组的软件包",
        addedAt: "2023-04-20",
        groupIds: ["align", "bwa"],
        tags: [
            { id: "align", name: "比对" },
            { id: "genome", name: "基因组" },
            { id: "dna", name: "DNA-Seq" },
        ],
    },
    {
        id: "samtools_view_cmd",
        name: "samtools view",
        repository: "biocontainers/samtools",
        tag: "1.15.1",
        description: "用于查看SAM/BAM/CRAM文件的工具",
        addedAt: "2023-04-22",
        groupIds: ["align", "samtools", "samtools_view"],
        tags: [
            { id: "sam", name: "SAM/BAM" },
            { id: "process", name: "处理" },
        ],
    },
    {
        id: "samtools_sort_cmd",
        name: "samtools sort",
        repository: "biocontainers/samtools",
        tag: "1.15.1",
        description: "用于排序SAM/BAM/CRAM文件的工具",
        addedAt: "2023-04-23",
        groupIds: ["align", "samtools", "samtools_sort"],
        tags: [
            { id: "sam", name: "SAM/BAM" },
            { id: "process", name: "处理" },
        ],
    },
    {
        id: "gatk",
        name: "GATK",
        repository: "broadinstitute/gatk",
        tag: "4.3.0.0",
        description: "Genome Analysis Toolkit - 用于变异发现的工具集",
        addedAt: "2023-05-01",
        groupIds: ["variant"],
        tags: [
            { id: "variant", name: "变异检测" },
            { id: "genome", name: "基因组" },
            { id: "dna", name: "DNA-Seq" },
        ],
    },
    {
        id: "blast",
        name: "BLAST",
        repository: "ncbi/blast",
        tag: "2.13.0",
        description: "Basic Local Alignment Search Tool - 用于比对生物序列的工具",
        addedAt: "2023-05-10",
        groupIds: ["align"],
        tags: [
            { id: "align", name: "比对" },
            { id: "search", name: "序列搜索" },
        ],
    },
    {
        id: "hisat2",
        name: "HISAT2",
        repository: "biocontainers/hisat2",
        tag: "2.2.1",
        description: "快速且敏感的RNA-seq比对工具",
        addedAt: "2023-05-15",
        groupIds: ["align"],
        tags: [
            { id: "align", name: "比对" },
            { id: "rna", name: "RNA-Seq" },
        ],
    },
    {
        id: "star",
        name: "STAR",
        repository: "quay.io/biocontainers/star",
        tag: "2.7.10a",
        description: "超快速的通用RNA-seq比对器",
        addedAt: "2023-05-20",
        groupIds: ["align"],
        tags: [
            { id: "align", name: "比对" },
            { id: "rna", name: "RNA-Seq" },
        ],
    },
    {
        id: "fastqc",
        name: "FastQC",
        repository: "quay.io/biocontainers/fastqc",
        tag: "0.11.9",
        description: "一个高通量序列数据的质量控制工具",
        addedAt: "2023-05-25",
        groupIds: ["qc", "fastqc"],
        tags: [
            { id: "qc", name: "质控" },
            { id: "ngs", name: "NGS" },
        ],
    },
    {
        id: "spades",
        name: "SPAdes",
        repository: "quay.io/biocontainers/spades",
        tag: "3.15.5",
        description: "用于单细胞和标准组装的基因组组装器",
        addedAt: "2023-06-01",
        groupIds: ["assembly", "spades"],
        tags: [
            { id: "assembly", name: "组装" },
            { id: "genome", name: "基因组" },
        ],
    },
]
