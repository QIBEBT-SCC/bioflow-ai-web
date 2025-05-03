import {Button} from "@/components/ui/button.tsx"
import {Input} from "@/components/ui/input.tsx"
import {Badge} from "@/components/ui/badge.tsx"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu.tsx"
import {
    Search,
    Plus,
    Star,
    Clock,
    PlayCircle,
    MoreHorizontal,
    Edit,
    Trash2,
    Copy,
    Filter,
    ChevronUp,
} from "lucide-react"
import {Link} from "react-router-dom";
import {SidebarInset, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage} from "@/components/ui/breadcrumb.tsx";
import {TagList} from "@/components/project/tag-list.tsx";

export function ProjectsPage() {
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
                                    Projects
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="container px-4 mx-auto py-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* 侧边栏 - 标签筛选 */}
                    <TagList/>

                    {/* 主内容区 */}
                    <main className="flex-1 space-y-6">
                        {/* 顶部操作栏 */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                            <h1 className="text-2xl font-bold">项目</h1>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:flex-initial">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                                    <Input type="search" placeholder="搜索项目..." className="pl-8 w-full sm:w-[250px]"/>
                                </div>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2"/>
                                    新项目
                                </Button>
                            </div>
                        </div>

                        {/* 筛选选项和项目列表 */}
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                <Tabs defaultValue="all" className="w-full">
                                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center w-full">
                                        <TabsList>
                                            <TabsTrigger value="all">全部项目</TabsTrigger>
                                            <TabsTrigger value="starred">已收藏</TabsTrigger>
                                            <TabsTrigger value="recent">最近使用</TabsTrigger>
                                        </TabsList>

                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm">
                                                <Filter className="h-4 w-4 mr-2"/>
                                                筛选
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        最近更新
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="24"
                                                            height="24"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="ml-2 h-4 w-4"
                                                        >
                                                            <path d="m6 9 6 6 6-6"/>
                                                        </svg>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>最近更新</DropdownMenuItem>
                                                    <DropdownMenuItem>名称 (A-Z)</DropdownMenuItem>
                                                    <DropdownMenuItem>名称 (Z-A)</DropdownMenuItem>
                                                    <DropdownMenuItem>最多运行</DropdownMenuItem>
                                                    <DropdownMenuItem>最少运行</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* 项目列表 - 全部 */}
                                    <TabsContent value="all" className="mt-6">
                                        <div className="rounded-md border">
                                            <div className="relative w-full overflow-auto">
                                                <table className="w-full caption-bottom text-sm">
                                                    <thead className="bg-muted/50">
                                                    <tr className="border-b">
                                                        <th className="h-12 px-4 text-left align-middle font-medium">
                                                            <div className="flex items-center space-x-1">
                                                                <span>项目名称</span>
                                                                <ChevronUp className="h-4 w-4"/>
                                                            </div>
                                                        </th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium hidden md:table-cell">描述</th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium hidden lg:table-cell">标签</th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium">更新时间</th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium">运行次数</th>
                                                        <th className="h-12 px-4 text-right align-middle font-medium">操作</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {/* 创建新项目行 */}
                                                    <tr className="border-b bg-muted/30">
                                                        <td colSpan={6} className="p-4">
                                                            <div className="flex items-center justify-center py-2">
                                                                <Button>
                                                                    <Plus className="h-4 w-4 mr-2"/>
                                                                    创建新项目
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* 项目列表行 */}
                                                    {projects.map((project) => (
                                                        <tr key={project.id} className="border-b hover:bg-muted/50 transition-colors">
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className={project.starred ? "text-amber-400" : "text-muted-foreground"}
                                                                    >
                                                                        <Star className="h-4 w-4"/>
                                                                        <span className="sr-only">收藏</span>
                                                                    </Button>
                                                                    <Link to={`/projects/${project.id}`}
                                                                          className="font-medium hover:underline">
                                                                        {project.name}
                                                                    </Link>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-muted-foreground hidden md:table-cell">
                                                                <div className="line-clamp-1">{project.description}</div>
                                                            </td>
                                                            <td className="p-4 hidden lg:table-cell">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {project.tags.map((tag) => (
                                                                        <Badge
                                                                            key={tag.id}
                                                                            className={`bg-${tag.color}-100 text-${tag.color}-800 hover:bg-${tag.color}-200 border-0`}
                                                                        >
                                                                            {tag.name}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-muted-foreground">
                                                                <div className="flex items-center">
                                                                    <Clock className="h-3 w-3 mr-1"/>
                                                                    {project.lastUpdated}
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-muted-foreground">
                                                                <div className="flex items-center">
                                                                    <PlayCircle className="h-3 w-3 mr-1"/>
                                                                    {project.runs}
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
                                                                            编辑项目
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem>
                                                                            <Copy className="h-4 w-4 mr-2"/>
                                                                            复制项目
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem className="text-destructive">
                                                                            <Trash2 className="h-4 w-4 mr-2"/>
                                                                            删除项目
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* 项目列表 - 已收藏 */}
                                    <TabsContent value="starred" className="mt-6">
                                        <div className="rounded-md border">
                                            <div className="relative w-full overflow-auto">
                                                <table className="w-full caption-bottom text-sm">
                                                    <thead className="bg-muted/50">
                                                    <tr className="border-b">
                                                        <th className="h-12 px-4 text-left align-middle font-medium">
                                                            <div className="flex items-center space-x-1">
                                                                <span>项目名称</span>
                                                                <ChevronUp className="h-4 w-4"/>
                                                            </div>
                                                        </th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium hidden md:table-cell">描述</th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium hidden lg:table-cell">标签</th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium">更新时间</th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium">运行次数</th>
                                                        <th className="h-12 px-4 text-right align-middle font-medium">操作</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {projects
                                                        .filter((project) => project.starred)
                                                        .map((project) => (
                                                            <tr key={project.id} className="border-b hover:bg-muted/50 transition-colors">
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <Button variant="ghost" size="icon" className="text-amber-400">
                                                                            <Star className="h-4 w-4"/>
                                                                            <span className="sr-only">收藏</span>
                                                                        </Button>
                                                                        <Link to={`/projects/${project.id}`}
                                                                              className="font-medium hover:underline">
                                                                            {project.name}
                                                                        </Link>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-muted-foreground hidden md:table-cell">
                                                                    <div className="line-clamp-1">{project.description}</div>
                                                                </td>
                                                                <td className="p-4 hidden lg:table-cell">
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {project.tags.map((tag) => (
                                                                            <Badge
                                                                                key={tag.id}
                                                                                className={`bg-${tag.color}-100 text-${tag.color}-800 hover:bg-${tag.color}-200 border-0`}
                                                                            >
                                                                                {tag.name}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-muted-foreground">
                                                                    <div className="flex items-center">
                                                                        <Clock className="h-3 w-3 mr-1"/>
                                                                        {project.lastUpdated}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-muted-foreground">
                                                                    <div className="flex items-center">
                                                                        <PlayCircle className="h-3 w-3 mr-1"/>
                                                                        {project.runs}
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
                                                                                编辑项目
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem>
                                                                                <Copy className="h-4 w-4 mr-2"/>
                                                                                复制项目
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem className="text-destructive">
                                                                                <Trash2 className="h-4 w-4 mr-2"/>
                                                                                删除项目
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* 项目列表 - 最近使用 */}
                                    <TabsContent value="recent" className="mt-6">
                                        <div className="rounded-md border">
                                            <div className="relative w-full overflow-auto">
                                                <table className="w-full caption-bottom text-sm">
                                                    <thead className="bg-muted/50">
                                                    <tr className="border-b">
                                                        <th className="h-12 px-4 text-left align-middle font-medium">
                                                            <div className="flex items-center space-x-1">
                                                                <span>项目名称</span>
                                                                <ChevronUp className="h-4 w-4"/>
                                                            </div>
                                                        </th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium hidden md:table-cell">描述</th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium hidden lg:table-cell">标签</th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium">更新时间</th>
                                                        <th className="h-12 px-4 text-left align-middle font-medium">运行次数</th>
                                                        <th className="h-12 px-4 text-right align-middle font-medium">操作</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {projects
                                                        .filter((project) => project.recentlyUsed)
                                                        .map((project) => (
                                                            <tr key={project.id} className="border-b hover:bg-muted/50 transition-colors">
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className={project.starred ? "text-amber-400" : "text-muted-foreground"}
                                                                        >
                                                                            <Star className="h-4 w-4"/>
                                                                            <span className="sr-only">收藏</span>
                                                                        </Button>
                                                                        <Link to={`/projects/${project.id}`}
                                                                              className="font-medium hover:underline">
                                                                            {project.name}
                                                                        </Link>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-muted-foreground hidden md:table-cell">
                                                                    <div className="line-clamp-1">{project.description}</div>
                                                                </td>
                                                                <td className="p-4 hidden lg:table-cell">
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {project.tags.map((tag) => (
                                                                            <Badge
                                                                                key={tag.id}
                                                                                className={`bg-${tag.color}-100 text-${tag.color}-800 hover:bg-${tag.color}-200 border-0`}
                                                                            >
                                                                                {tag.name}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-muted-foreground">
                                                                    <div className="flex items-center">
                                                                        <Clock className="h-3 w-3 mr-1"/>
                                                                        {project.lastUpdated}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-muted-foreground">
                                                                    <div className="flex items-center">
                                                                        <PlayCircle className="h-3 w-3 mr-1"/>
                                                                        {project.runs}
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
                                                                                编辑项目
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem>
                                                                                <Copy className="h-4 w-4 mr-2"/>
                                                                                复制项目
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem className="text-destructive">
                                                                                <Trash2 className="h-4 w-4 mr-2"/>
                                                                                删除项目
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </SidebarInset>
    )
}

// 模拟数据
const projects = [
    {
        id: "tensorflow-models",
        name: "tensorflow_models",
        description: "TensorFlow 模型集合，包含图像分类、目标检测和分割模型",
        lastUpdated: "1 天前",
        runs: 64,
        starred: true,
        recentlyUsed: true,
        tags: [
            {id: "ml", name: "海水样品", color: "red"},
            {id: "cv", name: "meta genome", color: "blue"},
        ],
    },
    {
        id: "nlp-transformers",
        name: "nlp_transformers",
        description: "基于 Transformer 架构的自然语言处理模型实现",
        lastUpdated: "3 天前",
        runs: 42,
        starred: true,
        recentlyUsed: true,
        tags: [
            {id: "ml", name: "海水样品", color: "red"},
            {id: "nlp", name: "自然语言处理", color: "green"},
        ],
    },
    {
        id: "reinforcement-learning",
        name: "reinforcement_learning",
        description: "强化学习算法实现，包括 DQN、PPO 和 A3C",
        lastUpdated: "1 周前",
        runs: 28,
        starred: false,
        recentlyUsed: true,
        tags: [
            {id: "ml", name: "海水样品", color: "red"},
            {id: "rl", name: "强化学习", color: "yellow"},
        ],
    },
    {
        id: "gan-models",
        name: "gan_models",
        description: "生成对抗网络模型集合，包括 DCGAN、StyleGAN 和 CycleGAN",
        lastUpdated: "2 周前",
        runs: 36,
        starred: false,
        recentlyUsed: false,
        tags: [
            {id: "ml", name: "海水样品", color: "red"},
            {id: "dl", name: "深度学习", color: "purple"},
        ],
    },
    {
        id: "object-detection",
        name: "object_detection",
        description: "目标检测模型实现，包括 YOLO、SSD 和 Faster R-CNN",
        lastUpdated: "3 周前",
        runs: 52,
        starred: false,
        recentlyUsed: false,
        tags: [
            {id: "ml", name: "海水样品", color: "red"},
            {id: "cv", name: "meta genome", color: "blue"},
        ],
    },
]
