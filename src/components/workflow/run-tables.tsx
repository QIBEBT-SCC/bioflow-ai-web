import {useRunCount, useRunList} from "@/hooks/use-run-instance.tsx";
import {useState} from "react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TablePage, TableRow} from "@/components/ui/table.tsx";
import {Link} from "react-router-dom";
import {TaskStatusBadge} from "@/components/task/task-status-badge.tsx";
import {formatTime, getDuration} from "@/lib/time-formatter.tsx";
import {Progress} from "@/components/ui/progress.tsx";

export function RunTables() {
    const [recentOffset, setRecentOffset] = useState<number>(0)

    const {data: runCount = 0} = useRunCount();
    const {data: runs = []} = useRunList(recentOffset);

    // 分页相关
    const pageSize = 8;
    const totalPages = Math.ceil(runCount / pageSize);
    const currentPage = Math.floor(recentOffset / pageSize) + 1;

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
                        <TableHead className="h-12 px-4">Workflow Run Name</TableHead>
                        <TableHead className="h-12 px-4">Status</TableHead>
                        <TableHead className="h-12 px-4 text-center">Progress</TableHead>
                        <TableHead className="h-12 px-4 text-right">Created</TableHead>
                        <TableHead className="h-12 px-4 text-right">Started</TableHead>
                        <TableHead className="h-12 px-4 text-right">Ended</TableHead>
                        <TableHead className="h-12 px-4 text-right">Duration</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {runs.map((run) => (
                        <TableRow key={run.uid}>
                            <TableCell className="font-medium p-4">
                                <Link to={`/workflow/${run.uid}`}
                                      className="font-medium hover:underline">
                                    {run.name}
                                </Link>
                            </TableCell>
                            <TableCell>
                                <TaskStatusBadge status={run.status}/>
                            </TableCell>
                            <TableCell className="place-items-center">
                                <div className="flex items-center gap-2">
                                    <Progress value={(run.task_stats.success / run.task_stats.total) * 100} className="h-2 w-24"/>
                                    <span className="text-xs text-muted-foreground">{run.task_stats.success}/{run.task_stats.total}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right p-4">{formatTime(run.create_time)}</TableCell>
                            <TableCell className="text-right p-4">{formatTime(run.start_time)}</TableCell>
                            <TableCell className="text-right p-4">{formatTime(run.end_time)}</TableCell>
                            <TableCell className="text-right p-4">{getDuration(run.start_time, run.end_time)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <TablePage
                totalPages={totalPages}
                currentPage={currentPage}
                handleNext={handleNext}
                handlePageChange={handlePageChange}
                handlePrev={handlePrev}
            />
        </div>
    )
}