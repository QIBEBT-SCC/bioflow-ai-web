"use client"

import {type ReactNode, useState} from "react"
import {Button} from "@/components/ui/button.tsx"
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog.tsx"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationEllipsis,
} from "@/components/ui/pagination.tsx"
import {Input} from "@/components/ui/input.tsx"
import {FileIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon} from "lucide-react"
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {useSaveWorkflow, useWorkflowCount, useWorkflows} from "@/hooks/useWorkflow.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {WorkflowType} from "@/types/workflow.tsx";
import {Switch} from "@/components/ui/switch.tsx";
import {useEdges, useNodes} from "@xyflow/react";
import {useNodeEditorStore} from "@/stores/nodeviewStore.tsx";

export function MenuButton({icon, tooltip, onClick, disable = false}: {
    icon: ReactNode,
    tooltip: string,
    onClick: () => void,
    disable?: boolean
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="border-0 shadow-none text-muted-foreground hover:text-foreground"
                    onClick={onClick}
                    disabled={disable}
                >
                    {icon}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    )
}

export function LoadWorkflowDialog({icon, tooltip, onClick}: {
    icon: ReactNode,
    tooltip: string,
    onClick: (uid: string) => void,
}) {
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState("")
    const [open, setOpen] = useState(false)
    const itemsPerPage = 8

    const {data: totalPages = 0, isLoading: loadingCount} = useWorkflowCount()
    const {data: workflows = [], isLoading: loadingWorkflows} = useWorkflows({offset: itemsPerPage * (currentPage - 1)})

    // 处理页面变化
    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    // 处理搜索输入
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
        setCurrentPage(1) // 重置到第一页
    }

    const handleFileSelect = (uid: string) => {
        onClick(uid)
        setOpen(false)
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-0 shadow-none text-muted-foreground hover:text-foreground"
                            disabled={loadingCount || loadingWorkflows}
                        >
                            {icon}
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltip}</p>
                </TooltipContent>
            </Tooltip>
            <DialogContent className="sm:max-w-[600px]" onCloseAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>请选择文件</DialogTitle>
                </DialogHeader>
                <DialogDescription></DialogDescription>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <SearchIcon className="h-4 w-4 text-muted-foreground"/>
                    </div>
                    <Input
                        type="text"
                        placeholder="搜索文件名..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-10"
                    />
                </div>

                <div className="grid grid-cols-4 gap-4 py-4">
                    {workflows.length > 0 ? (
                        workflows.map((file) => (
                            <div
                                key={file.uid}
                                className="flex flex-col items-center justify-center p-2 border rounded-md cursor-pointer hover:bg-accent transition-colors"
                                onClick={() => handleFileSelect(file.uid)}
                            >
                                <FileIcon className="h-10 w-10 text-muted-foreground mb-2"/>
                                <span className="text-sm text-center truncate w-full" title={file.name}>
                        {file.name}
                      </span>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-4 py-8 text-center text-muted-foreground">没有找到匹配的文件</div>
                    )}
                </div>

                {totalPages > 1 && (
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationLink
                                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                    isActive={currentPage !== 1}
                                >
                                    <span className="flex items-center"><ChevronLeftIcon className="h-4 w-4 mr-1"/></span>
                                </PaginationLink>
                            </PaginationItem>

                            {Array.from({length: totalPages}).map((_, index) => {
                                const pageNumber = index + 1

                                // 显示当前页、第一页、最后一页，以及当前页附近的页码
                                if (
                                    pageNumber === 1 ||
                                    pageNumber === totalPages ||
                                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                ) {
                                    return (
                                        <PaginationItem key={index}>
                                            <PaginationLink
                                                isActive={currentPage === pageNumber}
                                                onClick={() => handlePageChange(pageNumber)}
                                            >
                                                {pageNumber}
                                            </PaginationLink>
                                        </PaginationItem>
                                    )
                                }

                                // 添加省略号
                                if (
                                    (pageNumber === 2 && currentPage > 3) ||
                                    (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                                ) {
                                    return (
                                        <PaginationItem key={index}>
                                            <PaginationEllipsis/>
                                        </PaginationItem>
                                    )
                                }

                                return null
                            })}

                            <PaginationItem>
                                <PaginationLink
                                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                    isActive={currentPage !== totalPages}
                                >
                                    <span className="flex items-center"><ChevronRightIcon className="h-4 w-4 ml-1"/></span>
                                </PaginationLink>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
            </DialogContent>
        </Dialog>
    )
}


export function SaveWorkflowDialog({icon, tooltip}: {
    icon: ReactNode,
    tooltip: string
}) {
    const [open, setOpen] = useState(false)

    const [name, setName] = useState('')
    const [isPublic, setIsPublic] = useState(false)
    const [workflowType, setWorkflowType] = useState<WorkflowType>(WorkflowType.TEMPLATE)
    const [nameError, setNameError] = useState<string | null>(null)

    const nodes = useNodes();
    const edges = useEdges();

    const {mutate: saveWorkflow, isPending: isSaving} = useSaveWorkflow();
    const setCurrentWorkflowUid = useNodeEditorStore((state) => state.setCurrentWorkflowUid)

    function resetError() {
        setNameError(null);
    }

    const handleSave = () => {
        resetError();
        const workflow = {
            name: name,
            workflow: {
                nodes: nodes,
                edges: edges
            },
            public: isPublic,
            wf_type: workflowType,
        };

        console.log(workflow)
        saveWorkflow({workflow: workflow}, {
            onSuccess: (data: unknown) => {
                setOpen(false);
                setName('');
                setIsPublic(false);
                setWorkflowType(WorkflowType.TEMPLATE);
                resetError();
                setCurrentWorkflowUid(data as string)
            },
            onError: (error) => {
                // @ts-expect-error no need
                if (error.status === 409) {
                    setNameError('该名称已存在')
                }
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="border-0 shadow-none text-muted-foreground hover:text-foreground"
                                disabled={nodes.length === 0}
                            >
                                {icon}
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltip}</p>
                    </TooltipContent>
                </Tooltip>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>保存工作流</DialogTitle>
                    <DialogDescription>设置工作流的基本信息，包括名称、可见性和保存类型。</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* 工作流名称 */}
                    <div className="grid gap-2">
                        <Label htmlFor="workflow-name">工作流名称</Label>
                        <Input
                            id="workflow-name"
                            placeholder="请输入工作流名称"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={nameError ? "border-red-500 focus:ring-red-500" : ""}
                        />
                        {nameError && (
                            <div className="text-sm text-red-500 mt-1">{nameError}</div>
                        )}
                    </div>

                    {/* 是否公开 */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="is-public">公开工作流</Label>
                            <div className="text-sm text-muted-foreground">其他用户可以查看和使用此工作流</div>
                        </div>
                        <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic}/>
                    </div>

                    {/* 保存类型 */}
                    <div className="grid gap-2">
                        <Label htmlFor="save-type">保存类型</Label>
                        <Select value={String(workflowType)} onValueChange={(value) => setWorkflowType(Number(value))}>
                            <SelectTrigger>
                                <SelectValue placeholder="选择保存类型"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={String(WorkflowType.SUBMODULE)}>子模块</SelectItem>
                                <SelectItem value={String(WorkflowType.TEMPLATE)}>模板</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="text-sm text-muted-foreground">
                            {workflowType === WorkflowType.TEMPLATE && "保存为可重复使用的工作流模板"}
                            {workflowType === WorkflowType.SUBMODULE && "保存为可嵌入其他工作流的子模块"}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        取消
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving || !name}>
                        保存
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}