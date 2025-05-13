"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft, Plus, Trash2, HelpCircle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {Link} from "react-router-dom";

// 参数类型枚举
enum ParamType {
    INPUT = "INPUT",
    OUTPUT = "OUTPUT",
}

// 参数定义接口
interface ParamDefine {
    name: string
    command: string
    is_file: boolean
    mount_path?: string
    param_type: ParamType
}

// 输出文件接口
interface OutputFile {
    name: string
    file_path: string
    mount_path: string
}

// 工具创建接口
interface DockerToolCreate {
    name: string
    repository: string
    tag: string
    description: string
    command_template: string
    required_params: ParamDefine[]
    optional_params: string
    output_files: OutputFile[]
    mkdir_output: boolean
    use_temp_dir: boolean
    help_command: string
}

export function AddToolPage() {

    // 初始化工具状态
    const [tool, setTool] = useState<DockerToolCreate>({
        name: "",
        repository: "",
        tag: "",
        description: "",
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
                    name: "",
                    command: "",
                    is_file: false,
                    mount_path: "",
                    param_type: ParamType.INPUT,
                },
            ],
        })
    }

    // 更新必需参数
    const updateRequiredParam = (index: number, field: keyof ParamDefine, value: any) => {
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
                    mount_path: "",
                },
            ],
        })
    }

    // 更新输出文件
    const updateOutputFile = (index: number, field: keyof OutputFile, value: string) => {
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

        try {
            // 这里添加向后端发送数据的逻辑
            console.log("提交的工具配置:", tool)

            // 模拟API调用
            // const response = await fetch('/api/tools', {
            //   method: 'POST',
            //   headers: {
            //     'Content-Type': 'application/json',
            //   },
            //   body: JSON.stringify(tool),
            // });

            // if (response.ok) {
            //   router.push('/tools');
            // }

            // 暂时直接跳转
            alert("工具创建成功！")
        } catch (error) {
            console.error("提交工具配置时出错:", error)
            alert("创建工具时出错，请重试")
        }
    }

    return (
        <div className="container mx-auto py-6 max-w-4xl">
            <div className="mb-6">
                <Link
                    to="/tools"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
                >
                    <ArrowLeft className="h-4 w-4 mr-1"/>
                    返回工具列表
                </Link>
                <h1 className="text-2xl font-bold">添加新工具</h1>
                <p className="text-muted-foreground mt-1">配置Docker容器工具以在工作流中使用</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">
                            基本信息
                            {tool.name && (
                                <Badge variant="outline" className="ml-2">
                                    {tool.name}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="params">
                            参数配置
                            {tool.required_params.length > 0 && (
                                <Badge variant="outline" className="ml-2">
                                    {tool.required_params.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="outputs">
                            输出文件
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
                                <CardTitle>基本信息</CardTitle>
                                <CardDescription>设置工具的基本信息和Docker配置</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">
                                            工具名称 <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            value={tool.name}
                                            onChange={(e) => setTool({ ...tool, name: e.target.value })}
                                            placeholder="例如: fastp"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="repository">
                                            Docker 仓库 <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="repository"
                                            value={tool.repository}
                                            onChange={(e) => setTool({ ...tool, repository: e.target.value })}
                                            placeholder="例如: staphb/fastp"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tag">
                                            标签 <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="tag"
                                            value={tool.tag}
                                            onChange={(e) => setTool({ ...tool, tag: e.target.value })}
                                            placeholder="例如: 0.24.0"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">描述</Label>
                                    <Textarea
                                        id="description"
                                        value={tool.description}
                                        onChange={(e) => setTool({ ...tool, description: e.target.value })}
                                        placeholder="工具的简要描述"
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="help_command">帮助命令</Label>
                                    <Input
                                        id="help_command"
                                        value={tool.help_command}
                                        onChange={(e) => setTool({ ...tool, help_command: e.target.value })}
                                        placeholder="例如: fastp --help"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="command_template">
                                        命令模板 <span className="text-red-500">*</span>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <HelpCircle className="h-4 w-4 inline-block ml-1 text-muted-foreground" />
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
                                        onChange={(e) => setTool({ ...tool, command_template: e.target.value })}
                                        placeholder="例如: fastp {required_params} {optional_params}&> /data/output/fastp.log"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="mkdir_output"
                                            checked={tool.mkdir_output}
                                            onCheckedChange={(checked) => setTool({ ...tool, mkdir_output: checked as boolean })}
                                        />
                                        <Label htmlFor="mkdir_output">创建输出目录</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="use_temp_dir"
                                            checked={tool.use_temp_dir}
                                            onCheckedChange={(checked) => setTool({ ...tool, use_temp_dir: checked as boolean })}
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
                                        <Label htmlFor="required_params" className="text-lg font-semibold">
                                            必要参数
                                        </Label>
                                        <Button type="button" onClick={addRequiredParam} size="sm" variant="outline">
                                            <Plus className="h-4 w-4 mr-2" />
                                            添加参数
                                        </Button>
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
                                                <Card key={index} className="overflow-hidden border-l-4 border-l-primary">
                                                    <CardHeader className="py-3 bg-muted/30">
                                                        <div className="flex justify-between items-center">
                                                            <CardTitle className="text-base">
                                                                参数 {index + 1}: {param.name || "未命名"}
                                                                {param.param_type === ParamType.INPUT && (
                                                                    <Badge className="ml-2 bg-blue-500">输入</Badge>
                                                                )}
                                                                {param.param_type === ParamType.OUTPUT && (
                                                                    <Badge className="ml-2 bg-green-500">输出</Badge>
                                                                )}
                                                                {param.is_file && (
                                                                    <Badge variant="outline" className="ml-2">
                                                                        文件
                                                                    </Badge>
                                                                )}
                                                            </CardTitle>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-muted-foreground hover:text-destructive"
                                                                onClick={() => removeRequiredParam(index)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="pt-4">
                                                        <div className="flex gap-4 mb-4">
                                                            <div className="space-y-2 flex-1/3">
                                                                <Label htmlFor={`param-name-${index}`}>
                                                                    参数名称 <span className="text-red-500">*</span>
                                                                </Label>
                                                                <Input
                                                                    id={`param-name-${index}`}
                                                                    value={param.name}
                                                                    onChange={(e) => updateRequiredParam(index, "name", e.target.value)}
                                                                    placeholder="例如: r1"
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="space-y-2 flex-1">
                                                                <Label htmlFor={`param-type-${index}`}>
                                                                    参数类型 <span className="text-red-500">*</span>
                                                                </Label>
                                                                <Select
                                                                    value={param.param_type}
                                                                    onValueChange={(value) => updateRequiredParam(index, "param_type", value)}
                                                                >
                                                                    <SelectTrigger id={`param-type-${index}`} className="w-full">
                                                                        <SelectValue placeholder="选择参数类型" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value={ParamType.INPUT}>输入</SelectItem>
                                                                        <SelectItem value={ParamType.OUTPUT}>输出</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2 flex flex-col flex-1 gap-y-2">
                                                                <Label htmlFor={`param-is-file-${index}`}>是文件</Label>
                                                                <Checkbox
                                                                    id={`param-is-file-${index}`}
                                                                    className="mx-3"
                                                                    checked={param.is_file}
                                                                    onCheckedChange={(checked) =>
                                                                        updateRequiredParam(index, "is_file", checked as boolean)
                                                                    }
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2 mb-4">
                                                            <Label htmlFor={`param-command-${index}`}>
                                                                命令 <span className="text-red-500">*</span>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <HelpCircle className="h-4 w-4 inline-block ml-1 text-muted-foreground" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p className="max-w-xs">
                                                                                使用 {"{参数名}"} 作为值的占位符，例如: -i {"{r1}"}
                                                                            </p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </Label>
                                                            <Input
                                                                id={`param-command-${index}`}
                                                                value={param.command}
                                                                onChange={(e) => updateRequiredParam(index, "command", e.target.value)}
                                                                placeholder="例如: -i {r1}"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor={`param-mount-path-${index}`}>挂载路径</Label>
                                                            <Input
                                                                id={`param-mount-path-${index}`}
                                                                value={param.mount_path || ""}
                                                                onChange={(e) => updateRequiredParam(index, "mount_path", e.target.value)}
                                                                placeholder="例如: /data/raw"
                                                            />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}

                                    <div className="space-y-2 mt-6 pt-6 border-t">
                                        <Label htmlFor="optional_params" className="text-lg font-semibold">
                                            可选参数
                                        </Label>
                                        <Textarea
                                            id="optional_params"
                                            value={tool.optional_params}
                                            onChange={(e) => setTool({ ...tool, optional_params: e.target.value })}
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
                                    <h2 className="text-lg font-semibold">输出文件</h2>
                                    <Button type="button" onClick={addOutputFile} size="sm" variant="outline">
                                        <Plus className="h-4 w-4 mr-2" />
                                        添加输出文件
                                    </Button>
                                </div>

                                {tool.output_files.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground border rounded-md bg-muted/30">
                                        尚未添加任何输出文件。点击"添加输出文件"按钮开始配置。
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {tool.output_files.map((file, index) => (
                                            <Card key={index} className="overflow-hidden border-l-4 border-l-green-500">
                                                <CardHeader className="py-3 bg-muted/30">
                                                    <div className="flex justify-between items-center">
                                                        <CardTitle className="text-base">
                                                            输出文件 {index + 1}: {file.name || "未命名"}
                                                        </CardTitle>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-destructive"
                                                            onClick={() => removeOutputFile(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="pt-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`output-name-${index}`}>
                                                                文件名称 <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Input
                                                                id={`output-name-${index}`}
                                                                value={file.name}
                                                                onChange={(e) => updateOutputFile(index, "name", e.target.value)}
                                                                placeholder="例如: r1"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`output-mount-path-${index}`}>
                                                                挂载路径 <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Input
                                                                id={`output-mount-path-${index}`}
                                                                value={file.mount_path}
                                                                onChange={(e) => updateOutputFile(index, "mount_path", e.target.value)}
                                                                placeholder="例如: /data/output"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor={`output-file-path-${index}`}>
                                                            文件路径 <span className="text-red-500">*</span>
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <HelpCircle className="h-4 w-4 inline-block ml-1 text-muted-foreground" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p className="max-w-xs">
                                                                            使用 {"{output_dir}"} 和 {"{name}"} 作为路径占位符
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </Label>
                                                        <Input
                                                            id={`output-file-path-${index}`}
                                                            value={file.file_path}
                                                            onChange={(e) => updateOutputFile(index, "file_path", e.target.value)}
                                                            placeholder="例如: {output_dir}/{name}_fastp_R1.fq.gz"
                                                            required
                                                        />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-between mt-8 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => {}}>
                        取消
                    </Button>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        <Save className="h-4 w-4 mr-2" />
                        保存工具
                    </Button>
                </div>
            </form>
        </div>
    )
}
