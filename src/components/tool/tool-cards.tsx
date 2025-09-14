import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {Button} from "@/components/ui/button.tsx";
import {HelpCircleIcon, Trash2Icon} from "lucide-react";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {FileMount, ParamDefine} from "@/types/tool.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {useTranslation} from "react-i18next";

export function ToolParamCard(
    {param, index, onRemove, onUpdate}: {
        param: ParamDefine,
        index: number,
        onRemove: (index: number) => void,
        onUpdate: (index: number, field: keyof ParamDefine, value: string | number | boolean) => void
    }
) {
    const {t} = useTranslation();
    return (
        <Card key={index} className="overflow-hidden border-l-4 border-l-primary pt-0">
            <CardHeader className="py-3 bg-muted/30">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-base">
                        {t('tool.tool_cards.param_card.param')} {index + 1}
                        {param.required && <Badge className="ml-2 bg-red-500">{t('tool.tool_cards.param_card.required')}</Badge>}
                        {param.is_position && <Badge className="ml-2 bg-blue-500">{t('tool.tool_cards.param_card.position_param')}</Badge>}
                    </CardTitle>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove(index)}
                    >
                        <Trash2Icon className="h-4 w-4"/>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                        <Label htmlFor={`param-description-${index}`}>{t('tool.tool_cards.param_card.description')}</Label>
                        <Input
                            id={`param-description-${index}`}
                            value={param.description || ""}
                            onChange={(e) => onUpdate(index, "description", e.target.value)}
                            placeholder={t('tool.tool_cards.param_card.description_placeholder')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`param-index-${index}`}>{t('tool.tool_cards.param_card.index_position')}</Label>
                        <Input
                            id={`param-index-${index}`}
                            type="number"
                            value={param.index || 0}
                            onChange={(e) =>
                                onUpdate(index, "index", Number.parseInt(e.target.value) || 0)
                            }
                            disabled={!param.is_position}
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="space-y-2 mb-4">
                    <Label htmlFor={`param-command-${index}`}>
                        {t('tool.tool_cards.param_card.command_format')} <span className="text-red-500">*</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <HelpCircleIcon
                                        className="h-4 w-4 inline-block ml-1 text-muted-foreground"/>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">
                                        {t('tool.tool_cards.param_card.command_format_tooltip')}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </Label>
                    <Input
                        id={`param-command-${index}`}
                        value={param.command}
                        onChange={(e) => onUpdate(index, "command", e.target.value)}
                        placeholder={t('tool.tool_cards.param_card.command_format_placeholder')}
                        required
                    />
                </div>

                <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id={`param-required-${index}`}
                            checked={param.required}
                            onCheckedChange={(checked) =>
                                onUpdate(index, "required", checked as boolean)
                            }
                        />
                        <Label htmlFor={`param-required-${index}`}>{t('tool.tool_cards.param_card.required_param')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id={`param-position-${index}`}
                            checked={param.is_position}
                            onCheckedChange={(checked) =>
                                onUpdate(index, "is_position", checked as boolean)
                            }
                        />
                        <Label htmlFor={`param-position-${index}`}>{t('tool.tool_cards.param_card.position_param_checkbox')}</Label>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function ToolFileCard(
    {file, index, onRemove, onUpdate}: {
        file: FileMount,
        index: number,
        onRemove: (index: number) => void,
        onUpdate: (index: number, field: keyof FileMount, value: string | boolean) => void
    }
) {
    const {t} = useTranslation();
    return (
        <Card
            key={index}
            className={`overflow-hidden border-l-4 pt-0 ${file.file_type === "INPUT" ? "border-l-blue-500" : "border-l-green-500"
            }`}
        >
            <CardHeader className="py-3 bg-muted/30">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-base">
                        {t('tool.tool_cards.file_card.file')} {index + 1}: {file.name || t('tool.tool_cards.file_card.unnamed')}
                        <Badge
                            className={`ml-2 ${file.file_type === "INPUT" ? "bg-blue-500" : "bg-green-500"}`}>
                            {file.file_type === "INPUT" ? t('tool.tool_cards.file_card.input') : t('tool.tool_cards.file_card.output')}
                        </Badge>
                        {file.is_report && (
                            <Badge variant="outline" className="ml-2">
                                {t('tool.tool_cards.file_card.report')}
                            </Badge>
                        )}
                        {file.is_log && (
                            <Badge variant="outline" className="ml-2">
                                {t('tool.tool_cards.file_card.log')}
                            </Badge>
                        )}
                    </CardTitle>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove(index)}
                    >
                        <Trash2Icon className="h-4 w-4"/>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                        <Label htmlFor={`file-name-${index}`}>
                            {t('tool.tool_cards.file_card.file_name')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`file-name-${index}`}
                            value={file.name}
                            onChange={(e) => onUpdate(index, "name", e.target.value)}
                            placeholder={t('tool.tool_cards.file_card.file_name_placeholder')}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`file-type-${index}`}>
                            {t('tool.tool_cards.file_card.file_type')} <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={file.file_type}
                            onValueChange={(value) => onUpdate(index, "file_type", value)}
                        >
                            <SelectTrigger id={`file-type-${index}`}>
                                <SelectValue placeholder={t('tool.tool_cards.file_card.select_file_type')}/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INPUT">{t('tool.tool_cards.file_card.input_file')}</SelectItem>
                                <SelectItem value="OUTPUT">{t('tool.tool_cards.file_card.output_file')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2 mb-4">
                    <Label htmlFor={`file-description-${index}`}>{t('tool.tool_cards.file_card.description')}</Label>
                    <Input
                        id={`file-description-${index}`}
                        value={file.description || ""}
                        onChange={(e) => onUpdate(index, "description", e.target.value)}
                        placeholder={t('tool.tool_cards.file_card.description_placeholder')}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                        <Label htmlFor={`file-path-${index}`}>
                            {t('tool.tool_cards.file_card.file_path')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`file-path-${index}`}
                            value={file.file_path}
                            onChange={(e) => onUpdate(index, "file_path", e.target.value)}
                            placeholder={t('tool.tool_cards.file_card.file_path_placeholder')}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`mount-path-${index}`}>
                            {t('tool.tool_cards.file_card.mount_path')} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`mount-path-${index}`}
                            value={file.mount_path}
                            onChange={(e) => onUpdate(index, "mount_path", e.target.value)}
                            placeholder={t('tool.tool_cards.file_card.mount_path_placeholder')}
                            required
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id={`file-report-${index}`}
                            checked={file.is_report}
                            onCheckedChange={(checked) => onUpdate(index, "is_report", checked as boolean)}
                        />
                        <Label htmlFor={`file-report-${index}`}>{t('tool.tool_cards.file_card.report_file')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id={`file-log-${index}`}
                            checked={file.is_log}
                            onCheckedChange={(checked) => onUpdate(index, "is_log", checked as boolean)}
                        />
                        <Label htmlFor={`file-log-${index}`}>{t('tool.tool_cards.file_card.log_file')}</Label>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}