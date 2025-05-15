"use client"

import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Separator} from "@/components/ui/separator"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {ArrowLeft, Code, Copy, ExternalLink, FileText, HardDrive, Info, Layers, Terminal} from "lucide-react"
import {useTool} from "@/hooks/useTool.tsx";
import {Link, useParams} from "react-router-dom";
import {ParamType} from "@/types/tool.tsx";
import {SidebarInset, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";

export function ToolDetailPage() {
    const {toolUid} = useParams();
    const {data: tool, isLoading, error} = useTool({uid: toolUid ? toolUid : ''});

    // 复制命令到剪贴板
    const copyToClipboard = (text: string) => {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                alert("已复制到剪贴板")
            })
            .catch((err) => {
                console.error("复制失败:", err)
            })
    }

    if (!tool) return (<div></div>)

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
                                    <Link to="/tool">
                                        Tools
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block"/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>{tool.name}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto py-6 max-w-4xl">
                    <div className="mb-6">
                        <Link to="/tool" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
                            <ArrowLeft className="h-4 w-4 mr-1"/>
                            返回工具列表
                        </Link>
                    </div>

                    {/* 工具标题和基本信息 */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-bold">{tool.name}</h1>
                                <Badge className="ml-2">{tool.docker_tag}</Badge>
                            </div>
                            <p className="text-muted-foreground mt-1">{tool.docker_repo}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4 mr-2"/>
                                查看文档
                            </Button>
                            <Button asChild variant="outline" size="sm">
                                <a
                                    href={`https://hub.docker.com/r/${tool.docker_repo}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Docker Hub
                                </a>
                            </Button>
                        </div>
                    </div>

                    {/* 工具描述 */}
                    <Card className="pt-0 gap-0 mb-6">
                        <CardContent className="pt-6">
                            <p>{tool.description}</p>
                        </CardContent>
                    </Card>

                    {/* 主要内容区域 */}
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">
                                <Info className="h-4 w-4 mr-2"/>
                                概览
                            </TabsTrigger>
                            <TabsTrigger value="params">
                                <Layers className="h-4 w-4 mr-2"/>
                                参数
                                <Badge variant="outline" className="ml-2">
                                    {tool.required_params.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="outputs">
                                <FileText className="h-4 w-4 mr-2"/>
                                输出文件
                                <Badge variant="outline" className="ml-2">
                                    {tool.output_files.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="command">
                                <Terminal className="h-4 w-4 mr-2"/>
                                命令
                            </TabsTrigger>
                        </TabsList>

                        {/* 概览选项卡 */}
                        <TabsContent value="overview">
                            <Card>
                                <CardHeader>
                                    <CardTitle>工具概览</CardTitle>
                                    <CardDescription>Docker 容器和基本配置信息</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Docker 镜像信息 */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground">Docker 镜像</h3>
                                        <div className="flex items-center bg-muted/30 p-3 rounded-md">
                                            <HardDrive className="h-5 w-5 mr-3 text-muted-foreground"/>
                                            <span className="font-medium">{tool.docker_repo}:{tool.docker_tag}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 ml-2"
                                                onClick={() => copyToClipboard(`${tool.docker_repo}:${tool.docker_tag}`)}
                                            >
                                                <Copy className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* 命令模板 */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground">命令模板</h3>
                                        <div className="flex items-center bg-muted/30 p-3 rounded-md">
                                            <Code className="h-5 w-5 mr-3 text-muted-foreground"/>
                                            <code className="text-sm overflow-x-auto max-w-full">{tool.command_template}</code>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 ml-2 flex-shrink-0"
                                                onClick={() => copyToClipboard(tool.command_template)}
                                            >
                                                <Copy className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* 帮助命令 */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground">帮助命令</h3>
                                        <div className="flex items-center bg-muted/30 p-3 rounded-md">
                                            <Terminal className="h-5 w-5 mr-3 text-muted-foreground"/>
                                            <code className="text-sm">{tool.help_command}</code>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 ml-2"
                                                onClick={() => copyToClipboard(tool.help_command)}
                                            >
                                                <Copy className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* 配置选项 */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground">配置选项</h3>
                                        <div className="bg-muted/30 p-3 rounded-md">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-center">
                                                    <Badge variant={tool.mkdir_output ? "default" : "outline"} className="mr-3">
                                                        {tool.mkdir_output ? "是" : "否"}
                                                    </Badge>
                                                    <span>创建输出目录</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Badge variant={tool.use_temp_dir ? "default" : "outline"} className="mr-3">
                                                        {tool.use_temp_dir ? "是" : "否"}
                                                    </Badge>
                                                    <span>使用临时目录</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* 参数选项卡 */}
                        <TabsContent value="params">
                            <Card>
                                <CardHeader>
                                    <CardTitle>参数配置</CardTitle>
                                    <CardDescription>工具所需的必要参数和可选参数</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium mb-4">必要参数</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {tool.required_params.map((param, index) => (
                                                <div
                                                    key={index}
                                                    className={`p-4 rounded-lg border ${
                                                        param.param_type === ParamType.INPUT
                                                            ? "border-l-4 border-l-blue-500"
                                                            : "border-l-4 border-l-green-500"
                                                    }`}
                                                >
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <h4 className="font-medium">{param.name}</h4>
                                                        <Badge
                                                            className={param.param_type === ParamType.INPUT ? "bg-blue-500" : "bg-green-500"}>
                                                            {param.param_type === ParamType.INPUT ? "输入" : "输出"}
                                                        </Badge>
                                                        {param.is_file && <Badge variant="outline">文件</Badge>}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-1">命令格式</p>
                                                            <code className="bg-muted px-2 py-1 rounded text-sm block overflow-x-auto">
                                                                {param.command}
                                                            </code>
                                                        </div>
                                                        {param.mount_path && (
                                                            <div>
                                                                <p className="text-sm text-muted-foreground mb-1">挂载路径</p>
                                                                <code className="bg-muted px-2 py-1 rounded text-sm block overflow-x-auto">
                                                                    {param.mount_path}
                                                                </code>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator/>

                                    <div>
                                        <h3 className="text-lg font-medium mb-4">可选参数</h3>
                                        {tool.optional_params ? (
                                            <div className="bg-muted p-4 rounded-lg">
                                                <code
                                                    className="text-sm block overflow-x-auto whitespace-pre-wrap">{tool.optional_params}</code>
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">无可选参数</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* 输出文件选项卡 */}
                        <TabsContent value="outputs">
                            <Card>
                                <CardHeader>
                                    <CardTitle>输出文件</CardTitle>
                                    <CardDescription>工具生成的输出文件配置</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-4">
                                        {tool.output_files.map((file, index) => (
                                            <div key={index} className="p-4 rounded-lg border border-l-4 border-l-green-500">
                                                <h4 className="font-medium mb-3">{file.name}</h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground mb-1">文件路径</p>
                                                        <code className="bg-muted px-2 py-1 rounded text-sm block overflow-x-auto">
                                                            {file.file_path}
                                                        </code>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground mb-1">挂载路径</p>
                                                        <code className="bg-muted px-2 py-1 rounded text-sm block overflow-x-auto">
                                                            {file.mount_path}
                                                        </code>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* 命令选项卡 */}
                        <TabsContent value="command">
                            <Card>
                                <CardHeader>
                                    <CardTitle>命令示例</CardTitle>
                                    <CardDescription>根据配置生成的命令示例</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="bg-black text-white p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                            <pre className="whitespace-pre-wrap">{tool.complete_command}</pre>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button variant="outline" size="sm" onClick={() => copyToClipboard(tool.complete_command)}>
                                                <Copy className="h-4 w-4 mr-2"/>
                                                复制命令
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </SidebarInset>
    )
}
