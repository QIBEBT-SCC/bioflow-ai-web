"use client"

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Copy, Globe, FileText, HardDrive, Code, Terminal, Layers, Tag, Folder} from "lucide-react"
import {ImageConfig} from "@/types/tool.tsx";
import {useCreateToolStore} from "@/stores/toolStore.tsx";
import {useTranslation} from "react-i18next";


export function CreateConfirmationStep() {
    const {t} = useTranslation();
    const {currentImage, toolConfig} = useCreateToolStore()

    // 复制命令到剪贴板
    const copyToClipboard = (text: string) => {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                alert(t('tool.create.confirm.copy_success'))
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
                <h2 className="text-xl font-semibold mb-2">{t('tool.create.confirm.title')}</h2>
                <p className="text-muted-foreground">{t('tool.create.confirm.subtitle')}</p>
            </div>

            <div className="space-y-6">
                {/* 镜像信息 */}
                {currentImage && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HardDrive className="h-5 w-5"/>
                                {t('tool.create.confirm.selected_image')}
                            </CardTitle>
                            <CardDescription>{t('tool.create.confirm.image_info')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium">{currentImage.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary">{currentImage.version}</Badge>
                                        <Badge variant="outline" className="text-xs font-mono">
                                            {currentImage.image.namespace}/{currentImage.image.repository}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {currentImage.homepage && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => window.open(currentImage.homepage, "_blank")}
                                        >
                                            <Globe className="h-4 w-4"/>
                                        </Button>
                                    )}
                                    {currentImage.paper_link && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => window.open(currentImage.paper_link, "_blank")}
                                        >
                                            <FileText className="h-4 w-4"/>
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{currentImage.description}</p>
                            <div className="bg-muted/30 p-3 rounded-md">
                                <p className="text-xs text-muted-foreground mb-1">{t('tool.create.confirm.docker_image_address')}</p>
                                <code className="text-sm">{getImageName(currentImage.image)}</code>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 工具配置概览 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Code className="h-5 w-5"/>
                            {t('tool.create.confirm.tool_config_overview')}
                        </CardTitle>
                        <CardDescription>{t('tool.create.confirm.tool_config_info')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* 基本信息 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">{t('tool.create.confirm.tool_name')}</p>
                                <p className='font-medium'>{toolConfig.name || t('tool.create.confirm.not_set')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">{t('tool.create.confirm.image_uid')}</p>
                                <code className="text-sm bg-muted px-2 py-1 rounded">{toolConfig.image_uid}</code>
                            </div>
                        </div>

                        {toolConfig.description && (
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">{t('tool.create.confirm.description')}</p>
                                <p className="text-sm">{toolConfig.description}</p>
                            </div>
                        )}

                        {/* 命令模板 */}
                        <div className="space-y-2">
                            <p className='text-sm text-muted-foreground'>{t('tool.create.confirm.command_template')}</p>
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
                                <p className='text-sm text-muted-foreground'>{t('tool.create.confirm.static_params')}</p>
                                <div className="bg-muted/30 p-3 rounded-md">
                                    <code className="text-sm">{toolConfig.static_params}</code>
                                </div>
                            </div>
                        )}

                        {/* 配置选项 */}
                        <div className="space-y-2">
                            <p className='text-sm text-muted-foreground'>{t('tool.create.confirm.config_options')}</p>
                            <div className="bg-muted/30 p-3 rounded-md">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center">
                                        <Badge variant={toolConfig.mkdir_output ? "default" : "outline"} className="mr-3">
                                            {toolConfig.mkdir_output ? t('tool.create.confirm.yes') : t('tool.create.confirm.no')}
                                        </Badge>
                                        <span className='text-sm'>{t('tool.create.confirm.create_output_dir')}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Badge variant={toolConfig.use_temp_dir ? "default" : "outline"} className="mr-3">
                                            {toolConfig.use_temp_dir ? t('tool.create.confirm.yes') : t('tool.create.confirm.no')}
                                        </Badge>
                                        <span className='text-sm'>{t('tool.create.confirm.use_temp_dir')}</span>
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
                            {t('tool.create.confirm.metadata')}
                        </CardTitle>
                        <CardDescription>{t('tool.create.confirm.metadata_info')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">{t('tool.create.confirm.tool_group')}</p>
                                <div className="flex items-center gap-2">
                                    <Folder className="h-4 w-4 text-muted-foreground"/>
                                    <span className='text-sm'>{t('tool.create.confirm.group_id')} {toolConfig.group_id}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">{t('tool.create.confirm.tags')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {toolConfig.tags.length > 0 ? (
                                        toolConfig.tags.map((tag) => (
                                            <Badge key={tag.id} variant="secondary">
                                                {tag.name}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className='text-sm text-muted-foreground'>{t('tool.create.confirm.no_tags')}</span>
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
                                {t('tool.create.confirm.dynamic_params_config')}
                                <Badge variant="outline">{toolConfig.dynamic_params.length}</Badge>
                            </CardTitle>
                            <CardDescription>{t('tool.create.confirm.dynamic_params_info')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {toolConfig.dynamic_params
                                    .sort((a, b) => (a.index || 0) - (b.index || 0))
                                    .map((param, index) => (
                                        <div key={index} className="p-3 rounded-lg border border-l-4 border-l-primary">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className='font-medium'>{t('tool.create.confirm.param')} {(param.index || 0) + 1}</span>
                                                {param.required && <Badge className='bg-red-500'>{t('tool.create.confirm.required')}</Badge>}
                                                {param.is_position && <Badge className='bg-blue-500'>{t('tool.create.confirm.position_param')}</Badge>}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <span className='text-muted-foreground'>{t('tool.create.confirm.command_format')} </span>
                                                    <code className="bg-muted px-1 py-0.5 rounded">{param.command}</code>
                                                </div>
                                                {param.description && (
                                                    <div>
                                                        <span className='text-muted-foreground'>{t('tool.create.confirm.description')} </span>
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
                                {t('tool.create.confirm.file_mounts')}
                                <Badge variant="outline">{toolConfig.file_mounts.length}</Badge>
                            </CardTitle>
                            <CardDescription>{t('tool.create.confirm.file_mounts_info')}</CardDescription>
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
                                                {file.file_type === "INPUT" ? t('tool.create.confirm.input') : t('tool.create.confirm.output')}
                                            </Badge>
                                            {file.is_report && <Badge variant='outline'>{t('tool.create.confirm.report')}</Badge>}
                                            {file.is_log && <Badge variant='outline'>{t('tool.create.confirm.log')}</Badge>}
                                        </div>
                                        {file.description && <p className="text-sm text-muted-foreground mb-2">{file.description}</p>}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className='text-muted-foreground'>{t('tool.create.confirm.file_path')} </span>
                                                <code className="bg-muted px-1 py-0.5 rounded">{file.file_path}</code>
                                            </div>
                                            <div>
                                                <span className='text-muted-foreground'>{t('tool.create.confirm.mount_path')} </span>
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
                            {t('tool.create.confirm.command_preview')}
                        </CardTitle>
                        <CardDescription>{t('tool.create.confirm.command_preview_info')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="bg-black text-white p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                <pre className="whitespace-pre-wrap">{generateExampleCommand()}</pre>
                            </div>
                            <div className="flex justify-end">
                                <Button variant="outline" size="sm" onClick={() => copyToClipboard(generateExampleCommand())}>
                                    <Copy className='h-4 w-4 mr-2'/>
                                    {t('tool.create.confirm.copy_command')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
