import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Badge} from "@/components/ui/badge"
import {Progress} from "@/components/ui/progress"
import {
    ArrowLeft,
    Star,
    Clock,
    Settings,
    FileText,
    Play,
    Download,
    Share2,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Database,
    FlaskConical,
    FileBarChart,
    Plus,
    Filter,
    MoreHorizontal,
} from "lucide-react"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu"
import {Link, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {Project} from "@/types/project.tsx";
import {projectApi} from "@/services/api.tsx";
import {colorClassMap} from "@/types/color.tsx";
import {SidebarInset, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";

export function ProjectDetailPage() {
    const {projectId} = useParams();
    const [project, setProject] = useState<Project>()

    useEffect(() => {
        if (projectId) {
            projectApi.getProject(projectId)
                .then(setProject)
                .catch(() => {/* 错误处理可扩展 */
                });
        }
    }, [projectId]);


    // 在实际应用中，这里会根据 params.id 从数据库获取项目信息
    const tempProject = {
        id: projectId,
        name: "tensorflow_models",
        description: "TensorFlow 模型集合，包含图像分类、目标检测和分割模型",
        lastUpdated: "1 天前",
        totalWorkflows: 8,
        completedWorkflows: 5,
        inProgressWorkflows: 2,
        failedWorkflows: 1,
        sampleCount: 1250,
        starred: true,
        tags: [
            {id: "ml", name: "机器学习", color: "red"},
            {id: "cv", name: "计算机视觉", color: "blue"},
        ],
        workflows: [
            {
                id: "wf1",
                name: "图像分类训练",
                status: "completed",
                progress: 100,
                startTime: "2023-05-01 09:30",
                endTime: "2023-05-01 14:45",
                duration: "5 小时 15 分钟",
                samples: 450,
                accuracy: "94.2%",
            },
            {
                id: "wf2",
                name: "目标检测评估",
                status: "completed",
                progress: 100,
                startTime: "2023-05-02 10:15",
                endTime: "2023-05-02 12:30",
                duration: "2 小时 15 分钟",
                samples: 200,
                accuracy: "88.7%",
            },
            {
                id: "wf3",
                name: "模型优化",
                status: "in_progress",
                progress: 65,
                startTime: "2023-05-03 14:00",
                endTime: null,
                duration: "进行中",
                samples: 300,
                accuracy: "进行中",
            },
            {
                id: "wf4",
                name: "数据增强测试",
                status: "failed",
                progress: 32,
                startTime: "2023-05-04 08:45",
                endTime: "2023-05-04 09:20",
                duration: "35 分钟 (失败)",
                samples: 150,
                accuracy: "失败",
            },
            {
                id: "wf5",
                name: "迁移学习实验",
                status: "completed",
                progress: 100,
                startTime: "2023-05-05 11:30",
                endTime: "2023-05-05 16:45",
                duration: "5 小时 15 分钟",
                samples: 250,
                accuracy: "91.5%",
            },
            {
                id: "wf6",
                name: "特征提取",
                status: "completed",
                progress: 100,
                startTime: "2023-05-06 09:00",
                endTime: "2023-05-06 11:30",
                duration: "2 小时 30 分钟",
                samples: 300,
                accuracy: "93.8%",
            },
            {
                id: "wf7",
                name: "模型部署测试",
                status: "completed",
                progress: 100,
                startTime: "2023-05-07 13:15",
                endTime: "2023-05-07 15:00",
                duration: "1 小时 45 分钟",
                samples: 100,
                accuracy: "96.2%",
            },
            {
                id: "wf8",
                name: "超参数调优",
                status: "in_progress",
                progress: 45,
                startTime: "2023-05-08 10:00",
                endTime: null,
                duration: "进行中",
                samples: 200,
                accuracy: "进行中",
            },
        ],
        reports: [
            {id: "rep1", name: "模型性能分析报告", createdAt: "2023-05-05", author: "张三"},
            {id: "rep2", name: "数据集质量评估", createdAt: "2023-05-03", author: "李四"},
            {id: "rep3", name: "模型对比实验结果", createdAt: "2023-05-01", author: "王五"},
        ],
    }


    if (!project) {
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
                                    <BreadcrumbLink asChild>
                                        <Link to="/project">
                                            Projects
                                        </Link>
                                        {/*Projects*/}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>--</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div></div>
            </SidebarInset>
        )
    }

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
                                <BreadcrumbLink asChild>
                                    <Link to="/project">
                                        Projects
                                    </Link>
                                    {/*Projects*/}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{project.name}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* 返回和项目标题 */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                    <div>
                        <Link
                            to="/project"
                            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1"/>
                            返回项目列表
                        </Link>
                        <div className="flex items-start gap-2">
                            <h1 className="text-2xl font-bold">{project.name}</h1>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={project.starred ? "text-amber-400" : "text-muted-foreground"}
                            >
                                <Star className="h-5 w-5"/>
                                <span className="sr-only">收藏</span>
                            </Button>
                        </div>
                        <p className="text-muted-foreground mt-1">{project.description}</p>

                        <div className="flex flex-wrap gap-1 mt-3">
                            {project.tags.map((tag) => (
                                <Badge
                                    key={tag.id}
                                    className={`${colorClassMap[tag.color]} border-0`}
                                >
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button>
                            <Play className="h-4 w-4 mr-2"/>
                            运行工作流
                        </Button>
                        <Button variant="outline">
                            <Download className="h-4 w-4 mr-2"/>
                            导出
                        </Button>
                        <Button variant="outline">
                            <Share2 className="h-4 w-4 mr-2"/>
                            分享
                        </Button>
                        <Button variant="outline">
                            <Settings className="h-4 w-4 mr-2"/>
                            设置
                        </Button>
                    </div>
                </div>

                {/* 项目信息卡片 */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center">
                                <FlaskConical className="h-4 w-4 mr-2"/>
                                工作流状态
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-2xl font-bold">
                                    {tempProject.completedWorkflows}/{tempProject.totalWorkflows}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 flex items-center">
                                        <CheckCircle2 className="h-3 w-3 mr-1"/>
                                        {tempProject.completedWorkflows}
                                    </Badge>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 flex items-center">
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin"/>
                                        {tempProject.inProgressWorkflows}
                                    </Badge>
                                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 flex items-center">
                                        <AlertCircle className="h-3 w-3 mr-1"/>
                                        {tempProject.failedWorkflows}
                                    </Badge>
                                </div>
                            </div>
                            <Progress value={(tempProject.completedWorkflows / tempProject.totalWorkflows) * 100} className="h-2"/>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center">
                                <Clock className="h-4 w-4 mr-2"/>
                                最后更新
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{tempProject.lastUpdated}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center">
                                <Database className="h-4 w-4 mr-2"/>
                                样本数量
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{tempProject.sampleCount.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* 项目内容标签页 */}
                <Tabs defaultValue="workflows" className="w-full">
                    <TabsList className="grid grid-cols-3 md:w-auto md:inline-flex">
                        <TabsTrigger value="workflows" className="flex items-center">
                            <FlaskConical className="h-4 w-4 mr-2"/>
                            工作流
                        </TabsTrigger>
                        <TabsTrigger value="reports" className="flex items-center">
                            <FileBarChart className="h-4 w-4 mr-2"/>
                            报告
                        </TabsTrigger>
                        <TabsTrigger value="files" className="flex items-center">
                            <FileText className="h-4 w-4 mr-2"/>
                            文件
                        </TabsTrigger>
                    </TabsList>

                    {/* 工作流标签页内容 */}
                    <TabsContent value="workflows" className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-medium">分析工作流</h2>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                    <Filter className="h-4 w-4 mr-2"/>
                                    筛选
                                </Button>
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-2"/>
                                    新工作流
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="bg-muted/50">
                                    <tr className="border-b">
                                        <th className="h-12 px-4 text-left align-middle font-medium">工作流名称</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium">状态</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium">进度</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium hidden md:table-cell">开始时间</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium hidden md:table-cell">持续时间</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium">样本数</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium">准确率</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium">操作</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {tempProject.workflows.map((workflow) => (
                                        <tr key={workflow.id} className="border-b hover:bg-muted/50 transition-colors">
                                            <td className="p-4 font-medium">
                                                <Link to={`/projects/${tempProject.id}/workflows/${workflow.id}`} className="hover:underline">
                                                    {workflow.name}
                                                </Link>
                                            </td>
                                            <td className="p-4">
                                                {workflow.status === "completed" && (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-green-50 text-green-600 border-green-200 flex items-center"
                                                    >
                                                        <CheckCircle2 className="h-3 w-3 mr-1"/>
                                                        已完成
                                                    </Badge>
                                                )}
                                                {workflow.status === "in_progress" && (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-blue-50 text-blue-600 border-blue-200 flex items-center"
                                                    >
                                                        <Loader2 className="h-3 w-3 mr-1 animate-spin"/>
                                                        进行中
                                                    </Badge>
                                                )}
                                                {workflow.status === "failed" && (
                                                    <Badge variant="outline"
                                                           className="bg-red-50 text-red-600 border-red-200 flex items-center">
                                                        <AlertCircle className="h-3 w-3 mr-1"/>
                                                        失败
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Progress value={workflow.progress} className="h-2 w-24"/>
                                                    <span className="text-xs text-muted-foreground">{workflow.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-muted-foreground hidden md:table-cell">{workflow.startTime}</td>
                                            <td className="p-4 text-muted-foreground hidden md:table-cell">{workflow.duration}</td>
                                            <td className="p-4 text-muted-foreground">{workflow.samples}</td>
                                            <td className="p-4 text-muted-foreground">{workflow.accuracy}</td>
                                            <td className="p-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4"/>
                                                            <span className="sr-only">更多选项</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>查看详情</DropdownMenuItem>
                                                        <DropdownMenuItem>重新运行</DropdownMenuItem>
                                                        <DropdownMenuItem>创建报告</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">删除</DropdownMenuItem>
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

                    {/* 报告标签页内容 */}
                    <TabsContent value="reports" className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-medium">分析报告</h2>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2"/>
                                新报告
                            </Button>
                        </div>

                        <div className="rounded-md border">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="bg-muted/50">
                                    <tr className="border-b">
                                        <th className="h-12 px-4 text-left align-middle font-medium">报告名称</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium">创建日期</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium">创建者</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium">操作</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {tempProject.reports.map((report) => (
                                        <tr key={report.id} className="border-b hover:bg-muted/50 transition-colors">
                                            <td className="p-4 font-medium">
                                                <Link to={`/projects/${tempProject.id}/reports/${report.id}`} className="hover:underline">
                                                    {report.name}
                                                </Link>
                                            </td>
                                            <td className="p-4 text-muted-foreground">{report.createdAt}</td>
                                            <td className="p-4 text-muted-foreground">{report.author}</td>
                                            <td className="p-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4"/>
                                                            <span className="sr-only">更多选项</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>查看</DropdownMenuItem>
                                                        <DropdownMenuItem>编辑</DropdownMenuItem>
                                                        <DropdownMenuItem>导出 PDF</DropdownMenuItem>
                                                        <DropdownMenuItem>分享</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">删除</DropdownMenuItem>
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

                    {/* 文件标签页内容 */}
                    <TabsContent value="files" className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-medium">项目文件</h2>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2"/>
                                上传文件
                            </Button>
                        </div>

                        <div className="rounded-md border">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="bg-muted/50">
                                    <tr className="border-b">
                                        <th className="h-12 px-4 text-left align-middle font-medium">文件名</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium">类型</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium">大小</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium">上传时间</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium">操作</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <tr className="border-b hover:bg-muted/50 transition-colors">
                                        <td className="p-4 font-medium">
                                            <Link to="#" className="hover:underline">
                                                dataset_cifar10.zip
                                            </Link>
                                        </td>
                                        <td className="p-4 text-muted-foreground">ZIP</td>
                                        <td className="p-4 text-muted-foreground">1.2 GB</td>
                                        <td className="p-4 text-muted-foreground">2023-05-01</td>
                                        <td className="p-4 text-right">
                                            <Button variant="ghost" size="sm">
                                                下载
                                            </Button>
                                        </td>
                                    </tr>
                                    <tr className="border-b hover:bg-muted/50 transition-colors">
                                        <td className="p-4 font-medium">
                                            <Link to="#" className="hover:underline">
                                                model_config.yaml
                                            </Link>
                                        </td>
                                        <td className="p-4 text-muted-foreground">YAML</td>
                                        <td className="p-4 text-muted-foreground">4.5 KB</td>
                                        <td className="p-4 text-muted-foreground">2023-05-02</td>
                                        <td className="p-4 text-right">
                                            <Button variant="ghost" size="sm">
                                                下载
                                            </Button>
                                        </td>
                                    </tr>
                                    <tr className="border-b hover:bg-muted/50 transition-colors">
                                        <td className="p-4 font-medium">
                                            <Link to="#" className="hover:underline">
                                                pretrained_weights.h5
                                            </Link>
                                        </td>
                                        <td className="p-4 text-muted-foreground">H5</td>
                                        <td className="p-4 text-muted-foreground">250 MB</td>
                                        <td className="p-4 text-muted-foreground">2023-05-03</td>
                                        <td className="p-4 text-right">
                                            <Button variant="ghost" size="sm">
                                                下载
                                            </Button>
                                        </td>
                                    </tr>
                                    <tr className="border-b hover:bg-muted/50 transition-colors">
                                        <td className="p-4 font-medium">
                                            <Link to="#" className="hover:underline">
                                                data_preprocessing.py
                                            </Link>
                                        </td>
                                        <td className="p-4 text-muted-foreground">Python</td>
                                        <td className="p-4 text-muted-foreground">12.8 KB</td>
                                        <td className="p-4 text-muted-foreground">2023-05-04</td>
                                        <td className="p-4 text-right">
                                            <Button variant="ghost" size="sm">
                                                下载
                                            </Button>
                                        </td>
                                    </tr>
                                    <tr className="border-b hover:bg-muted/50 transition-colors">
                                        <td className="p-4 font-medium">
                                            <Link to="#" className="hover:underline">
                                                evaluation_results.csv
                                            </Link>
                                        </td>
                                        <td className="p-4 text-muted-foreground">CSV</td>
                                        <td className="p-4 text-muted-foreground">1.5 MB</td>
                                        <td className="p-4 text-muted-foreground">2023-05-05</td>
                                        <td className="p-4 text-right">
                                            <Button variant="ghost" size="sm">
                                                下载
                                            </Button>
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </SidebarInset>
    )
}
