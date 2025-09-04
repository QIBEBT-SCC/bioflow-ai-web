"use client"

import {useState, useEffect} from "react"

import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Textarea} from "@/components/ui/textarea"
import {Label} from "@/components/ui/label"
import {Checkbox} from "@/components/ui/checkbox"
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {PlusIcon, Trash2Icon, HelpCircleIcon, FolderIcon, CheckIcon, ChevronsUpDownIcon, EyeIcon} from "lucide-react"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Badge} from "@/components/ui/badge"
import {FileMount, ParamDefine, ToolTag, DockerToolCreate} from "@/types/tool.tsx";
import {TagSelector} from "@/components/tag-selector.tsx";
import {useImageDocuments, useDocument, useRunInImage, useToolGroupList, useToolTagList} from "@/hooks/use-tool.tsx";
import {useCreateToolStore} from "@/stores/toolStore.tsx";
import {cn} from "@/lib/utils";
import {toolConfigSSEService, ToolConfigEventHandlers} from "@/services/sse-api.tsx";
import {toast} from "sonner";

export function ToolConfigurationStep() {
    const [helpCommand, setHelpCommand] = useState<string>("");
    const [open, setOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [selectedDocUid, setSelectedDocUid] = useState<string>("");
    const [tags, setTags] = useState<ToolTag[]>([])
    const [isGenerating, setIsGenerating] = useState(false);

    const {currentImage, toolConfig, setToolConfig} = useCreateToolStore()

    const {data: existDocs = []} = useImageDocuments({uid: currentImage.uid ?? ""})
    const {data: toolGroups = []} = useToolGroupList()
    const {data: availableTags = []} = useToolTagList()

    // 同步标签状态
    useEffect(() => {
        setTags(toolConfig.tags || []);
    }, [toolConfig.tags]);

    useEffect(() => {
        if (toolConfig.help_doc_uid) {
            const existingDoc = existDocs.find(doc => doc.uid === toolConfig.help_doc_uid);
            if (existingDoc) {
                setHelpCommand(existingDoc.help_command);
            }
        } else {
            setHelpCommand("");
        }
    }, [toolConfig.help_doc_uid, existDocs])

    // 获取现有文档的预览内容
    const {data: existingDocContent} = useDocument({uid: selectedDocUid})

    // 运行新命令获取预览内容
    const runInImageMutation = useRunInImage()

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

    // 处理预览命令
    const handlePreviewCommand = () => {
        if (!helpCommand) return;

        // 检查是否是现有文档
        const existingDoc = existDocs.find(doc => doc.help_command === helpCommand);

        if (existingDoc) {
            // 如果是现有文档，设置uid并获取内容
            setSelectedDocUid(existingDoc.uid);
            setPreviewOpen(true);
        } else {
            // 如果是新命令，运行命令获取结果
            if (currentImage?.uid) {
                runInImageMutation.mutate({
                    uid: currentImage.uid,
                    command: helpCommand
                }, {
                    onSuccess: () => {
                        setPreviewOpen(true);
                    }
                });
            }
        }
    }

    // 生成工具配置
    const handleGenerateConfig = async () => {
        if (!currentImage?.uid) {
            toast.error("请先选择工具镜像");
            return;
        }

        if (!toolConfig.name || !toolConfig.name.trim()) {
            toast.error("请输入工具名称");
            return;
        }

        if (!toolConfig.description || !toolConfig.description.trim()) {
            toast.error("请输入工具描述");
            return;
        }

        setIsGenerating(true);

        try {
            const eventHandlers: ToolConfigEventHandlers = {
                onOpen: () => {
                    toast.info("开始生成工具配置...");
                },
                onGenerating: (data: string) => {
                    toast.info(data);
                },
                onSuccess: (configData: DockerToolCreate) => {
                    console.log('收到AI生成的配置数据:', configData);

                    // 更新工具配置
                    setToolConfig({
                        ...toolConfig,
                        description: configData.description || toolConfig.description,
                        command_template: configData.command_template || toolConfig.command_template,
                        dynamic_params: configData.dynamic_params || toolConfig.dynamic_params,
                        static_params: configData.static_params || toolConfig.static_params,
                        file_mounts: configData.file_mounts || toolConfig.file_mounts,
                        mkdir_output: configData.mkdir_output ?? toolConfig.mkdir_output,
                        use_temp_dir: configData.use_temp_dir ?? toolConfig.use_temp_dir,
                        group_id: configData.group_id || toolConfig.group_id,
                        tags: configData.tags && configData.tags.length > 0 ? configData.tags : toolConfig.tags,
                        help_doc_uid: configData.help_doc_uid || toolConfig.help_doc_uid
                    });

                    toast.success("工具配置生成完成！");
                },
                onError: (data: string) => {
                    toast.error(`生成失败: ${data}`);
                },
                onClose: () => {
                    // 连接关闭时的处理
                }
            };

            await toolConfigSSEService.generateToolConfig({
                name: toolConfig.name,
                description: toolConfig.description,
                image_uid: currentImage.uid,
            }, eventHandlers);

        } catch (error) {
            console.error('生成配置失败:', error);
            if (error instanceof Error) {
                if (error.message.includes('401')) {
                    toast.error('认证失败，请重新登录');
                } else if (error.message.includes('400')) {
                    toast.error('请求参数错误，请检查输入');
                } else if (error.message.includes('500')) {
                    toast.error('服务器内部错误，请稍后重试');
                } else {
                    toast.error(`生成配置失败: ${error.message}`);
                }
            } else {
                toast.error('生成配置失败: 未知错误');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">配置工具参数</h2>
                <p className="text-muted-foreground">设置工具的命令模板、参数和输出文件</p>
                {currentImage && (
                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">基于镜像:</span>
                        <Badge variant="outline">{currentImage.name}</Badge>
                        <Badge variant="secondary">{currentImage.version}</Badge>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">
                            基本信息
                            {toolConfig.name && (
                                <Badge variant="outline" className="ml-2">
                                    {toolConfig.name}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="params">
                            命令构建
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
                                    <Label htmlFor="description">
                                        描述 <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={toolConfig.description}
                                        onChange={(e) => setToolConfig({...toolConfig, description: e.target.value})}
                                        placeholder="工具的简要描述"
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="help_command">
                                        帮助命令 <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex gap-2">
                                        <Popover open={open} onOpenChange={setOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={open}
                                                    className="flex-1 justify-between"
                                                >
                                                    {helpCommand || "选择现有文档或输入新命令..."}
                                                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0">
                                                <Command>
                                                    <CommandInput
                                                        placeholder="搜索或输入新的帮助命令..."
                                                        value={helpCommand}
                                                        onValueChange={setHelpCommand}
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>未找到匹配的命令</CommandEmpty>
                                                        <CommandGroup>
                                                            {existDocs.map((doc) => (
                                                                <CommandItem
                                                                    key={doc.uid}
                                                                    value={doc.help_command}
                                                                    onSelect={(currentValue) => {
                                                                        setHelpCommand(currentValue === helpCommand ? "" : currentValue)
                                                                        setOpen(false)
                                                                    }}
                                                                >
                                                                    <CheckIcon
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            helpCommand === doc.help_command ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {doc.help_command}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={handlePreviewCommand}
                                            disabled={!helpCommand || runInImageMutation.isPending}
                                            title="预览命令结果"
                                        >
                                            <EyeIcon className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="group_id">工具分组</Label>
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
                                                        <FolderIcon className="h-4 w-4"/>
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
                                    <TagSelector
                                        availableTags={availableTags}
                                        onChange={(tags) => {
                                            setTags(tags);
                                            setToolConfig({...toolConfig, tags: tags});
                                        }}
                                        value={tags}
                                        allowCreate={true}
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

                    {/* 参数配置部分 */}
                    <TabsContent value="params">
                        <Card>
                            <CardHeader>
                                <CardTitle>命令构建</CardTitle>
                                <CardDescription>配置工具的参数，包括命令模板、动态参数和静态参数三部分</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
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
                                                <Card key={index} className="overflow-hidden border-l-4 border-l-primary pt-0">
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
                                                                <Trash2Icon className="h-4 w-4"/>
                                                            </Button>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="pt-0">
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
                                                                    disabled={!param.is_position}
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
                                                                            <HelpCircleIcon
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
                                            <PlusIcon className="h-4 w-4 mr-2"/>
                                            添加动态参数
                                        </Button>
                                    </div>
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
                                                className={`overflow-hidden border-l-4 pt-0 ${file.file_type === "INPUT" ? "border-l-blue-500" : "border-l-green-500"
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
                                                            <Trash2Icon className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="pt-0">
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
                                        <PlusIcon className="h-4 w-4 mr-2"/>
                                        添加文件挂载
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {(!!toolConfig.name && !!toolConfig.description) && (
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            onClick={handleGenerateConfig}
                            disabled={isGenerating}
                            className="min-w-[120px]"
                            variant={isGenerating ? "secondary" : "default"}
                        >
                            {isGenerating ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                                    生成中...
                                </>
                            ) : (
                                "生成配置"
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* 预览对话框 */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>命令预览结果</DialogTitle>
                        <DialogDescription>
                            命令: {helpCommand}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {runInImageMutation.isPending ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                    <p className="text-muted-foreground">正在执行命令...</p>
                                </div>
                            </div>
                        ) : runInImageMutation.isError ? (
                            <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                                <p className="text-destructive">执行命令时发生错误: {runInImageMutation.error?.message}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {existingDocContent ? (
                                    <div>
                                        <h4 className="font-semibold mb-2">现有文档内容:</h4>
                                        <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
                                            <pre className="whitespace-pre-wrap text-sm">{existingDocContent.content}</pre>
                                        </div>
                                    </div>
                                ) : runInImageMutation.data ? (
                                    <div>
                                        <h4 className="font-semibold mb-2">命令执行结果:</h4>
                                        <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
                                            <pre className="whitespace-pre-wrap text-sm">{runInImageMutation.data.result}</pre>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                            关闭
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
