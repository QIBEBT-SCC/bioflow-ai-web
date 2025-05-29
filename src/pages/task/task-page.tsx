"use client"

import {TaskGanttCard} from "@/components/task/task-gantt-card"
import {TaskTable} from "@/components/task/task-table-card"
import {SidebarInset, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage} from "@/components/ui/breadcrumb.tsx";

export function TaskPage() {
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
