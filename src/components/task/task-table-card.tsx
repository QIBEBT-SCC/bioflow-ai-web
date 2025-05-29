"use client"


import {format} from "date-fns"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {TaskStatusBadge} from "@/components/task/task-status-badge"
import {useTaskCount, useTaskList} from "@/hooks/use-instance.tsx";
import {TaskInstance} from "@/types/instance.tsx";
import {Link} from "react-router-dom";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination.tsx";
import {useState} from "react";

export function TaskTable() {
    const [recentOffset, setRecentOffset] = useState<number>(0)

    const {data: taskCount = 0} = useTaskCount()
    const {data: tasks = []} = useTaskList(recentOffset)


    // Calculate duration between start and end time (or now for running tasks)
    const getDuration = (task: TaskInstance) => {
        if (!task.start_time) return "-"

        const startTime = new Date(task.start_time)
        const endTime = task.end_time ? new Date(task.end_time) : new Date()

        const durationMs = endTime.getTime() - startTime.getTime()
        const seconds = Math.floor(durationMs / 1000)

        if (seconds < 60) return `${seconds}s`

        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60

        if (minutes < 60) return `${minutes}m ${remainingSeconds}s`

        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60

        return `${hours}h ${remainingMinutes}m`
    }

    const formatTime = (timeString: string | undefined) => {
        if (!timeString) return "--"
        return format(new Date(timeString), "MM-dd HH:mm")
    }

    // 分页相关
    const pageSize = 8;
    const totalPages = Math.ceil(taskCount / pageSize);
    const currentPage = Math.floor(recentOffset / pageSize) + 1;

    // 生成页码数组（最多显示5页，超出用省略号）
    const getPageNumbers = () => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (currentPage <= 3) {
            return [1, 2, 3, 4, 'ellipsis', totalPages];
        }
        if (currentPage >= totalPages - 2) {
            return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }
        return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
    };

    const handlePageChange = (page: number) => {
        setRecentOffset((page - 1) * pageSize);
    };
    const handlePrev = () => {
        if (currentPage > 1) setRecentOffset((currentPage - 2) * pageSize);
    };
    const handleNext = () => {
        if (currentPage < totalPages) setRecentOffset(currentPage * pageSize);
    };

    return (
        <div>
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="h-12 px-4">Task Name</TableHead>
                        <TableHead className="h-12 px-4">Status</TableHead>
                        <TableHead className="h-12 px-4 text-right">Created</TableHead>
                        <TableHead className="h-12 px-4 text-right">Started</TableHead>
                        <TableHead className="h-12 px-4 text-right">Ended</TableHead>
                        <TableHead className="h-12 px-4 text-right">Duration</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks.map((task) => (
                        <TableRow key={task.uid}>
                            <TableCell className="font-medium p-4">
                                <Link to={`/task/${task.uid}`}
                                      className="font-medium hover:underline">
                                    {task.name}
                                </Link>
                            </TableCell>
                            <TableCell>
                                <TaskStatusBadge status={task.status}/>
                            </TableCell>
                            <TableCell className="text-right p-4">{formatTime(task.create_time)}</TableCell>
                            <TableCell className="text-right p-4">{formatTime(task.start_time)}</TableCell>
                            <TableCell className="text-right p-4">{formatTime(task.end_time)}</TableCell>
                            <TableCell className="text-right p-4">{getDuration(task)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Pagination className="pt-2">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={e => { e.preventDefault(); handlePrev(); }}
                            aria-disabled={currentPage === 1}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                    </PaginationItem>
                    {getPageNumbers().map((num, idx) =>
                        num === 'ellipsis' ? (
                            <PaginationItem key={"ellipsis-" + idx}>
                                <PaginationEllipsis />
                            </PaginationItem>
                        ) : (
                            <PaginationItem key={num}>
                                <PaginationLink
                                    isActive={num === currentPage}
                                    onClick={e => { e.preventDefault(); handlePageChange(Number(num)); }}
                                >
                                    {num}
                                </PaginationLink>
                            </PaginationItem>
                        )
                    )}
                    <PaginationItem>
                        <PaginationNext
                            onClick={e => { e.preventDefault(); handleNext(); }}
                            aria-disabled={currentPage === totalPages || totalPages === 0}
                            className={currentPage === totalPages || totalPages === 0 ? 'pointer-events-none opacity-50' : ''}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )
}
