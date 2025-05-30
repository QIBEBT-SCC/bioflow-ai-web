"use client"

import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Separator} from "@/components/ui/separator"
import {ScrollArea} from "@/components/ui/scroll-area"
import {Progress} from "@/components/ui/progress"
import {
    Code,
    FileText,
    Link2,
    Play,
    RefreshCw,
    Square,
    CheckCircle2,
    AlertCircle,
    Pause,
    ArrowLeft,
    Download,
    Copy,
    Settings,
    Activity,
    User,
    Server,
    Cpu,
    MemoryStick,
    HardDrive,
} from "lucide-react"
import {useState} from "react"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
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
import {Link} from "react-router-dom";
import {TaskRecordPage} from "@/components/task/task-record-page.tsx";

// 模拟单个任务的详细数据
const taskDetail = {
    id: "task-001",
    toolName: "数据提取器 v2.1.3",
    description: "从多个API端点获取用户数据，进行数据清洗和格式化处理，最终输出为标准JSON格式",
    command: "extract-data --source=api.example.com/users --format=json --batch-size=1000 --timeout=30s --retry=3",
    status: "running",
    progress: 65,
    startTime: "2024-01-15 10:30:15",
    duration: "00:25:32",
    estimatedRemaining: "00:12:45",
    taskChain: "用户数据处理流程",
    chainPosition: "2/5",
    executor: "系统管理员",
    server: "prod-worker-03",
    priority: "高",
    resources: {
        cpu: 45,
        memory: 2.1,
        disk: 15.6,
    },
    parameters: {
        source: "api.example.com/users",
        format: "json",
        "batch-size": "1000",
        timeout: "30s",
        retry: "3",
        "output-path": "/data/processed/users.json",
        compression: "gzip",
        validation: "strict",
    },
    logs: [
        {time: "10:30:15", level: "info", message: "任务开始执行", details: "初始化数据提取器模块"},
        {time: "10:30:16", level: "info", message: "连接API端点", details: "正在建立与api.example.com的连接"},
        {time: "10:30:18", level: "info", message: "成功建立连接", details: "连接延迟: 45ms, SSL握手完成"},
        {time: "10:30:20", level: "info", message: "开始数据获取", details: "批次大小: 1000条记录"},
        {
            time: "10:32:45",
            level: "warning",
            message: "部分数据字段缺失",
            details: "字段'phone'在123条记录中缺失，使用默认值填充",
        },
        {time: "10:35:30", level: "info", message: "数据验证中", details: "正在验证数据完整性和格式"},
        {time: "10:38:12", level: "info", message: "已处理5000条记录", details: "当前进度: 50%, 处理速度: 185条/秒"},
        {time: "10:42:30", level: "warning", message: "API限流检测", details: "检测到速率限制，自动降低请求频率"},
        {time: "10:45:15", level: "info", message: "恢复正常处理速度", details: "限流解除，恢复到185条/秒"},
        {time: "10:48:22", level: "info", message: "数据压缩中", details: "使用gzip压缩，预计减少70%存储空间"},
        {time: "10:52:10", level: "info", message: "已处理8000条记录", details: "当前进度: 80%, 预计剩余时间: 8分钟"},
        {time: "10:55:47", level: "info", message: "正在处理最后一批数据", details: "剩余1500条记录待处理"},
    ],
    metrics: [
        {name: "总记录数", value: "10,000", unit: "条"},
        {name: "已处理", value: "6,500", unit: "条"},
        {name: "处理速度", value: "185", unit: "条/秒"},
        {name: "错误率", value: "0.12", unit: "%"},
        {name: "数据大小", value: "245.6", unit: "MB"},
        {name: "网络传输", value: "1.2", unit: "GB"},
    ],
}

// 状态配置
const statusConfig = {
    running: {
        color: "bg-blue-500",
        textColor: "text-blue-700",
        bgColor: "bg-blue-50",
        icon: <RefreshCw className="h-4 w-4 animate-spin"/>,
        text: "运行中",
    },
    completed: {
        color: "bg-green-500",
        textColor: "text-green-700",
        bgColor: "bg-green-50",
        icon: <CheckCircle2 className="h-4 w-4"/>,
        text: "已完成",
    },
    failed: {
        color: "bg-red-500",
        textColor: "text-red-700",
        bgColor: "bg-red-50",
        icon: <AlertCircle className="h-4 w-4"/>,
        text: "失败",
    },
    paused: {
        color: "bg-yellow-500",
        textColor: "text-yellow-700",
        bgColor: "bg-yellow-50",
        icon: <Pause className="h-4 w-4"/>,
        text: "已暂停",
    },
}

// 日志级别配置
const logLevelConfig = {
    info: {color: "text-blue-600", bg: "bg-blue-50"},
    warning: {color: "text-yellow-600", bg: "bg-yellow-50"},
    error: {color: "text-red-600", bg: "bg-red-50"},
}

export function TaskDetailPage() {
    const [selectedLog, setSelectedLog] = useState(null)
    const statusInfo = statusConfig[taskDetail.status]

    const copyCommand = () => {
        navigator.clipboard.writeText(taskDetail.command)
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
                                    <Link to="/project">
                                        Task
                                    </Link>
                                    {/*Projects*/}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block"/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>{taskDetail.toolName}</BreadcrumbPage>
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
                            <h1 className="text-3xl font-bold">{taskDetail.toolName}</h1>
                            <p className="text-muted-foreground">任务ID: {taskDetail.id}</p>
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
                                                <CardDescription>{taskDetail.description}</CardDescription>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <div className="text-muted-foreground">开始时间</div>
                                            <div className="font-medium">{taskDetail.startTime}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">运行时长</div>
                                            <div className="font-medium">{taskDetail.duration}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">预计剩余</div>
                                            <div className="font-medium">{taskDetail.estimatedRemaining}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Tabs defaultValue="logs" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="logs">运行日志</TabsTrigger>
                                    <TabsTrigger value="command">执行指令</TabsTrigger>
                                    <TabsTrigger value="parameters">参数配置</TabsTrigger>
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
                                            <ScrollArea className="h-[500px]">
                                                <div className="space-y-2">
                                                    {taskDetail.logs.map((log, index) => (
                                                        <div
                                                            key={index}
                                                            className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                                                                selectedLog === index ? "ring-2 ring-primary" : ""
                                                            }`}
                                                            onClick={() => setSelectedLog(selectedLog === index ? null : index)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <Badge variant="outline" className={logLevelConfig[log.level].color}>
                                                                        {log.level}
                                                                    </Badge>
                                                                    <span className="text-sm text-muted-foreground">{log.time}</span>
                                                                </div>
                                                            </div>
                                                            <div className="mt-2 font-medium">{log.message}</div>
                                                            {selectedLog === index && (
                                                                <div
                                                                    className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded">{log.details}</div>
                                                            )}
                                                        </div>
                                                    ))}
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
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
                      {taskDetail.command}
                    </pre>
                                                <Button variant="outline" size="sm" className="absolute top-2 right-2"
                                                        onClick={copyCommand}>
                                                    <Copy className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="parameters">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>参数配置</CardTitle>
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
                                            <div className="text-sm text-muted-foreground">所属任务链</div>
                                            <div className="font-medium">{taskDetail.taskChain}</div>
                                        </div>
                                    </div>
                                    <Separator/>
                                    <div className="flex items-center gap-3">
                                        <User className="h-4 w-4 text-muted-foreground"/>
                                        <div>
                                            <div className="text-sm text-muted-foreground">执行者</div>
                                            <div className="font-medium">{taskDetail.executor}</div>
                                        </div>
                                    </div>
                                    <Separator/>
                                    <div className="flex items-center gap-3">
                                        <Server className="h-4 w-4 text-muted-foreground"/>
                                        <div>
                                            <div className="text-sm text-muted-foreground">执行服务器</div>
                                            <div className="font-medium">{taskDetail.server}</div>
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
                                            <span className="text-sm font-medium">{taskDetail.resources.cpu}%</span>
                                        </div>
                                        <Progress value={taskDetail.resources.cpu}/>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <MemoryStick className="h-4 w-4"/>
                                                <span className="text-sm">内存</span>
                                            </div>
                                            <span className="text-sm font-medium">{taskDetail.resources.memory} GB</span>
                                        </div>
                                        <Progress value={(taskDetail.resources.memory / 8) * 100}/>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <HardDrive className="h-4 w-4"/>
                                                <span className="text-sm">磁盘I/O</span>
                                            </div>
                                            <span className="text-sm font-medium">{taskDetail.resources.disk} MB/s</span>
                                        </div>
                                        <Progress value={taskDetail.resources.disk}/>
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
