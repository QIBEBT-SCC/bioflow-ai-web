"use client"

import {useEffect, useState} from "react"
import {format, subHours} from "date-fns"
import {Clock, RefreshCw} from "lucide-react"

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {TaskGanttChart} from "@/components/task/task-gantt-card"
import {TaskTable} from "@/components/task/task-table-card"
import {TaskStatusBadge} from "@/components/task/task-status-badge"
import {SidebarInset, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage} from "@/components/ui/breadcrumb.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {Button} from "@/components/ui/button.tsx";

// Mock data based on the TaskInstance model
const mockTasks = [
    {
        uid: "01H1G5JRVN7XXBW2VKZS8C3Y6T",
        instance_uid: "01H1G5JRVN7XXBW2VKZS8C3Y6T",
        owner_id: 1,
        name: "Data Processing Task",
        commands: "python process_data.py --input=data.csv",
        result: {success: true, processed_records: 1250},
        status: "COMPLETED",
        create_time: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString(), // 2.5 hours ago
        start_time: new Date(Date.now() - 1000 * 60 * 60 * 2.4).toISOString(), // 2.4 hours ago
        end_time: new Date(Date.now() - 1000 * 60 * 60 * 1.8).toISOString(), // 1.8 hours ago
    },
    {
        uid: "01H1G5JRVN7XXBW2VKZS8C3Y7U",
        instance_uid: "01H1G5JRVN7XXBW2VKZS8C3Y6T",
        owner_id: 2,
        name: "Model Training",
        commands: "python train_model.py --epochs=100",
        result: {accuracy: 0.92, loss: 0.08},
        status: "COMPLETED",
        create_time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        start_time: new Date(Date.now() - 1000 * 60 * 60 * 4.9).toISOString(), // 4.9 hours ago
        end_time: new Date(Date.now() - 1000 * 60 * 60 * 3.2).toISOString(), // 3.2 hours ago
    },
    {
        uid: "01H1G5JRVN7XXBW2VKZS8C3Y8V",
        instance_uid: "01H1G5JRVN7XXBW2VKZS8C3Y6T",
        owner_id: 1,
        name: "Data Validation",
        commands: "python validate_data.py",
        result: null,
        status: "RUNNING",
        create_time: new Date(Date.now() - 1000 * 60 * 60 * 0.5).toISOString(), // 0.5 hours ago
        start_time: new Date(Date.now() - 1000 * 60 * 60 * 0.4).toISOString(), // 0.4 hours ago
        end_time: null,
    },
    {
        uid: "01H1G5JRVN7XXBW2VKZS8C3Y9W",
        instance_uid: "01H1G5JRVN7XXBW2VKZS8C3Y6T",
        owner_id: 3,
        name: "Report Generation",
        commands: "python generate_report.py",
        result: null,
        status: "PENDING",
        create_time: new Date(Date.now() - 1000 * 60 * 60 * 0.2).toISOString(), // 0.2 hours ago
        start_time: null,
        end_time: null,
    },
    {
        uid: "01H1G5JRVN7XXBW2VKZS8C3Y0X",
        instance_uid: "01H1G5JRVN7XXBW2VKZS8C3Y6T",
        owner_id: 2,
        name: "Data Cleanup",
        commands: "python cleanup.py",
        result: {error: "Memory allocation failed"},
        status: "FAILED",
        create_time: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(), // 1.5 hours ago
        start_time: new Date(Date.now() - 1000 * 60 * 60 * 1.4).toISOString(), // 1.4 hours ago
        end_time: new Date(Date.now() - 1000 * 60 * 60 * 1.3).toISOString(), // 1.3 hours ago
    },
    {
        uid: "01H1G5JRVN7XXBW2VKZS8C3Y1Y",
        instance_uid: "01H1G5JRVN7XXBW2VKZS8C3Y6T",
        owner_id: 1,
        name: "Feature Extraction",
        commands: "python extract_features.py",
        result: {features_extracted: 75},
        status: "COMPLETED",
        create_time: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
        start_time: new Date(Date.now() - 1000 * 60 * 60 * 7.9).toISOString(), // 7.9 hours ago
        end_time: new Date(Date.now() - 1000 * 60 * 60 * 7.2).toISOString(), // 7.2 hours ago
    },
    {
        uid: "01H1G5JRVN7XXBW2VKZS8C3Y2Z",
        instance_uid: "01H1G5JRVN7XXBW2VKZS8C3Y6T",
        owner_id: 3,
        name: "Model Evaluation",
        commands: "python evaluate_model.py",
        result: {precision: 0.88, recall: 0.91},
        status: "COMPLETED",
        create_time: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(), // 10 hours ago
        start_time: new Date(Date.now() - 1000 * 60 * 60 * 9.8).toISOString(), // 9.8 hours ago
        end_time: new Date(Date.now() - 1000 * 60 * 60 * 9.1).toISOString(), // 9.1 hours ago
    },
]

export function TaskPage() {
    const [timeRange, setTimeRange] = useState("12h")
    const [refreshInterval, setRefreshInterval] = useState<string>("off")
    const [lastRefreshTime, setLastRefreshTime] = useState(new Date())

    // Filter tasks based on time range
    const filterTasksByTime = (tasks: typeof mockTasks) => {
        const now = new Date()
        const hours = Number.parseInt(timeRange.replace("h", ""))
        const cutoffTime = subHours(now, hours)

        return tasks.filter((task) => {
            const createTime = new Date(task.create_time)
            return createTime >= cutoffTime
        })
    }

    // Force refresh function
    const handleForceRefresh = () => {
        setLastRefreshTime(new Date())
        // Here you would typically refetch data from your API
        console.log("Force refreshing data...")
    }

    // Auto refresh effect
    useEffect(() => {
        if (refreshInterval === "off") return

        const intervalMs = {
            "5s": 5000,
            "10s": 10000,
            "30s": 30000,
            "1m": 60000,
            "5m": 300000,
        }[refreshInterval]

        if (!intervalMs) return

        const interval = setInterval(() => {
            setLastRefreshTime(new Date())
            // Here you would typically refetch data from your API
            console.log(`Auto refreshing data every ${refreshInterval}`)
        }, intervalMs)

        return () => clearInterval(interval)
    }, [refreshInterval])


    const filteredTasks = filterTasksByTime(mockTasks)

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
                    <Tabs defaultValue="12h" className="space-y-4" onValueChange={setTimeRange}>
                        <div className="flex justify-between items-center">
                            <TabsList>
                                <TabsTrigger value="3h">Last 3 Hours</TabsTrigger>
                                <TabsTrigger value="6h">Last 6 Hours</TabsTrigger>
                                <TabsTrigger value="12h">Last 12 Hours</TabsTrigger>
                            </TabsList>
                            <div className="flex items-center gap-2 mt-4 md:mt-0">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Clock className="mr-1 h-4 w-4"/>
                                    Last updated: {format(lastRefreshTime, "HH:mm:ss")}
                                </div>
                                <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Auto refresh" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="off">No refresh</SelectItem>
                                        <SelectItem value="5s">Every 5s</SelectItem>
                                        <SelectItem value="10s">Every 10s</SelectItem>
                                        <SelectItem value="30s">Every 30s</SelectItem>
                                        <SelectItem value="1m">Every 1m</SelectItem>
                                        <SelectItem value="5m">Every 5m</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Button variant="outline" size="icon" onClick={handleForceRefresh}>
                                    <RefreshCw className="h-4 w-4" />
                                    <span className="sr-only">Force refresh</span>
                                </Button>
                            </div>
                        </div>

                        <TabsContent value="3h" className="space-y-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-md font-medium">Task Execution Timeline (Last 3 Hours)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <TaskGanttChart tasks={filteredTasks} timeRange={3}/>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="6h" className="space-y-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-md font-medium">Task Execution Timeline (Last 6 Hours)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <TaskGanttChart tasks={filteredTasks} timeRange={6}/>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="12h" className="space-y-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-md font-medium">Task Execution Timeline (Last 12 Hours)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <TaskGanttChart tasks={filteredTasks} timeRange={12}/>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-md font-medium">Task List</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <TaskTable tasks={filteredTasks}/>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{filteredTasks.length}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center">
                                    <div className="text-2xl font-bold">{filteredTasks.filter((t) => t.status === "COMPLETED").length}</div>
                                    <TaskStatusBadge status="COMPLETED" className="ml-2"/>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Running</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center">
                                    <div className="text-2xl font-bold">{filteredTasks.filter((t) => t.status === "RUNNING").length}</div>
                                    <TaskStatusBadge status="RUNNING" className="ml-2"/>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center">
                                    <div className="text-2xl font-bold">{filteredTasks.filter((t) => t.status === "FAILED").length}</div>
                                    <TaskStatusBadge status="FAILED" className="ml-2"/>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </SidebarInset>
    )
}
