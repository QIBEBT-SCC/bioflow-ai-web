"use client"

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Copy, Globe, FileText, HardDrive, Code, Terminal, Layers, Tag, Folder} from "lucide-react"
import {DockerToolCreate, ImageConfig, ToolImage} from "@/types/tool.tsx";

interface CreateConfirmationStepProps {
    selectedImage: ToolImage | null
    toolConfig: DockerToolCreate
}

export function CreateConfirmationStep({selectedImage, toolConfig}: CreateConfirmationStepProps) {
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

    // 获取完整镜像名称
    const getImageName = (imageConfig: ImageConfig) => {
        return `${imageConfig.registry}/${imageConfig.namespace}/${imageConfig.repository}:${imageConfig.tag}`
    }

    // 生成示例命令
    const generateExampleCommand = () => {
        let command = toolConfig.command_template

        // 替换动态参数
        const dynamicParamsString = toolConfig.dynamic_params
            .sort((a, b) => (a.index || 0) - (b.index || 0))
            .map((param) => {
                const cmd = param.command
                // 替换参数占位符为示例值
                return cmd.replace("{value}", "example_value")
            })
            .join(" ")

        command = command.replace("{dynamic_params}", dynamicParamsString)
        command = command.replace("{static_params}", toolConfig.static_params)

        return command
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">确认创建工具</h2>
                <p className="text-muted-foreground">请检查以下配置信息，确认无误后点击"创建工具"按钮</p>
            </div>

            <div className="space-y-6">
                {/* 镜像信息 */}
                {selectedImage && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HardDrive className="h-5 w-5"/>
                                选择的镜像
                            </CardTitle>
                            <CardDescription>Docker 镜像配置信息</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium">{selectedImage.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary">{selectedImage.version}</Badge>
                                        <Badge variant="outline" className="text-xs font-mono">
                                            {selectedImage.image.namespace}/{selectedImage.image.repository}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {selectedImage.homepage && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => window.open(selectedImage.homepage, "_blank")}
                                        >
                                            <Globe className="h-4 w-4"/>
                                        </Button>
                                    )}
                                    {selectedImage.paper_link && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => window.open(selectedImage.paper_link, "_blank")}
                                        >
                                            <FileText className="h-4 w-4"/>
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{selectedImage.description}</p>
                            <div className="bg-muted/30 p-3 rounded-md">
                                <p className="text-xs text-muted-foreground mb-1">Docker 镜像地址</p>
                                <code className="text-sm">{getImageName(selectedImage.image)}</code>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 工具配置概览 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Code className="h-5 w-5"/>
                            工具配置概览
                        </CardTitle>
                        <CardDescription>工具的基本配置和命令信息</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* 基本信息 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">工具名称</p>
                                <p className="font-medium">{toolConfig.name || "未设置"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">镜像 UID</p>
                                <code className="text-sm bg-muted px-2 py-1 rounded">{toolConfig.image_uid}</code>
                            </div>
                        </div>

                        {toolConfig.description && (
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">描述</p>
                                <p className="text-sm">{toolConfig.description}</p>
                            </div>
                        )}

                        {/* 命令模板 */}
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">命令模板</p>
                            <div className="flex items-center bg-muted/30 p-3 rounded-md">
                                <Terminal className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0"/>
                                <code className="text-sm overflow-x-auto">{toolConfig.command_template}</code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 ml-2 flex-shrink-0"
                                    onClick={() => copyToClipboard(toolConfig.command_template)}
                                >
                                    <Copy className="h-4 w-4"/>
                                </Button>
                            </div>
                        </div>

                        {/* 静态参数 */}
                        {toolConfig.static_params && (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">静态参数</p>
                                <div className="bg-muted/30 p-3 rounded-md">
                                    <code className="text-sm">{toolConfig.static_params}</code>
                                </div>
                            </div>
                        )}

                        {/* 配置选项 */}
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">配置选项</p>
                            <div className="bg-muted/30 p-3 rounded-md">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center">
                                        <Badge variant={toolConfig.mkdir_output ? "default" : "outline"} className="mr-3">
                                            {toolConfig.mkdir_output ? "是" : "否"}
                                        </Badge>
                                        <span className="text-sm">创建输出目录</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Badge variant={toolConfig.use_temp_dir ? "default" : "outline"} className="mr-3">
                                            {toolConfig.use_temp_dir ? "是" : "否"}
                                        </Badge>
                                        <span className="text-sm">使用临时目录</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 元信息 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5"/>
                            元信息
                        </CardTitle>
                        <CardDescription>工具的分组和标签信息</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">工具分组</p>
                                <div className="flex items-center gap-2">
                                    <Folder className="h-4 w-4 text-muted-foreground"/>
                                    <span className="text-sm">分组 ID: {toolConfig.group_id}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">标签</p>
                                <div className="flex flex-wrap gap-2">
                                    {toolConfig.tags.length > 0 ? (
                                        toolConfig.tags.map((tag) => (
                                            <Badge key={tag.id} variant="secondary">
                                                {tag.name}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground">无标签</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 动态参数配置 */}
                {toolConfig.dynamic_params.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="h-5 w-5"/>
                                动态参数配置
                                <Badge variant="outline">{toolConfig.dynamic_params.length}</Badge>
                            </CardTitle>
                            <CardDescription>工具的动态参数配置</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {toolConfig.dynamic_params
                                    .sort((a, b) => (a.index || 0) - (b.index || 0))
                                    .map((param, index) => (
                                        <div key={index} className="p-3 rounded-lg border border-l-4 border-l-primary">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="font-medium">参数 {(param.index || 0) + 1}</span>
                                                {param.required && <Badge className="bg-red-500">必需</Badge>}
                                                {param.is_position && <Badge className="bg-blue-500">位置参数</Badge>}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">命令格式: </span>
                                                    <code className="bg-muted px-1 py-0.5 rounded">{param.command}</code>
                                                </div>
                                                {param.description && (
                                                    <div>
                                                        <span className="text-muted-foreground">描述: </span>
                                                        <span>{param.description}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 文件挂载 */}
                {toolConfig.file_mounts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5"/>
                                文件挂载
                                <Badge variant="outline">{toolConfig.file_mounts.length}</Badge>
                            </CardTitle>
                            <CardDescription>工具的文件挂载配置</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {toolConfig.file_mounts.map((file, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-lg border border-l-4 ${
                                            file.file_type === "INPUT" ? "border-l-blue-500" : "border-l-green-500"
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="font-medium">{file.name}</span>
                                            <Badge className={file.file_type === "INPUT" ? "bg-blue-500" : "bg-green-500"}>
                                                {file.file_type === "INPUT" ? "输入" : "输出"}
                                            </Badge>
                                            {file.is_report && <Badge variant="outline">报告</Badge>}
                                            {file.is_log && <Badge variant="outline">日志</Badge>}
                                        </div>
                                        {file.description && <p className="text-sm text-muted-foreground mb-2">{file.description}</p>}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">文件路径: </span>
                                                <code className="bg-muted px-1 py-0.5 rounded">{file.file_path}</code>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">挂载路径: </span>
                                                <code className="bg-muted px-1 py-0.5 rounded">{file.mount_path}</code>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 命令预览 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Terminal className="h-5 w-5"/>
                            命令预览
                        </CardTitle>
                        <CardDescription>根据配置生成的示例命令</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="bg-black text-white p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                <pre className="whitespace-pre-wrap">{generateExampleCommand()}</pre>
                            </div>
                            <div className="flex justify-end">
                                <Button variant="outline" size="sm" onClick={() => copyToClipboard(generateExampleCommand())}>
                                    <Copy className="h-4 w-4 mr-2"/>
                                    复制命令
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
