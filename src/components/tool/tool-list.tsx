import {Link} from "react-router-dom";
import {Badge} from "@/components/ui/badge.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Copy, Edit, MoreHorizontal, Tag, Trash2} from "lucide-react";
import {Card, CardContent} from "@/components/ui/card.tsx";
import {useAllTools} from "@/hooks/useTool.tsx";

export function ToolList({viewMode}: { viewMode: "list" | "grid" }) {
    const {data: allTools = [], isLoading, error} = useAllTools();

    return viewMode === "list" ? (
        <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
                <thead className="bg-muted/50">
                <tr className="border-b">
                    <th className="h-12 px-4 text-left align-middle font-medium">工具名称</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Docker 镜像</th>
                    <th className="h-12 px-4 text-left align-middle font-medium hidden md:table-cell">描述</th>
                    <th className="h-12 px-4 text-left align-middle font-medium hidden lg:table-cell">标签</th>
                    <th className="h-12 px-4 text-right align-middle font-medium">操作</th>
                </tr>
                </thead>
                <tbody>
                {allTools.map((tool) => (
                    <tr key={tool.uid} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4 font-medium">
                            <Link to={`/tool/${tool.uid}`} className="hover:underline">
                                {tool.name}
                            </Link>
                        </td>
                        <td className="p-4 text-muted-foreground">
                            {tool.docker_image}
                        </td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">
                            <div className="line-clamp-1">{tool.description || "无描述"}</div>
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
                                        <MoreHorizontal className="h-4 w-4"/>
                                        <span className="sr-only">更多选项</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                        <Edit className="h-4 w-4 mr-2"/>
                                        编辑工具
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Copy className="h-4 w-4 mr-2"/>
                                        复制工具
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Tag className="h-4 w-4 mr-2"/>
                                        管理分组
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator/>
                                    <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2"/>
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
            {allTools.map((tool) => (
                <Card key={tool.uid} className="py-0 gap-0">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <Link to={`/tool/${tool.uid}`} className="font-medium hover:underline">
                                {tool.name}
                            </Link>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                        <Edit className="h-4 w-4 mr-2"/>
                                        编辑工具
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Copy className="h-4 w-4 mr-2"/>
                                        复制工具
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Tag className="h-4 w-4 mr-2"/>
                                        管理分组
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator/>
                                    <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2"/>
                                        删除工具
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{tool.description || "无描述"}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{tool.docker_image}</span>
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