"use client"

import type React from "react"

import {useState} from "react"
import {ArrowLeftIcon, CirclePlusIcon, HelpCircleIcon, SaveIcon, SparklesIcon} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Textarea} from "@/components/ui/textarea"
import {Label} from "@/components/ui/label"
import {Checkbox} from "@/components/ui/checkbox"
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Badge} from "@/components/ui/badge"
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
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
import {AIGenProp, type DockerToolCreate, EventType, type OutputFile, type ParamDefine, ParamType, ToolSSEEventData} from "@/types/tool"
import {useCreateTool, useToolTagList} from "@/hooks/use-tool.tsx";
import {TagSelector} from "@/components/tag-selector.tsx";
import {FileCard, ParamCard} from "@/components/tool/tool-setting-card.tsx";
import {toast} from "sonner";
import {toolApi} from "@/services/api"


export function AddToolPage() {
    const {t} = useTranslation();
    const {mutate: createTool, isPending} = useCreateTool();
    const {data: availableTags = []} = useToolTagList();

    const [isGenerating, setIsGenerating] = useState(false);

    // 初始化工具状态
    const [tool, setTool] = useState<DockerToolCreate>({
        name: "",
        repository: "",
        tag: "",
        description: "",
        homepage: "",
        tool_tag: [],
        command_template: "",
        dynamic_params: [],
        static_params: "",
        output_files: [],
        mkdir_output: true,
        use_temp_dir: false,
        help_command: "",
    })

    // 添加动态参数
    const addRequiredParam = () => {
        setTool({
            ...tool,
            dynamic_params: [
                ...tool.dynamic_params,
                {
                    name: "",
                    command: "",
                    description: "",
                    is_file: true,
                    mount_path: "",
                    param_type: ParamType.INPUT,
                },
            ],
        })
    }

    // 更新动态参数
    const updateDynamicParam = (index: number, field: keyof ParamDefine, value: string | number | boolean) => {
        const updatedParams = [...tool.dynamic_params]
        updatedParams[index] = {...updatedParams[index], [field]: value}
        setTool({...tool, dynamic_params: updatedParams})
    }

    // 删除动态参数
    const removeRequiredParam = (index: number) => {
        const updatedParams = [...tool.dynamic_params]
        updatedParams.splice(index, 1)
        setTool({...tool, dynamic_params: updatedParams})
    }

    // 添加输出文件
    const addOutputFile = () => {
        setTool({
            ...tool,
            output_files: [
                ...tool.output_files,
                {
                    name: "",
                    file_path: "",
                    is_report: false,
                    is_log: false,
                    mount_path: "/data/output",
                },
            ],
        })
    }

    // 更新输出文件
    const updateOutputFile = (index: number, field: keyof OutputFile, value: string | number | boolean) => {
        const updatedFiles = [...tool.output_files]
        updatedFiles[index] = {...updatedFiles[index], [field]: value}
        setTool({...tool, output_files: updatedFiles})
    }

    // 删除输出文件
    const removeOutputFile = (index: number) => {
        const updatedFiles = [...tool.output_files]
        updatedFiles.splice(index, 1)
        setTool({...tool, output_files: updatedFiles})
    }

    // AI生成帮助命令
    const handleGenerateHelp = async () => {
        if (!tool.repository || !tool.tag) {
            toast.warning("请先填写Docker仓库信息");
            return;
        }

        if (!tool.help_command) {
            toast.warning('请先填写帮助指令');
            return;
        }

        setIsGenerating(true);
        const prop: AIGenProp = {
            name: tool.name,
            description: tool.description,
            help_command: tool.help_command,
            repository: tool.repository,
            tag: tool.tag
        }

        toolApi.generateToolConfig(
            prop,
            (event: ToolSSEEventData) => {
                switch (event.event) {
                    case EventType.LOADING:
                        toast.info(`${typeof event.data === 'string' ? event.data : '正在加载配置'}`, {duration: Infinity})
                        break;
                    case EventType.GENERATING:
                        toast.info(`${typeof event.data === 'string' ? event.data : '正在生成'}`, {duration: Infinity})
                        break;
                    case EventType.SUCCESS:
                        toast.dismiss();
                        toast.success('生成完毕')
                        if (typeof event.data !== 'string') {
                            setTool({
                                ...tool,
                                name: event.data.name,
                                command_template: event.data.command_template,
                                description: event.data.description,
                                dynamic_params: event.data.dynamic_params,
                                mkdir_output: event.data.mkdir_output,
                                output_files: event.data.output_files,
                                static_params: event.data.static_params,
                                use_temp_dir: event.data.use_temp_dir
                            })
                        }
                        break;
                    case EventType.ERROR:
                        setIsGenerating(false);
                        toast.error(`${typeof event.data === 'string' ? event.data : '生成失败'}`);
                        break;
                }
            }
        ).then(() => {
            setIsGenerating(false)
        });
    };

    // 处理表单提交
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        createTool(
            {tool},
            {
                onSuccess: () => {
                    toast.success("工具创建成功！")
                },
                onError: (e) => {
                    // 错误处理
                    console.error("提交工具配置时出错:", e)
                    toast.error("创建工具时出错，请重试")
                }
            }
        );
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
                                    <Link to="/tool">
                                        Tools
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block"/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Add Tool</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto py-6 max-w-4xl">
                    <div className="mb-6">
                        <Link
                            to="/tool"
                            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
                        >
                            <ArrowLeftIcon className="h-4 w-4 mr-1"/>
                            {t("add_tool.back")}
                        </Link>
                        <h1 className="text-2xl font-bold">{t("add_tool.title")}</h1>
                        <p className="text-muted-foreground mt-1">{t("add_tool.sub_title")}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic">
                                    {t("add_tool.base_info")}
                                    {tool.name && (
                                        <Badge variant="outline" className="ml-2">
                                            {tool.name}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="params">
                                    {t("add_tool.param_setting")}
                                    {tool.dynamic_params.length > 0 && (
                                        <Badge variant="outline" className="ml-2">
                                            {tool.dynamic_params.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="outputs">
                                    {t("add_tool.file_output")}
                                    {tool.output_files.length > 0 && (
                                        <Badge variant="outline" className="ml-2">
                                            {tool.output_files.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            {/* 基本信息部分 */}
                            <TabsContent value="basic">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t("add_tool.base_info")}</CardTitle>
                                        <CardDescription>{t("add_tool.base_info_desc")}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">
                                                    {t("add_tool.tool_name")}
                                                    <span className="text-red-500"> *</span>
                                                </Label>
                                                <Input
                                                    id="name"
                                                    value={tool.name}
                                                    onChange={(e) => setTool({...tool, name: e.target.value})}
                                                    placeholder={t("add_tool.tool_name_placeholder")}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="repository">
                                                    {t("add_tool.docker_repo")}
                                                    <span className="text-red-500"> *</span>
                                                </Label>
                                                <Input
                                                    id="repository"
                                                    value={tool.repository}
                                                    onChange={(e) => setTool({...tool, repository: e.target.value})}
                                                    placeholder={t("add_tool.docker_repo_placeholder")}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="tag">
                                                    {t("add_tool.docker_tag")}
                                                    <span className="text-red-500"> *</span>
                                                </Label>
                                                <Input
                                                    id="tag"
                                                    value={tool.tag}
                                                    onChange={(e) => setTool({...tool, tag: e.target.value})}
                                                    placeholder={t("add_tool.docker_tag_placeholder")}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>{t("add_tool.homepage")}</Label>
                                            <Input
                                                id="home_page"
                                                value={tool.homepage}
                                                onChange={(e) => setTool({...tool, homepage: e.target.value})}
                                                placeholder="例如: https://github.com/OpenGene/fastp"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>描述</Label>
                                            <Textarea
                                                id="description"
                                                value={tool.description}
                                                onChange={(e) => setTool({...tool, description: e.target.value})}
                                                placeholder="工具的简要描述"
                                                rows={3}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>{t("add_tool.tags")}</Label>
                                            <TagSelector
                                                availableTags={availableTags}
                                                onChange={(tags) => setTool({...tool, tool_tag: tags})}
                                                value={tool.tool_tag}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>帮助命令</Label>
                                            <div className="flex flex-row justify-between gap-2">
                                                <Input
                                                    id="help_command"
                                                    value={tool.help_command}
                                                    onChange={(e) => setTool({...tool, help_command: e.target.value})}
                                                    placeholder="例如: fastp --help"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={handleGenerateHelp}
                                                    disabled={isGenerating}
                                                    className={`relative transition-all duration-200 hover:scale-105 ${
                                                        isGenerating
                                                            ? 'border-2 border-gradient-to-r animate-pulse'
                                                            : 'border-2'
                                                    }`}
                                                    style={{
                                                        borderImage: isGenerating
                                                            ? 'linear-gradient(45deg, rgb(59 130 246), rgb(147 51 234), rgb(236 72 153)) 1'
                                                            : 'linear-gradient(45deg, rgb(59 130 246), rgb(147 51 234), rgb(236 72 153)) 1'
                                                    }}
                                                >
                                                    <SparklesIcon
                                                        className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`}
                                                    />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="command_template">
                                                命令模板 <span className="text-red-500">*</span>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <HelpCircleIcon className="h-4 w-4 inline-block ml-1 text-muted-foreground"/>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="max-w-xs">
                                                                使用 {"{required_params}"} 和 {"{optional_params}"} 作为参数占位符
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </Label>
                                            <Input
                                                id="command_template"
                                                value={tool.command_template}
                                                onChange={(e) => setTool({...tool, command_template: e.target.value})}
                                                placeholder="例如: fastp {required_params} {optional_params}&> /data/output/fastp.log"
                                                required
                                            />
                                        </div>

                                        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="mkdir_output"
                                                    checked={tool.mkdir_output}
                                                    onCheckedChange={(checked) => setTool({...tool, mkdir_output: checked as boolean})}
                                                />
                                                <Label htmlFor="mkdir_output">创建输出目录</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="use_temp_dir"
                                                    checked={tool.use_temp_dir}
                                                    onCheckedChange={(checked) => setTool({...tool, use_temp_dir: checked as boolean})}
                                                />
                                                <Label htmlFor="use_temp_dir">使用临时目录</Label>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* 参数配置部分 */}
                            <TabsContent value="params">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>参数配置</CardTitle>
                                        <CardDescription>配置工具所需的参数和可选参数</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-lg font-semibold">
                                                    必要参数
                                                </Label>
                                            </div>

                                            {tool.dynamic_params.length === 0 ? (
                                                <div
                                                    className="text-center py-6 text-muted-foreground border rounded-md bg-muted/30"
                                                    id="required_params"
                                                >
                                                    尚未添加任何参数。点击"添加参数"按钮开始配置。
                                                </div>
                                            ) : (
                                                <div className="space-y-4" id="required_params">
                                                    {tool.dynamic_params.map((param, index) => (
                                                        <ParamCard
                                                            index={index}
                                                            param={param}
                                                            update={updateDynamicParam}
                                                            remove={removeRequiredParam}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex justify-center mt-4">
                                                <Button type="button" onClick={addRequiredParam} variant="outline" className="w-full">
                                                    <CirclePlusIcon className="h-4 w-4 mr-2"/>
                                                    添加参数
                                                </Button>
                                            </div>

                                            <div className="space-y-2 mt-6 pt-6 border-t">
                                                <Label htmlFor="static_params" className="text-lg font-semibold">
                                                    可选参数
                                                </Label>
                                                <Textarea
                                                    id="static_params"
                                                    value={tool.static_params}
                                                    onChange={(e) => setTool({...tool, static_params: e.target.value})}
                                                    placeholder="例如: --thread 8"
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* 输出文件部分 */}
                            <TabsContent value="outputs">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>输出文件配置</CardTitle>
                                        <CardDescription>配置工具生成的输出文件</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-lg font-semibold">输出文件</Label>
                                        </div>

                                        {tool.output_files.length === 0 ? (
                                            <div className="text-center py-6 text-muted-foreground border rounded-md bg-muted/30">
                                                尚未添加任何输出文件。点击"添加输出文件"按钮开始配置。
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {tool.output_files.map((file, index) => (
                                                    <FileCard
                                                        index={index}
                                                        file={file}
                                                        update={updateOutputFile}
                                                        remove={removeOutputFile}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex justify-center mt-4">
                                            <Button type="button" onClick={addOutputFile} variant="outline" className="w-full">
                                                <CirclePlusIcon className="h-4 w-4 mr-2"/>
                                                添加输出文件
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-between mt-8 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => {
                            }}>
                                取消
                            </Button>
                            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isPending}>
                                <SaveIcon className="h-4 w-4 mr-2"/>
                                保存工具
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </SidebarInset>
    )
}
