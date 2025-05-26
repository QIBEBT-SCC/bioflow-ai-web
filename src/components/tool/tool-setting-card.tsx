import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {OutputFile, ParamDefine, ParamType} from "@/types/tool.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {Button} from "@/components/ui/button.tsx";
import {HelpCircle, Trash2} from "lucide-react";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";

export function ParamCard({index, param, remove, update}: {
    index: number,
    param: ParamDefine,
    update: (index: number, field: keyof ParamDefine, value: string | number | boolean) => void,
    remove: (index: number) => void
}) {
    return (
        <Card key={`param-card-${index}`}
              className="overflow-hidden border-l-4 border-l-primary pt-0 gap-0">
            <CardHeader className="py-3 bg-muted/30">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-base">
                        参数 {index + 1}: {param.name || "未命名"}
                        {param.param_type !== ParamType.OUTPUT && (
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
                        onClick={() => remove(index)}
                    >
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="flex gap-4 mb-4">
                    <div className="space-y-2 flex-3">
                        <Label htmlFor={`param-key-${index}`}>
                            参数名称
                        </Label>
                        <Input
                            id={`param-name-${index}`}
                            value={param.name}
                            onChange={(e) => update(index, "name", e.target.value)}
                            placeholder="例如: raw r1"
                            required
                        />
                    </div>
                    <div className="space-y-2 flex-2">
                        <Label htmlFor={`param-type-${index}`}>
                            参数类型 <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={String(param.param_type)}
                            onValueChange={(value) => update(index, "param_type", Number(value))}
                        >
                            <SelectTrigger id={`param-type-${index}`} className="w-full">
                                <SelectValue placeholder="选择参数类型"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={String(ParamType.INPUT)}>
                                    输入参数
                                </SelectItem>
                                <SelectItem value={String(ParamType.INPUT_POSITION)}>
                                    位置参数
                                </SelectItem>
                                <SelectItem value={String(ParamType.OUTPUT)}>
                                    输出参数
                                </SelectItem>
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
                                update(index, "is_file", checked as boolean)
                            }
                        />
                    </div>
                </div>

                <div className="flex gap-4 mb-4">
                    <div className="space-y-2 flex flex-col flex-4">
                        <Label htmlFor={`param-command-${index}`}>
                            命令 <span className="text-red-500">*</span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle
                                            className="h-4 w-4 inline-block ml-1 text-muted-foreground"/>
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
                            onChange={(e) => update(index, "command", e.target.value)}
                            placeholder="例如: -i {r1}"
                            required
                        />
                    </div>
                    {param.param_type === ParamType.INPUT_POSITION && (
                        <div className="space-y-2 flex flex-col flex-1">
                            <Label htmlFor={`param-command-${index}`}>
                                位置索引 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id={`param-index-${index}`}
                                type='number'
                                value={param.index}
                                onChange={(e) => update(index, "index", e.target.value)}
                                placeholder="1"
                                required
                            />
                        </div>
                    )}
                </div>


                <div className="space-y-2 mb-4">
                    <Label htmlFor={`param-description-${index}`}>描述</Label>
                    <Textarea
                        id={`param-description-${index}`}
                        value={param.description}
                        onChange={(e) => update(index, "description", e.target.value)}
                        placeholder="参数的简要描述"
                        rows={3}
                    />
                </div>

                {param.param_type !== ParamType.OUTPUT && (
                    <div className="space-y-2">
                        <Label htmlFor={`param-mount-path-${index}`}>挂载路径 <span className="text-red-500"> *</span></Label>
                        <Input
                            id={`param-mount-path-${index}`}
                            value={param.mount_path || ""}
                            onChange={(e) => update(index, "mount_path", e.target.value)}
                            placeholder="例如: /data/raw"
                        />
                    </div>
                )}


            </CardContent>
        </Card>
    )
}


export function FileCard({index, file, update, remove}: {
    index: number,
    file: OutputFile,
    update: (index: number, field: keyof OutputFile, value: string | number | boolean) => void,
    remove: (index: number) => void
}) {
    return (
        <Card key={index} className="overflow-hidden border-l-4 border-l-green-500 pt-0 gap-0">
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
                        onClick={() => remove(index)}
                    >
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-4 ">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                        <Label htmlFor={`output-name-${index}`}>
                            文件名称 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`output-name-${index}`}
                            value={file.name}
                            onChange={(e) => update(index, "name", e.target.value)}
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
                            onChange={(e) => update(index, "mount_path", e.target.value)}
                            placeholder="例如: /data/output"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2 mb-4">
                    <Label htmlFor={`output-file-path-${index}`}>
                        文件路径 <span className="text-red-500">*</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <HelpCircle
                                        className="h-4 w-4 inline-block ml-1 text-muted-foreground"/>
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
                        onChange={(e) => update(index, "file_path", e.target.value)}
                        placeholder="例如: {output_dir}/{name}_fastp_R1.fq.gz"
                        required
                    />
                </div>

                <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="is_log"
                            checked={file.is_log}
                            onCheckedChange={(checked) => update(index, "is_log", checked as boolean)}
                        />
                        <Label htmlFor="is_log">设为日志文件</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="is_report"
                            checked={file.is_report}
                            onCheckedChange={(checked) => update(index, "is_report", checked as boolean)}
                        />
                        <Label htmlFor="is_report">设为报告</Label>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}