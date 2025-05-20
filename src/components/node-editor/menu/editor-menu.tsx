"use client"

import {type ReactNode, useState} from "react"
import {Button} from "@/components/ui/button.tsx"
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog.tsx"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationEllipsis,
} from "@/components/ui/pagination.tsx"
import {Input} from "@/components/ui/input.tsx"
import {File, Search, ChevronLeft, ChevronRight} from "lucide-react"
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {useWorkflowCount, useWorkflows} from "@/hooks/useWorkflow.tsx";

export function MenuButton({icon, tooltip, onClick, disable}: { icon: ReactNode, tooltip: string, onClick: () => void, disable: boolean }) {
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

export function LoadMenu({icon, tooltip, onClick, disable}: {
    icon: ReactNode,
    tooltip: string,
    onClick: (uid: string) => void,
    disable: boolean
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
                            disabled={disable || loadingCount || loadingWorkflows}
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
                        <Search className="h-4 w-4 text-muted-foreground"/>
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
                                <File className="h-10 w-10 text-muted-foreground mb-2"/>
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
                                    <span className="flex items-center"><ChevronLeft className="h-4 w-4 mr-1"/></span>
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
                                    <span className="flex items-center"><ChevronRight className="h-4 w-4 ml-1"/></span>
                                </PaginationLink>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
            </DialogContent>
        </Dialog>
    )
}
