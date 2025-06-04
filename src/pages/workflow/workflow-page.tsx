import {SidebarInset, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage} from "@/components/ui/breadcrumb.tsx";
import {Activity, CheckCircle, Clock, Play, RefreshCw, XCircle} from "lucide-react";
import {format} from "date-fns";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useWorkflowStore} from "@/stores/workflow-store.tsx";
import {useEffect, useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {useRunStats} from "@/hooks/use-run-instance.tsx";
import {RunTables} from "@/components/workflow/run-tables.tsx";

export function WorkflowPage() {
    const queryClient = useQueryClient();

    const {refreshInterval, setRefreshInterval} = useWorkflowStore();
    const [lastRefreshTime, setLastRefreshTime] = useState(new Date());

    const {data: runStats} = useRunStats();

    // Force refresh function
    const handleForceRefresh = () => {
        setLastRefreshTime(new Date())
        queryClient.invalidateQueries({queryKey: ['runs']}).then();
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
                                    Workflow
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
                            <h1 className="text-2xl font-bold tracking-tight">Workflow Dashboard</h1>
                            <p className="text-muted-foreground">Monitor and manage workflow status</p>
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


                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 px-16">
                        <Card className="gap-0">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">总工作流</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{runStats?.total ?? '--'}</div>
                                <p className="text-xs text-muted-foreground">所有工作流数量</p>
                            </CardContent>
                        </Card>

                        <Card className="gap-0">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">等待中</CardTitle>
                                <Clock className="h-4 w-4 text-yellow-500"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">{runStats?.waiting ?? '--'}</div>
                                <p className="text-xs text-muted-foreground">等待执行的工作流</p>
                            </CardContent>
                        </Card>

                        <Card className="gap-0">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">运行中</CardTitle>
                                <Play className="h-4 w-4 text-blue-500"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{runStats?.running ?? '--'}</div>
                                <p className="text-xs text-muted-foreground">正在执行的工作流</p>
                            </CardContent>
                        </Card>

                        <Card className="gap-0">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">已完成</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-500"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{runStats?.success ?? '--'}</div>
                                <p className="text-xs text-muted-foreground">成功完成的工作流</p>
                            </CardContent>
                        </Card>

                        <Card className="gap-0">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">失败</CardTitle>
                                <XCircle className="h-4 w-4 text-red-500"/>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{runStats?.error ?? '--'}</div>
                                <p className="text-xs text-muted-foreground">执行失败的工作流</p>
                            </CardContent>
                        </Card>
                    </div>


                    <div className="pt-6 mt-6 px-10">
                        <h2 className="text-lg font-medium tracking-tight">Workflow List</h2>
                    </div>
                    <div className="pt-4 px-10">
                        <RunTables/>
                    </div>
                </div>
            </div>
        </SidebarInset>
    )
}