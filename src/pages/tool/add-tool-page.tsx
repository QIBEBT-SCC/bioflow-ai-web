"use client"

import type React from "react"

import {useState} from "react"
import {ArrowLeft, CirclePlusIcon, HelpCircle, Save} from "lucide-react"
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
import {type DockerToolCreate, type OutputFile, type ParamDefine, ParamType} from "@/types/tool"
import {useCreateTool} from "@/hooks/useTool.tsx";
import {TagSelector} from "@/components/tag-selector.tsx";
import {FileCard, ParamCard} from "@/components/tool/tool-setting-card.tsx";


export function AddToolPage() {
    const {t} = useTranslation();
    const {mutate: createTool, isPending} = useCreateTool();

    // 初始化工具状态
    const [tool, setTool] = useState<DockerToolCreate>({
        name: "",
        repository: "",
        tag: "",
        description: "",
        homepage: "",
        tool_tag: [],
        command_template: "",
        required_params: [],
        optional_params: "",
        output_files: [],
        mkdir_output: true,
        use_temp_dir: false,
        help_command: "",
    })

    // 添加必需参数
    const addRequiredParam = () => {
        setTool({
            ...tool,
            required_params: [
                ...tool.required_params,
                {
                    key: "",
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

    // 更新必需参数
    const updateRequiredParam = (index: number, field: keyof ParamDefine, value: string | number | boolean) => {
        const updatedParams = [...tool.required_params]
        updatedParams[index] = {...updatedParams[index], [field]: value}
        setTool({...tool, required_params: updatedParams})
    }

    // 删除必需参数
    const removeRequiredParam = (index: number) => {
        const updatedParams = [...tool.required_params]
        updatedParams.splice(index, 1)
        setTool({...tool, required_params: updatedParams})
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

    // 处理表单提交
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        console.log(tool)

        createTool(
            {tool},
            {
                onSuccess: () => {
                    alert("工具创建成功！")
                },
                onError: (e) => {
                    // 错误处理
                    console.error("提交工具配置时出错:", e)
                    alert("创建工具时出错，请重试")
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
                            <ArrowLeft className="h-4 w-4 mr-1"/>
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
                                    {tool.required_params.length > 0 && (
                                        <Badge variant="outline" className="ml-2">
                                            {tool.required_params.length}
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
                                            <Label htmlFor="help_command">{t("add_tool.homepage")}</Label>
                                            <Input
                                                id="home_page"
                                                value={tool.homepage}
                                                onChange={(e) => setTool({...tool, homepage: e.target.value})}
                                                placeholder="例如: https://github.com/OpenGene/fastp"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">描述</Label>
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
                                                onChange={(tags) => setTool({...tool, tool_tag: tags})}
                                                value={tool.tool_tag}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="help_command">帮助命令</Label>
                                            <Input
                                                id="help_command"
                                                value={tool.help_command}
                                                onChange={(e) => setTool({...tool, help_command: e.target.value})}
                                                placeholder="例如: fastp --help"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="command_template">
                                                命令模板 <span className="text-red-500">*</span>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <HelpCircle className="h-4 w-4 inline-block ml-1 text-muted-foreground"/>
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

                                            {tool.required_params.length === 0 ? (
                                                <div
                                                    className="text-center py-6 text-muted-foreground border rounded-md bg-muted/30"
                                                    id="required_params"
                                                >
                                                    尚未添加任何参数。点击"添加参数"按钮开始配置。
                                                </div>
                                            ) : (
                                                <div className="space-y-4" id="required_params">
                                                    {tool.required_params.map((param, index) => (
                                                        <ParamCard
                                                            index={index}
                                                            param={param}
                                                            update={updateRequiredParam}
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
                                                <Label htmlFor="optional_params" className="text-lg font-semibold">
                                                    可选参数
                                                </Label>
                                                <Textarea
                                                    id="optional_params"
                                                    value={tool.optional_params}
                                                    onChange={(e) => setTool({...tool, optional_params: e.target.value})}
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
                                <Save className="h-4 w-4 mr-2"/>
                                保存工具
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </SidebarInset>
    )
}
