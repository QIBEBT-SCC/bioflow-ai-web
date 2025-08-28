"use client"

import React from "react"

import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Textarea} from "@/components/ui/textarea"
import {Label} from "@/components/ui/label"
import {Checkbox} from "@/components/ui/checkbox"
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Plus, Trash2, HelpCircle, Tag, Folder} from "lucide-react"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Badge} from "@/components/ui/badge"
import {DockerToolCreate, FileMount, ParamDefine, ToolGroup, ToolImage, ToolTag} from "@/types/tool.tsx";

interface ToolConfigurationStepProps {
    toolConfig: DockerToolCreate
    setToolConfig: (config: DockerToolCreate) => void
    selectedImage: ToolImage | null
}

export function ToolConfigurationStep({toolConfig, setToolConfig, selectedImage}: ToolConfigurationStepProps) {
    // 模拟工具组数据
    const [toolGroups] = React.useState<ToolGroup[]>([
        {id: 1, name: "质量控制", parent_id: null, tool_count: 5},
        {id: 2, name: "序列比对", parent_id: null, tool_count: 8},
        {id: 3, name: "变异检测", parent_id: null, tool_count: 3},
        {id: 4, name: "数据预处理", parent_id: 1, tool_count: 2},
    ])

    // 模拟标签数据
    const [availableTags] = React.useState<ToolTag[]>([
        {id: 1, name: "生信工具"},
        {id: 2, name: "质量控制"},
        {id: 3, name: "序列分析"},
        {id: 4, name: "高通量测序"},
        {id: 5, name: "基因组学"},
    ])

    // 添加动态参数
    const addDynamicParam = () => {
        setToolConfig({
            ...toolConfig,
            dynamic_params: [
                ...toolConfig.dynamic_params,
                {
                    description: "",
                    command: "",
                    is_position: false,
                    index: toolConfig.dynamic_params.length,
                    required: true,
                },
            ],
        })
    }

    // 更新动态参数
    const updateDynamicParam = (index: number, field: keyof ParamDefine, value: string | number | boolean) => {
        const updatedParams = [...toolConfig.dynamic_params]
        updatedParams[index] = {...updatedParams[index], [field]: value}
        setToolConfig({...toolConfig, dynamic_params: updatedParams})
    }

    // 删除动态参数
    const removeDynamicParam = (index: number) => {
        const updatedParams = [...toolConfig.dynamic_params]
        updatedParams.splice(index, 1)
        // 重新排序索引
        updatedParams.forEach((param, idx) => {
            param.index = idx
        })
        setToolConfig({...toolConfig, dynamic_params: updatedParams})
    }

    // 添加文件挂载
    const addFileMount = () => {
        setToolConfig({
            ...toolConfig,
            file_mounts: [
                ...toolConfig.file_mounts,
                {
                    name: "",
                    description: "",
                    file_path: "",
                    file_type: "OUTPUT",
                    is_report: false,
                    is_log: false,
                    mount_path: "",
                },
            ],
        })
    }

    // 更新文件挂载
    const updateFileMount = (index: number, field: keyof FileMount, value: string | boolean) => {
        const updatedFiles = [...toolConfig.file_mounts]
        updatedFiles[index] = {...updatedFiles[index], [field]: value}
        setToolConfig({...toolConfig, file_mounts: updatedFiles})
    }

    // 删除文件挂载
    const removeFileMount = (index: number) => {
        const updatedFiles = [...toolConfig.file_mounts]
        updatedFiles.splice(index, 1)
        setToolConfig({...toolConfig, file_mounts: updatedFiles})
    }

    // 添加标签
    const addTag = (tag: ToolTag) => {
        if (!toolConfig.tags.find((t) => t.id === tag.id)) {
            setToolConfig({
                ...toolConfig,
                tags: [...toolConfig.tags, tag],
            })
        }
    }

    // 移除标签
    const removeTag = (tagId: number) => {
        setToolConfig({
            ...toolConfig,
            tags: toolConfig.tags.filter((t) => t.id !== tagId),
        })
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">配置工具参数</h2>
                <p className="text-muted-foreground">设置工具的命令模板、参数和输出文件</p>
                {selectedImage && (
                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">基于镜像:</span>
                        <Badge variant="outline">{selectedImage.name}</Badge>
                        <Badge variant="secondary">{selectedImage.version}</Badge>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="basic">
                            基本信息
                            {toolConfig.name && (
                                <Badge variant="outline" className="ml-2">
                                    {toolConfig.name}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="params">
                            动态参数
                            {toolConfig.dynamic_params.length > 0 && (
                                <Badge variant="outline" className="ml-2">
                                    {toolConfig.dynamic_params.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="files">
                            文件挂载
                            {toolConfig.file_mounts.length > 0 && (
                                <Badge variant="outline" className="ml-2">
                                    {toolConfig.file_mounts.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="meta">
                            元信息
                            {toolConfig.tags.length > 0 && (
                                <Badge variant="outline" className="ml-2">
                                    {toolConfig.tags.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* 基本信息部分 */}
                    <TabsContent value="basic">
                        <Card>
                            <CardHeader>
                                <CardTitle>基本信息</CardTitle>
                                <CardDescription>设置工具的基本信息和命令配置</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        工具名称 <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={toolConfig.name}
                                        onChange={(e) => setToolConfig({...toolConfig, name: e.target.value})}
                                        placeholder="例如: fastp"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">描述</Label>
                                    <Textarea
                                        id="description"
                                        value={toolConfig.description}
                                        onChange={(e) => setToolConfig({...toolConfig, description: e.target.value})}
                                        placeholder="工具的简要描述"
                                        rows={3}
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
                                                        使用 {"{dynamic_params}"} 和 {"{static_params}"} 作为参数占位符
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Label>
                                    <Input
                                        id="command_template"
                                        value={toolConfig.command_template}
                                        onChange={(e) => setToolConfig({...toolConfig, command_template: e.target.value})}
                                        placeholder="例如: fastp {dynamic_params} {static_params} &> /data/output/fastp.log"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="static_params">静态参数</Label>
                                    <Textarea
                                        id="static_params"
                                        value={toolConfig.static_params}
                                        onChange={(e) => setToolConfig({...toolConfig, static_params: e.target.value})}
                                        placeholder="例如: --thread 8 --html /data/output/fastp.html"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="mkdir_output"
                                            checked={toolConfig.mkdir_output}
                                            onCheckedChange={(checked) => setToolConfig({...toolConfig, mkdir_output: checked as boolean})}
                                        />
                                        <Label htmlFor="mkdir_output">创建输出目录</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="use_temp_dir"
                                            checked={toolConfig.use_temp_dir}
                                            onCheckedChange={(checked) => setToolConfig({...toolConfig, use_temp_dir: checked as boolean})}
                                        />
                                        <Label htmlFor="use_temp_dir">使用临时目录</Label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 动态参数配置部分 */}
                    <TabsContent value="params">
                        <Card>
                            <CardHeader>
                                <CardTitle>动态参数配置</CardTitle>
                                <CardDescription>配置工具的动态参数，这些参数可以在运行时指定</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-lg font-semibold">动态参数</Label>
                                    </div>

                                    {toolConfig.dynamic_params.length === 0 ? (
                                        <div className="text-center py-6 text-muted-foreground border rounded-md bg-muted/30">
                                            尚未添加任何动态参数。点击"添加参数"按钮开始配置。
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {toolConfig.dynamic_params.map((param, index) => (
                                                <Card key={index} className="overflow-hidden border-l-4 border-l-primary">
                                                    <CardHeader className="py-3 bg-muted/30">
                                                        <div className="flex justify-between items-center">
                                                            <CardTitle className="text-base">
                                                                参数 {index + 1}
                                                                {param.required && <Badge className="ml-2 bg-red-500">必需</Badge>}
                                                                {param.is_position && <Badge className="ml-2 bg-blue-500">位置参数</Badge>}
                                                            </CardTitle>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-muted-foreground hover:text-destructive"
                                                                onClick={() => removeDynamicParam(index)}
                                                            >
                                                                <Trash2 className="h-4 w-4"/>
                                                            </Button>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="pt-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor={`param-description-${index}`}>描述</Label>
                                                                <Input
                                                                    id={`param-description-${index}`}
                                                                    value={param.description || ""}
                                                                    onChange={(e) => updateDynamicParam(index, "description", e.target.value)}
                                                                    placeholder="参数描述"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor={`param-index-${index}`}>索引位置</Label>
                                                                <Input
                                                                    id={`param-index-${index}`}
                                                                    type="number"
                                                                    value={param.index || 0}
                                                                    onChange={(e) =>
                                                                        updateDynamicParam(index, "index", Number.parseInt(e.target.value) || 0)
                                                                    }
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2 mb-4">
                                                            <Label htmlFor={`param-command-${index}`}>
                                                                命令格式 <span className="text-red-500">*</span>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <HelpCircle
                                                                                className="h-4 w-4 inline-block ml-1 text-muted-foreground"/>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p className="max-w-xs">
                                                                                定义参数在命令中的格式，例如: -i {"{value}"} 或
                                                                                --input={"{value}"}
                                                                            </p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </Label>
                                                            <Input
                                                                id={`param-command-${index}`}
                                                                value={param.command}
                                                                onChange={(e) => updateDynamicParam(index, "command", e.target.value)}
                                                                placeholder="例如: -i {value}"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="flex gap-4">
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`param-required-${index}`}
                                                                    checked={param.required}
                                                                    onCheckedChange={(checked) =>
                                                                        updateDynamicParam(index, "required", checked as boolean)
                                                                    }
                                                                />
                                                                <Label htmlFor={`param-required-${index}`}>必需参数</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`param-position-${index}`}
                                                                    checked={param.is_position}
                                                                    onCheckedChange={(checked) =>
                                                                        updateDynamicParam(index, "is_position", checked as boolean)
                                                                    }
                                                                />
                                                                <Label htmlFor={`param-position-${index}`}>位置参数</Label>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex justify-center mt-4">
                                        <Button type="button" onClick={addDynamicParam} variant="outline" className="w-full bg-transparent">
                                            <Plus className="h-4 w-4 mr-2"/>
                                            添加动态参数
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 文件挂载部分 */}
                    <TabsContent value="files">
                        <Card>
                            <CardHeader>
                                <CardTitle>文件挂载配置</CardTitle>
                                <CardDescription>配置工具的输入输出文件挂载</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-semibold">文件挂载</h2>
                                </div>

                                {toolConfig.file_mounts.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground border rounded-md bg-muted/30">
                                        尚未添加任何文件挂载。点击"添加文件挂载"按钮开始配置。
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {toolConfig.file_mounts.map((file, index) => (
                                            <Card
                                                key={index}
                                                className={`overflow-hidden border-l-4 ${
                                                    file.file_type === "INPUT" ? "border-l-blue-500" : "border-l-green-500"
                                                }`}
                                            >
                                                <CardHeader className="py-3 bg-muted/30">
                                                    <div className="flex justify-between items-center">
                                                        <CardTitle className="text-base">
                                                            文件 {index + 1}: {file.name || "未命名"}
                                                            <Badge
                                                                className={`ml-2 ${file.file_type === "INPUT" ? "bg-blue-500" : "bg-green-500"}`}>
                                                                {file.file_type === "INPUT" ? "输入" : "输出"}
                                                            </Badge>
                                                            {file.is_report && (
                                                                <Badge variant="outline" className="ml-2">
                                                                    报告
                                                                </Badge>
                                                            )}
                                                            {file.is_log && (
                                                                <Badge variant="outline" className="ml-2">
                                                                    日志
                                                                </Badge>
                                                            )}
                                                        </CardTitle>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-destructive"
                                                            onClick={() => removeFileMount(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="pt-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`file-name-${index}`}>
                                                                文件名称 <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Input
                                                                id={`file-name-${index}`}
                                                                value={file.name}
                                                                onChange={(e) => updateFileMount(index, "name", e.target.value)}
                                                                placeholder="例如: input_r1"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`file-type-${index}`}>
                                                                文件类型 <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Select
                                                                value={file.file_type}
                                                                onValueChange={(value) => updateFileMount(index, "file_type", value)}
                                                            >
                                                                <SelectTrigger id={`file-type-${index}`}>
                                                                    <SelectValue placeholder="选择文件类型"/>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="INPUT">输入文件</SelectItem>
                                                                    <SelectItem value="OUTPUT">输出文件</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 mb-4">
                                                        <Label htmlFor={`file-description-${index}`}>描述</Label>
                                                        <Input
                                                            id={`file-description-${index}`}
                                                            value={file.description || ""}
                                                            onChange={(e) => updateFileMount(index, "description", e.target.value)}
                                                            placeholder="文件描述"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`file-path-${index}`}>
                                                                文件路径 <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Input
                                                                id={`file-path-${index}`}
                                                                value={file.file_path}
                                                                onChange={(e) => updateFileMount(index, "file_path", e.target.value)}
                                                                placeholder="例如: {output_dir}/result.txt"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`mount-path-${index}`}>
                                                                挂载路径 <span className="text-red-500">*</span>
                                                            </Label>
                                                            <Input
                                                                id={`mount-path-${index}`}
                                                                value={file.mount_path}
                                                                onChange={(e) => updateFileMount(index, "mount_path", e.target.value)}
                                                                placeholder="例如: /data/output"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-4">
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`file-report-${index}`}
                                                                checked={file.is_report}
                                                                onCheckedChange={(checked) => updateFileMount(index, "is_report", checked as boolean)}
                                                            />
                                                            <Label htmlFor={`file-report-${index}`}>报告文件</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`file-log-${index}`}
                                                                checked={file.is_log}
                                                                onCheckedChange={(checked) => updateFileMount(index, "is_log", checked as boolean)}
                                                            />
                                                            <Label htmlFor={`file-log-${index}`}>日志文件</Label>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-center mt-4">
                                    <Button type="button" onClick={addFileMount} variant="outline" className="w-full bg-transparent">
                                        <Plus className="h-4 w-4 mr-2"/>
                                        添加文件挂载
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 元信息部分 */}
                    <TabsContent value="meta">
                        <Card>
                            <CardHeader>
                                <CardTitle>元信息配置</CardTitle>
                                <CardDescription>设置工具的分组和标签信息</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="group_id">
                                        工具分组 <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={toolConfig.group_id.toString()}
                                        onValueChange={(value) => setToolConfig({...toolConfig, group_id: Number.parseInt(value)})}
                                    >
                                        <SelectTrigger id="group_id">
                                            <SelectValue placeholder="选择工具分组"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {toolGroups.map((group) => (
                                                <SelectItem key={group.id} value={group.id.toString()}>
                                                    <div className="flex items-center gap-2">
                                                        <Folder className="h-4 w-4"/>
                                                        {group.name}
                                                        <Badge variant="outline" className="text-xs">
                                                            {group.tool_count}
                                                        </Badge>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>工具标签</Label>
                                    <div className="space-y-4">
                                        {/* 已选择的标签 */}
                                        {toolConfig.tags.length > 0 && (
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-2">已选择的标签:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {toolConfig.tags.map((tag) => (
                                                        <Badge
                                                            key={tag.id}
                                                            variant="default"
                                                            className="cursor-pointer"
                                                            onClick={() => removeTag(tag.id)}
                                                        >
                                                            {tag.name}
                                                            <span className="ml-1">×</span>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 可选择的标签 */}
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-2">可选择的标签:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {availableTags
                                                    .filter((tag) => !toolConfig.tags.find((t) => t.id === tag.id))
                                                    .map((tag) => (
                                                        <Badge
                                                            key={tag.id}
                                                            variant="outline"
                                                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                                            onClick={() => addTag(tag)}
                                                        >
                                                            <Tag className="h-3 w-3 mr-1"/>
                                                            {tag.name}
                                                        </Badge>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
