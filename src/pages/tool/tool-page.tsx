"use client"

import {useState} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {
    Search,
    Plus,
    Download,
    FolderPlus,
    Grid,
    List,
    Filter,
    ChevronDown,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {Link} from "react-router-dom";
import {ToolList} from "@/components/tool/tool-list.tsx";
import {SidebarInset, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage} from "@/components/ui/breadcrumb.tsx";
import {ToolGroupSidebar} from "@/components/tool/tool-group-sidebar.tsx";
import {useTranslation} from "react-i18next";

export function ToolsPage() {
    const {t} = useTranslation();
    const [viewMode, setViewMode] = useState<"list" | "grid">("list")
    const [searchQuery, setSearchQuery] = useState("")


    return (
        <SidebarInset>
            <header
                className="flex flex-col shrink-0 border-b">
                <div className="flex items-center gap-2 px-4 h-12 bg-background">
                    <SidebarTrigger className="-ml-1"/>
                    <Separator orientation="vertical" className="!mr-2 !h-4"/>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbPage>
                                    {t('tool.tools')}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto py-6">
                    {/* 顶部操作栏 */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                        <h1 className="text-2xl font-bold">{t('tool.title')}</h1>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-initial">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                                <Input
                                    type="search"
                                    placeholder={t('tool.search_placeholder')}
                                    className="pl-8 w-full sm:w-[250px]"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <Plus className="h-4 w-4 mr-2"/>
                                        {t('tool.add')}
                                        <ChevronDown className="h-4 w-4 ml-2"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <Link to="/tool/add">
                                        <DropdownMenuItem>
                                            <Plus className="h-4 w-4 mr-2"/>
                                            {t('tool.add')} {t('tool.tool_name')}
                                        </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuItem>
                                        <FolderPlus className="h-4 w-4 mr-2"/>
                                        {t('tool.create_group')}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator/>
                                    <DropdownMenuItem>
                                        <Download className="h-4 w-4 mr-2"/>
                                        {t('tool.import_tool')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* 侧边栏 - 分组筛选 */}
                        <ToolGroupSidebar/>

                        {/* 主内容区 */}
                        <main className="flex-1 space-y-6">
                            {/* 视图切换和筛选 */}
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-medium">
                                    {t('tool.all_tools')}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm">
                                        <Filter className="h-4 w-4 mr-2"/>
                                        {t('tool.filter')}
                                    </Button>
                                    <div className="border rounded-md flex">
                                        <Button
                                            variant={viewMode === "list" ? "secondary" : "ghost"}
                                            size="sm"
                                            className="rounded-r-none"
                                            onClick={() => setViewMode("list")}
                                        >
                                            <List className="h-4 w-4"/>
                                        </Button>
                                        <Button
                                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                                            size="sm"
                                            className="rounded-l-none"
                                            onClick={() => setViewMode("grid")}
                                        >
                                            <Grid className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* 工具列表 */}
                            <ToolList viewMode={viewMode}/>
                        </main>
                    </div>
                </div>
            </div>
        </SidebarInset>
    )
}
