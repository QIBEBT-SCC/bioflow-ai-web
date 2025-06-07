"use client"


import {Table, TableBody, TableCell, TableHead, TableHeader, TablePage, TableRow} from "@/components/ui/table"
import {TaskStatusBadge} from "@/components/task/task-status-badge"
import {useTaskCount, useTaskList} from "@/hooks/use-instance.tsx";
import {Link} from "react-router-dom";
import {useState} from "react";
import {formatTime, getDuration} from "@/lib/time-formatter.tsx";

export function TaskTable() {
    const [recentOffset, setRecentOffset] = useState<number>(0)

    const {data: taskCount = 0} = useTaskCount()
    const {data: tasks = []} = useTaskList(recentOffset)

    return (
        <div>
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="h-12 px-4">Task Name</TableHead>
                        <TableHead className="h-12 px-4">Workflow</TableHead>
                        <TableHead className="h-12 px-4 text-center">Status</TableHead>
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
                            <TableCell className="text-muted-foreground p-4">{task.run_instance.name}</TableCell>
                            <TableCell className="place-items-center">
                                <TaskStatusBadge status={task.status}/>
                            </TableCell>
                            <TableCell className="text-right p-4">{formatTime(task.create_time)}</TableCell>
                            <TableCell className="text-right p-4">{formatTime(task.start_time)}</TableCell>
                            <TableCell className="text-right p-4">{formatTime(task.end_time)}</TableCell>
                            <TableCell className="text-right p-4">{getDuration(task.start_time, task.end_time)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <TablePage
                totalItems={taskCount}
                offset={recentOffset}
                pageSize={8}
                setOffset={setRecentOffset}
            />
        </div>
    )
}
