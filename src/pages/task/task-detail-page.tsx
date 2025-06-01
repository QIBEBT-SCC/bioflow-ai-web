"use client"

import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Separator} from "@/components/ui/separator"
import {ScrollArea} from "@/components/ui/scroll-area"
import {Progress} from "@/components/ui/progress"
import {
    Code,
    FileText,
    Link2,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Pause,
    ArrowLeft,
    Copy,
    User,
    Server,
    Cpu,
    MemoryStick,
    HardDrive,
} from "lucide-react"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {SidebarInset, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";
import {Link, useParams} from "react-router-dom";
import {TaskRecordPage} from "@/components/task/task-record-page.tsx";
import {useTask, useTaskLog} from "@/hooks/use-instance.tsx";
import {Status} from "@/types/instance.tsx";
import {formatTime, getDuration} from "@/lib/time-formatter.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";

// 状态配置
const statusConfig = {
    0: {
        color: "bg-yellow-500",
        textColor: "text-yellow-700",
        bgColor: "bg-yellow-50",
        icon: <Pause className="h-4 w-4"/>,
        text: "等待中",
    },
    1: {
        color: "bg-blue-500",
        textColor: "text-blue-700",
        bgColor: "bg-blue-50",
        icon: <RefreshCw className="h-4 w-4 animate-spin"/>,
        text: "运行中",
    },
    2: {
        color: "bg-red-500",
        textColor: "text-red-700",
        bgColor: "bg-red-50",
        icon: <AlertCircle className="h-4 w-4"/>,
        text: "失败",
    },
    3: {
        color: "bg-green-500",
        textColor: "text-green-700",
        bgColor: "bg-green-50",
        icon: <CheckCircle2 className="h-4 w-4"/>,
        text: "已完成",
    },
}

export function TaskDetailPage() {
    const {taskUid = ''} = useParams();
    const {data: taskDetail} = useTask(taskUid);
    const {data: logContent} = useTaskLog(taskUid);

    const statusInfo = statusConfig[taskDetail?.status ?? Status.WAITING]

    const copyCommand = () => {
        navigator.clipboard.writeText(taskDetail?.commands ?? '').then();
    }

    return (
        <SidebarInset className="h-screen flex flex-col">
            <header
                className="flex flex-col shrink-0 border-b">
                <div className="flex items-center gap-2 px-4 h-12 bg-background">
                    <SidebarTrigger className="-ml-1"/>
                    <Separator orientation="vertical" className="!mr-2 !h-4"/>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink asChild>
                                    <Link to="/task">
                                        Task
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block"/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>{taskDetail?.name ?? '--'}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto py-6 space-y-6">
                    {/* 页面头部 */}
                    <div className="mb-6">
                        <Link to="/task" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
                            <ArrowLeft className="h-4 w-4 mr-1"/>
                            任务列表
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">{taskDetail?.name ?? '--'}</h1>
                            <p className="text-muted-foreground">任务ID: {taskDetail?.uid ?? '--'}</p>
                        </div>
                    </div>

                    {/* 主要内容区域 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 左侧详细信息 */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* 状态卡片 */}
                            <Card
                                className={`${statusInfo.bgColor} border-l-4`}
                                style={{borderLeftColor: statusInfo.color.replace("bg-", "")}}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${statusInfo.color}`}>{statusInfo.icon}</div>
                                            <div>
                                                <CardTitle className={statusInfo.textColor}>{statusInfo.text}</CardTitle>
                                                <CardDescription>描述</CardDescription>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <div className="text-muted-foreground">创建时间</div>
                                            <div className="font-medium">{formatTime(taskDetail?.create_time)}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">开始时间</div>
                                            <div className="font-medium">{formatTime(taskDetail?.start_time)}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">运行时长</div>
                                            <div className="font-medium">{getDuration(taskDetail?.start_time, taskDetail?.end_time)}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Tabs defaultValue="logs" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="logs">运行日志</TabsTrigger>
                                    <TabsTrigger value="command">执行指令</TabsTrigger>
                                    <TabsTrigger value="monitor">资源记录</TabsTrigger>
                                </TabsList>

                                <TabsContent value="logs" className="space-y-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <FileText className="h-5 w-5"/>
                                                运行日志
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ScrollArea className="h-[500px] bg-muted rounded-md p-4 border">
                                                <div className="whitespace-pre-line">
                                                    {logContent?.content ?? ''}
                                                </div>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="command">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Code className="h-5 w-5"/>
                                                执行指令
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="relative">
                                                <Textarea
                                                    className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
                                                    {taskDetail?.commands}
                                                </Textarea>
                                                <Button variant="outline" size="sm" className="absolute top-2 right-2"
                                                        onClick={copyCommand}>
                                                    <Copy className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="monitor">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>资源记录</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <TaskRecordPage/>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* 右侧信息面板 */}
                        <div className="space-y-6">
                            {/* 基本信息 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>基本信息</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Link2 className="h-4 w-4 text-muted-foreground"/>
                                        <div>
                                            <div className="text-sm text-muted-foreground">系统</div>
                                            <div className="font-medium">{taskDetail?.system}</div>
                                        </div>
                                    </div>
                                    <Separator/>
                                    <div className="flex items-center gap-3">
                                        <User className="h-4 w-4 text-muted-foreground"/>
                                        <div>
                                            <div className="text-sm text-muted-foreground">执行者</div>
                                            <div className="font-medium">{taskDetail?.owner?.username}</div>
                                        </div>
                                    </div>
                                    <Separator/>
                                    <div className="flex items-center gap-3">
                                        <Server className="h-4 w-4 text-muted-foreground"/>
                                        <div>
                                            <div className="text-sm text-muted-foreground">执行服务器</div>
                                            <div className="font-medium">{taskDetail?.hostname}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 资源使用情况 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>资源使用情况</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Cpu className="h-4 w-4"/>
                                                <span className="text-sm">CPU</span>
                                            </div>
                                            <span className="text-sm font-medium">0%</span>
                                        </div>
                                        <Progress value={0}/>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <MemoryStick className="h-4 w-4"/>
                                                <span className="text-sm">内存</span>
                                            </div>
                                            <span className="text-sm font-medium">{0} GB</span>
                                        </div>
                                        <Progress value={0}/>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <HardDrive className="h-4 w-4"/>
                                                <span className="text-sm">磁盘I/O</span>
                                            </div>
                                            <span className="text-sm font-medium">{0} MB/s</span>
                                        </div>
                                        <Progress value={0}/>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarInset>
    )
}
