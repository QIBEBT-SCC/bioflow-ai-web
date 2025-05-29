"use client"

import {useEffect, useRef, useState} from "react"
import {format, subHours} from "date-fns"
import * as echarts from "echarts"
import {useRecentTasks} from "@/hooks/use-instance.tsx";
import {Status} from "@/types/instance.tsx";
import {renderToString} from "react-dom/server";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";
import {Clock, RefreshCw} from "lucide-react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {useQueryClient} from "@tanstack/react-query";

function TaskGanttChart({timeRange}: { timeRange: number }) {
    const {data: tasks = []} = useRecentTasks(timeRange);

    const chartRef = useRef<HTMLDivElement>(null)
    const chartInstance = useRef<echarts.ECharts | null>(null)

    useEffect(() => {
        // Initialize chart
        if (chartRef.current) {
            chartInstance.current = echarts.init(chartRef.current)
        }

        // Handle resize
        const handleResize = () => {
            chartInstance.current?.resize()
        }

        window.addEventListener("resize", handleResize)

        return () => {
            chartInstance.current?.dispose()
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    useEffect(() => {
        if (!chartInstance.current) return

        const now = new Date()
        const startTime = subHours(now, timeRange)

        // Prepare data for ECharts
        const data: any[] = []
        const taskNames: string[] = []

        tasks.forEach((task, index) => {
            taskNames.push(task.name)

            // For started tasks
            const startTime = new Date(task?.start_time ?? '')
            const endTime = task.end_time ? new Date(task.end_time) : now

            let color
            switch (task.status) {
                case Status.SUCCESS:
                    color = "#10b981" // green-500
                    break
                case Status.RUNNING:
                    color = "#3b82f6" // blue-500
                    break
                case Status.ERROR:
                    color = "#ef4444" // red-500
                    break
                default:
                    color = "#9ca3af" // gray-400
            }

            data.push({
                name: task.name,
                value: [index, startTime, endTime, task.status], // Store status in value[3]
                itemStyle: {
                    color,
                },
            })

        })

        // Configure chart options
        const option: echarts.EChartsOption = {
            tooltip: {
                formatter: (params: any) => {
                    const data = params.data
                    const status = data.value[3] // Get status from value[3]
                    const startTime = format(data.value[1], "HH:mm:ss")

                    const endTime = format(data.value[2], "HH:mm:ss")
                    const durationMs = data.value[2].getTime() - data.value[1].getTime()
                    const durationMinutes = Math.floor(durationMs / (1000 * 60))
                    const durationSeconds = Math.floor((durationMs % (1000 * 60)) / 1000)
                    const duration = durationMinutes > 0 ? `${durationMinutes}m ${durationSeconds}s` : `${durationSeconds}s`

                    return renderToString(
                        <div>
                            <b>{data.name}</b><br/>
                            Status: {Status[status]}<br/>
                            Start: {startTime}<br/>
                            {status === Status.RUNNING ? "Current" : "End"}: {endTime}<br/>
                            Duration: {duration}
                        </div>
                    )
                },
            },
            grid: {
                height: 100,
                right: 30,
                top: 20,
                bottom: 30,
                left: 20,
            },
            xAxis: {
                type: "time",
                min: startTime.getTime(),
                max: now.getTime(),
                axisLabel: {
                    formatter: (value: number) => {
                        return format(new Date(value), "HH:mm")
                    },
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: "dashed",
                        color: "#e5e7eb", // gray-200
                    },
                },
            },
            yAxis: {
                type: "category",
                data: taskNames,
                axisLabel: {
                    show: false
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: "dashed",
                        color: "#e5e7eb", // gray-200
                    },
                },
            },
            series: [
                {
                    type: "custom",
                    renderItem: (params, api) => {
                        const categoryIndex = api.value(0)
                        const start = api.coord([api.value(1), categoryIndex])
                        const end = api.coord([api.value(2), categoryIndex])
                        const height = 20
                        const status = api.value(3) // Get status from value[3]

                        // For running tasks, add a gradient effect
                        if (status === Status.RUNNING) {
                            return {
                                type: "group",
                                children: [
                                    {
                                        type: "rect",
                                        shape: {
                                            x: start[0],
                                            y: start[1] - height / 2,
                                            width: end[0] - start[0],
                                            height: height,
                                            r: 3,
                                        },
                                        style: {
                                            fill: "#3b82f6", // blue-500
                                            stroke: "#2563eb", // blue-600
                                            lineWidth: 1,
                                        },
                                    },
                                    {
                                        type: "text",
                                        style: {
                                            text: status,
                                            textFill: "#ffffff",
                                            textFont: "10px sans-serif",
                                            textAlign: "center",
                                            textVerticalAlign: "middle",
                                        },
                                        position: [start[0] + (end[0] - start[0]) / 2, start[1]],
                                    },
                                ],
                            }
                        }

                        // For other tasks (completed, failed)
                        return {
                            type: "group",
                            children: [
                                {
                                    type: "rect",
                                    shape: {
                                        x: start[0],
                                        y: start[1] - height / 2,
                                        width: end[0] - start[0],
                                        height: height,
                                        r: 3,
                                    },
                                    style: {fill: api.visual('color')},
                                },
                                {
                                    type: "text",
                                    style: {
                                        text: status,
                                        textFill: "#ffffff",
                                        textFont: "10px sans-serif",
                                        textAlign: "center",
                                        textVerticalAlign: "middle",
                                    },
                                    position: [start[0] + (end[0] - start[0]) / 2, start[1]],
                                },
                            ],
                        }
                    },
                    encode: {
                        x: [1, 2],
                        y: 0,
                    },
                    data: data,
                },
                // Current time marker
                {
                    type: "line",
                    markLine: {
                        symbol: "none",
                        lineStyle: {
                            color: "#ef4444", // red-500
                            type: "solid",
                            width: 2,
                        },
                        label: {
                            formatter: "Now",
                            position: "start",
                        },
                        data: [
                            {
                                xAxis: now.getTime(),
                            },
                        ],
                    },
                    data: [],
                },

            ],
            dataZoom: [
                {
                    type: 'slider',
                    yAxisIndex: 0,
                    orient: 'vertical',
                    right: 10,
                    width: 16,
                    handleSize: 20,
                    show: true,
                    start: 0,
                    end: 100,
                }
            ],
        }

        chartInstance.current.setOption(option)
    }, [tasks, timeRange])

    if (tasks.length ===0){
        return (
            <div className="w-full h-[100px] text-center">
                近期没有活动
            </div>
        )
    }

    return <div ref={chartRef} style={{width: "100%", height: "150px"}}/>
}


export function TaskGanttCard() {
    const queryClient = useQueryClient();

    const [refreshInterval, setRefreshInterval] = useState<string>("off")
    const [lastRefreshTime, setLastRefreshTime] = useState(new Date())
    const [timeRange, setTimeRange] = useState("12")

    // Force refresh function
    const handleForceRefresh = () => {
        setLastRefreshTime(new Date())
        // Here you would typically refetch data from your API
        queryClient.invalidateQueries({queryKey: ['recentTasks', 1]}).then();
        queryClient.invalidateQueries({queryKey: ['recentTasks', 3]}).then();
        queryClient.invalidateQueries({queryKey: ['recentTasks', 6]}).then();
        queryClient.invalidateQueries({queryKey: ['recentTasks', 12]}).then();
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
            setLastRefreshTime(new Date())
            // Here you would typically refetch data from your API
            queryClient.invalidateQueries({queryKey: ['recentTasks', Number(timeRange)]}).then();
        }, intervalMs)

        return () => clearInterval(interval)
    }, [refreshInterval])
    return (
        <div className="space-y-4">
            <Tabs defaultValue="12" onValueChange={setTimeRange}>
                <div className="flex justify-between items-center">
                    <TabsList>
                        <TabsTrigger value="1">1 Hours</TabsTrigger>
                        <TabsTrigger value="3">3 Hours</TabsTrigger>
                        <TabsTrigger value="6">6 Hours</TabsTrigger>
                        <TabsTrigger value="12">12 Hours</TabsTrigger>
                    </TabsList>
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
            </Tabs>
            <Card>
                <CardHeader className="pb-0">
                    <CardTitle className="text-md font-medium">{`Task Execution Timeline (Last ${timeRange} Hours)`}</CardTitle>
                </CardHeader>
                <CardContent>
                    <TaskGanttChart timeRange={Number(timeRange)}/>
                </CardContent>
            </Card>
        </div>
    )
}