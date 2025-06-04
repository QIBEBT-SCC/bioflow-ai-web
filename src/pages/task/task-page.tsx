"use client"

import {TaskGanttCard} from "@/components/task/task-gantt-card"
import {TaskTable} from "@/components/task/task-table-card"
import {SidebarInset, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage} from "@/components/ui/breadcrumb.tsx";
import {Clock, RefreshCw} from "lucide-react";
import {format} from "date-fns";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useEffect, useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {useTaskStore} from "@/stores/task-store.tsx";

export function TaskPage() {
    const queryClient = useQueryClient();

    const {refreshInterval, setRefreshInterval} = useTaskStore()
    const [lastRefreshTime, setLastRefreshTime] = useState(new Date())

    // Force refresh function
    const handleForceRefresh = () => {
        setLastRefreshTime(new Date())
        queryClient.invalidateQueries({queryKey: ['recentTasks']}).then();
        queryClient.invalidateQueries({queryKey: ['tasks']}).then();
    }

    // Auto refresh effect
    useEffect(() => {
        if (refreshInterval === "off") return

        const intervalMs = {
            "10s": 10000,
            "30s": 30000,
            "1m": 60000,
            "5m": 300000,
        }[refreshInterval]

        if (!intervalMs) return

        const interval = setInterval(() => {
            handleForceRefresh()
        }, intervalMs)

        return () => clearInterval(interval)
    }, [refreshInterval])

    return (
        <SidebarInset className="h-screen flex flex-col">
            <header
                className="flex flex-col shrink-0 border-b">
                <div className="flex items-center gap-2 px-4 h-12 bg-background">
                    <SidebarTrigger className="-ml-1"/>
                    <Separator orientation="vertical" className="!mr-2 !h-4"/>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbPage>
                                    Task
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto py-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Task Execution Dashboard</h1>
                            <p className="text-muted-foreground">Monitor and manage workflow task executions</p>
                        </div>
                        <div className="flex justify-end items-end pt-6">
                            <div className="flex items-center gap-2 mt-4 md:mt-0">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Clock className="mr-1 h-4 w-4"/>
                                    Last updated: {format(lastRefreshTime, "HH:mm:ss")}
                                </div>
                                <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Auto refresh"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="off">No refresh</SelectItem>
                                        <SelectItem value="10s">Every 10s</SelectItem>
                                        <SelectItem value="30s">Every 30s</SelectItem>
                                        <SelectItem value="1m">Every 1m</SelectItem>
                                        <SelectItem value="5m">Every 5m</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Button variant="outline" size="icon" onClick={handleForceRefresh}>
                                    <RefreshCw className="h-4 w-4"/>
                                    <span className="sr-only">Force refresh</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <TaskGanttCard/>


                    <div className="pt-6 mt-6 px-10">
                        <h2 className="text-lg font-medium tracking-tight">Task List</h2>
                    </div>
                    <div className="pt-4 px-10">
                        <TaskTable/>
                    </div>
                </div>
            </div>
        </SidebarInset>
    )
}
