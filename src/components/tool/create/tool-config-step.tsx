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
import {PlusIcon, HelpCircleIcon, FolderIcon, CheckIcon, ChevronsUpDownIcon, EyeIcon} from "lucide-react"
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
import {ToolFileCard, ToolParamCard} from "@/components/tool/tool-cards.tsx";
import {useTranslation} from "react-i18next";

export function ToolConfigurationStep() {
    const {t} = useTranslation();
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
            toast.error(t('tool.create.tool_config.errors.select_image_first'));
            return;
        }

        if (!toolConfig.name || !toolConfig.name.trim()) {
            toast.error(t('tool.create.tool_config.errors.enter_tool_name'));
            return;
        }

        if (!toolConfig.description || !toolConfig.description.trim()) {
            toast.error(t('tool.create.tool_config.errors.enter_description'));
            return;
        }

        setIsGenerating(true);

        try {
            const eventHandlers: ToolConfigEventHandlers = {
                onOpen: () => {
                    toast.info(t('tool.create.tool_config.messages.start_generating'));
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

                    toast.success(t('tool.create.tool_config.messages.config_generated'));
                },
                onError: (data: string) => {
                    toast.error(`${t('tool.create.tool_config.messages.generation_failed')} ${data}`);
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
                    toast.error(t('tool.create.tool_config.errors.auth_failed'));
                } else if (error.message.includes('400')) {
                    toast.error(t('tool.create.tool_config.errors.bad_request'));
                } else if (error.message.includes('500')) {
                    toast.error(t('tool.create.tool_config.errors.server_error'));
                } else {
                    toast.error(`${t('tool.create.tool_config.messages.generation_failed')} ${error.message}`);
                }
            } else {
                toast.error(t('tool.create.tool_config.errors.unknown_error'));
            }
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">{t('tool.create.tool_config.title')}</h2>
                <p className="text-muted-foreground">{t('tool.create.tool_config.subtitle')}</p>
                {currentImage && (
                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{t('tool.create.tool_config.based_on_image')}</span>
                        <Badge variant="outline">{currentImage.name}</Badge>
                        <Badge variant="secondary">{currentImage.version}</Badge>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">
                            {t('tool.create.tool_config.tabs.basic')}
                            {toolConfig.name && (
                                <Badge variant="outline" className="ml-2">
                                    {toolConfig.name}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="params">
                            {t('tool.create.tool_config.tabs.params')}
                            {toolConfig.dynamic_params.length > 0 && (
                                <Badge variant="outline" className="ml-2">
                                    {toolConfig.dynamic_params.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="files">
                            {t('tool.create.tool_config.tabs.files')}
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
                                <CardTitle>{t('tool.create.tool_config.basic_info.title')}</CardTitle>
                                <CardDescription>{t('tool.create.tool_config.basic_info.subtitle')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        {t('tool.create.tool_config.basic_info.tool_name')} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={toolConfig.name}
                                        onChange={(e) => setToolConfig({...toolConfig, name: e.target.value})}
                                        placeholder={t('tool.add_tool.tool_name_placeholder')}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        {t('tool.create.tool_config.basic_info.description')} <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={toolConfig.description}
                                        onChange={(e) => setToolConfig({...toolConfig, description: e.target.value})}
                                        placeholder={t('tool.create.tool_config.basic_info.description')}
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="help_command">
                                        {t('tool.create.tool_config.basic_info.help_command')} <span className="text-red-500">*</span>
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
                                                    {helpCommand || t('tool.create.tool_config.basic_info.help_command_placeholder')}
                                                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0">
                                                <Command>
                                                    <CommandInput
                                                        placeholder={t('tool.create.tool_config.basic_info.help_command_search')}
                                                        value={helpCommand}
                                                        onValueChange={setHelpCommand}
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>{t('tool.create.tool_config.basic_info.no_commands')}</CommandEmpty>
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
                                            title={t('tool.create.tool_config.basic_info.preview_result')}
                                        >
                                            <EyeIcon className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor='group_id'>{t('tool.create.tool_config.basic_info.tool_group')}</Label>
                                    <Select
                                        value={toolConfig.group_id.toString()}
                                        onValueChange={(value) => setToolConfig({...toolConfig, group_id: Number.parseInt(value)})}
                                    >
                                        <SelectTrigger id="group_id">
                                            <SelectValue placeholder={t('tool.create.tool_config.basic_info.select_group')}/>
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
                                    <Label>{t('tool.create.tool_config.basic_info.tool_tags')}</Label>
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
                                        <Label htmlFor='mkdir_output'>{t('tool.create.tool_config.basic_info.create_output_dir')}</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="use_temp_dir"
                                            checked={toolConfig.use_temp_dir}
                                            onCheckedChange={(checked) => setToolConfig({...toolConfig, use_temp_dir: checked as boolean})}
                                        />
                                        <Label htmlFor='use_temp_dir'>{t('tool.create.tool_config.basic_info.use_temp_dir')}</Label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 参数配置部分 */}
                    <TabsContent value="params">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('tool.create.tool_config.params.title')}</CardTitle>
                                <CardDescription>{t('tool.create.tool_config.params.subtitle')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="command_template">
                                        {t('tool.create.tool_config.params.command_template')} <span className="text-red-500">*</span>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <HelpCircleIcon className="h-4 w-4 inline-block ml-1 text-muted-foreground"/>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="max-w-xs">
                                                        {t('tool.create.tool_config.params.command_template_tooltip')}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Label>
                                    <Input
                                        id="command_template"
                                        value={toolConfig.command_template}
                                        onChange={(e) => setToolConfig({...toolConfig, command_template: e.target.value})}
                                        placeholder={t('tool.create.tool_config.params.command_template_placeholder')}
                                        required
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label className='text-lg font-semibold'>{t('tool.create.tool_config.params.dynamic_params')}</Label>
                                    </div>

                                    {toolConfig.dynamic_params.length === 0 ? (
                                        <div className="text-center py-6 text-muted-foreground border rounded-md bg-muted/30">
                                            {t('tool.create.tool_config.params.no_dynamic_params')}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {toolConfig.dynamic_params.map((param, index) => (
                                                <ToolParamCard
                                                    param={param}
                                                    index={index}
                                                    onRemove={removeDynamicParam}
                                                    onUpdate={updateDynamicParam}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex justify-center mt-4">
                                        <Button type="button" onClick={addDynamicParam} variant="outline" className="w-full bg-transparent">
                                            <PlusIcon className="h-4 w-4 mr-2"/>
                                            {t('tool.create.tool_config.params.add_dynamic_param')}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor='static_params'>{t('tool.create.tool_config.params.static_params')}</Label>
                                    <Textarea
                                        id="static_params"
                                        value={toolConfig.static_params}
                                        onChange={(e) => setToolConfig({...toolConfig, static_params: e.target.value})}
                                        placeholder={t('tool.create.tool_config.params.static_params_placeholder')}
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
                                <CardTitle>{t('tool.create.tool_config.files.title')}</CardTitle>
                                <CardDescription>{t('tool.create.tool_config.files.subtitle')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className='text-lg font-semibold'>{t('tool.create.tool_config.files.file_mounts')}</h2>
                                </div>

                                {toolConfig.file_mounts.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground border rounded-md bg-muted/30">
                                        {t('tool.create.tool_config.files.no_file_mounts')}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {toolConfig.file_mounts.map((file, index) => (
                                            <ToolFileCard
                                                file={file}
                                                index={index}
                                                onUpdate={updateFileMount}
                                                onRemove={removeFileMount}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-center mt-4">
                                    <Button type="button" onClick={addFileMount} variant="outline" className="w-full bg-transparent">
                                        <PlusIcon className="h-4 w-4 mr-2"/>
                                        {t('tool.create.tool_config.files.add_file_mount')}
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
                                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2'></div>
                                    {t('tool.create.tool_config.generating')}
                                </>
                            ) : (
                                t('tool.create.tool_config.generate_config')
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* 预览对话框 */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>{t('tool.create.tool_config.preview.title')}</DialogTitle>
                        <DialogDescription>
                            {t('tool.create.tool_config.preview.command')} {helpCommand}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {runInImageMutation.isPending ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                    <p className='text-muted-foreground'>{t('tool.create.tool_config.preview.executing')}</p>
                                </div>
                            </div>
                        ) : runInImageMutation.isError ? (
                            <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                                <p className='text-destructive'>{t('tool.create.tool_config.preview.error')} {runInImageMutation.error?.message}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {existingDocContent ? (
                                    <div>
                                        <h4 className='font-semibold mb-2'>{t('tool.create.tool_config.preview.existing_doc')}</h4>
                                        <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
                                            <pre className="whitespace-pre-wrap text-sm">{existingDocContent.content}</pre>
                                        </div>
                                    </div>
                                ) : runInImageMutation.data ? (
                                    <div>
                                        <h4 className='font-semibold mb-2'>{t('tool.create.tool_config.preview.command_result')}</h4>
                                        <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
                                            <pre className="whitespace-pre-wrap text-sm">{runInImageMutation.data.result}</pre>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setPreviewOpen(false)}>
                            {t('tool.create.tool_config.preview.close')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
