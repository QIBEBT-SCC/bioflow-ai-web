"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { TaskStatusBadge } from "@/components/task/task-status-badge"

interface Task {
    uid: string
    instance_uid: string
    owner_id: number
    name: string
    commands: string | null
    result: any
    status: string
    create_time: string
    start_time: string | null
    end_time: string | null
}

interface TaskTableProps {
    tasks: Task[]
}

export function TaskTable({ tasks }: TaskTableProps) {
    const [sortField, setSortField] = useState<keyof Task>("create_time")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

    const handleSort = (field: keyof Task) => {
        if (field === sortField) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("desc")
        }
    }

    const sortedTasks = [...tasks].sort((a, b) => {
        if (sortField === "create_time" || sortField === "start_time" || sortField === "end_time") {
            const aValue = a[sortField] ? new Date(a[sortField] as string).getTime() : 0
            const bValue = b[sortField] ? new Date(b[sortField] as string).getTime() : 0

            return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        }

        const aValue = a[sortField]
        const bValue = b[sortField]

        if (aValue === bValue) return 0
        if (aValue === null) return sortDirection === "asc" ? -1 : 1
        if (bValue === null) return sortDirection === "asc" ? 1 : -1

        return sortDirection === "asc"
            ? String(aValue).localeCompare(String(bValue))
            : String(bValue).localeCompare(String(aValue))
    })

    // Calculate duration between start and end time (or now for running tasks)
    const getDuration = (task: Task) => {
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

    const formatTime = (timeString: string | null) => {
        if (!timeString) return "-"
        return format(new Date(timeString), "HH:mm:ss")
    }

    const SortIcon = ({ field }: { field: keyof Task }) => {
        if (field !== sortField) return null

        return sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px] cursor-pointer" onClick={() => handleSort("name")}>
                            <div className="flex items-center">
                                Task Name
                                <SortIcon field="name" />
                            </div>
                        </TableHead>
                        <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort("status")}>
                            <div className="flex items-center">
                                Status
                                <SortIcon field="status" />
                            </div>
                        </TableHead>
                        <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort("create_time")}>
                            <div className="flex items-center">
                                Created
                                <SortIcon field="create_time" />
                            </div>
                        </TableHead>
                        <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort("start_time")}>
                            <div className="flex items-center">
                                Started
                                <SortIcon field="start_time" />
                            </div>
                        </TableHead>
                        <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort("end_time")}>
                            <div className="flex items-center">
                                Ended
                                <SortIcon field="end_time" />
                            </div>
                        </TableHead>
                        <TableHead className="w-[100px]">Duration</TableHead>
                        <TableHead className="w-[80px]">Owner</TableHead>
                        <TableHead className="w-[60px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedTasks.map((task) => (
                        <TableRow key={task.uid}>
                            <TableCell className="font-medium">{task.name}</TableCell>
                            <TableCell>
                                <TaskStatusBadge status={task.status} />
                            </TableCell>
                            <TableCell>{formatTime(task.create_time)}</TableCell>
                            <TableCell>{formatTime(task.start_time)}</TableCell>
                            <TableCell>{formatTime(task.end_time)}</TableCell>
                            <TableCell>{getDuration(task)}</TableCell>
                            <TableCell>User {task.owner_id}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Open menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>View Details</DropdownMenuItem>
                                        <DropdownMenuItem>View Results</DropdownMenuItem>
                                        <DropdownMenuItem>View Logs</DropdownMenuItem>
                                        {task.status === "RUNNING" && (
                                            <DropdownMenuItem className="text-red-500">Cancel Task</DropdownMenuItem>
                                        )}
                                        {task.status === "FAILED" && <DropdownMenuItem>Retry Task</DropdownMenuItem>}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
