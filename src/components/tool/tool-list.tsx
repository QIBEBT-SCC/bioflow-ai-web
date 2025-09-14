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
import {useAllTools, useToolCount} from "@/hooks/use-tool.tsx";
import {Table, TableBody, TableCell, TableHead, TableHeader, TablePage, TableRow} from "@/components/ui/table.tsx";
import {useState} from "react";
import {useTranslation} from "react-i18next";

// 根据标签名称获取对应的样式
function getTagStyle(tagName: string) {
    switch (tagName) {
        case "Default":
            return "bg-green-50 text-green-600 border-green-200";
        case "AI Unchecked":
            return "bg-yellow-50 text-yellow-600 border-yellow-200";
        default:
            return "bg-blue-50 text-blue-600 border-blue-200";
    }
}

export function ToolList({viewMode}: { viewMode: "list" | "grid" }) {
    const {t} = useTranslation();
    const [recentOffset, setRecentOffset] = useState<number>(0)
    const {data: allTools = []} = useAllTools(recentOffset);
    const {data: toolCounts = 0} = useToolCount();

    return viewMode === "list" ? (
        <div>
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="h-12 px-4 text-left w-30">{t('tool.tool_name')}</TableHead>
                        <TableHead className="h-12 px-4 text-left w-60">{t('tool.docker_image')}</TableHead>
                        <TableHead className="h-12 px-4 text-left w-85">{t('tool.description')}</TableHead>
                        <TableHead className="h-12 px-4 text-left w-30">{t('tool.tags')}</TableHead>
                        <TableHead className="h-12 px-4 text-center w-5">{t('tool.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allTools.map((tool) => (
                        <TableRow key={tool.uid}>
                            <TableCell className="font-medium max-w-30">
                                <Link to={`/tool/${tool.uid}`} className="hover:underline">
                                    <div className="truncate">{tool.name}</div>
                                </Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-60">
                                <div className="truncate">
                                    {tool.image.image.registry}/{tool.image.image.namespace}/{tool.image.image.repository}:{tool.image.image.tag}
                                </div>
                            </TableCell>
                            <TableCell className="max-w-85">
                                <div className="line-clamp-2 text-sm truncate">{tool.description || t('tool.no_description')}</div>
                            </TableCell>
                            <TableCell className="max-w-30">
                                <div className="flex flex-row flex-wrap gap-1">
                                    {tool.tags.slice(0, 2).map((tag) => (
                                        <Badge key={tag.id} variant="outline" className={`${getTagStyle(tag.name)} text-xs`}>
                                            {tag.name}
                                        </Badge>
                                    ))}
                                    {tool.tags.length > 2 && <Badge variant="outline" className="text-xs">+{tool.tags.length - 2}</Badge>}
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4"/>
                                            <span className="sr-only">{t('tool.more_options')}</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <Edit className="h-4 w-4 mr-2"/>
                                            {t('tool.edit')} {t('tool.tool_name')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Copy className="h-4 w-4 mr-2"/>
                                            {t('tool.copy')} {t('tool.tool_name')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Tag className="h-4 w-4 mr-2"/>
                                            {t('tool.manage_group')}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator/>
                                        <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="h-4 w-4 mr-2"/>
                                            {t('tool.delete')} {t('tool.tool_name')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <TablePage
                totalItems={toolCounts}
                offset={recentOffset}
                pageSize={10}
                setOffset={setRecentOffset}
            />
        </div>
    ) : (
        <div>
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
                                            {t('tool.edit')} {t('tool.tool_name')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Copy className="h-4 w-4 mr-2"/>
                                            {t('tool.copy')} {t('tool.tool_name')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Tag className="h-4 w-4 mr-2"/>
                                            {t('tool.manage_group')}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator/>
                                        <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="h-4 w-4 mr-2"/>
                                            {t('tool.delete')} {t('tool.tool_name')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{tool.description || t('tool.no_description')}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                                {tool.image.image.registry}/{tool.image.image.namespace}/{tool.image.image.repository}:{tool.image.image.tag}
                            </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-3">
                                {tool.tags.slice(0, 3).map((tag) => (
                                    <Badge key={tag.id} variant="outline" className={getTagStyle(tag.name)}>
                                        {tag.name}
                                    </Badge>
                                ))}
                                {tool.tags.length > 3 && <Badge variant="outline">+{tool.tags.length - 3}</Badge>}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <TablePage
                totalItems={toolCounts}
                offset={recentOffset}
                pageSize={12}
                setOffset={setRecentOffset}
            />
        </div>
    )
}