"use client"

import {useEffect, useRef} from "react"
import {format, subHours} from "date-fns"
import * as echarts from "echarts"
import {useRecentTasks} from "@/hooks/use-instance.tsx";
import {Status} from "@/types/instance.tsx";
import {renderToString} from "react-dom/server";

export function TaskGanttChart({timeRange}: { timeRange: number }) {
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
                            <b>${data.name}</b><br/>
                            Status: ${status}<br/>
                            Start: ${startTime}<br/>
                            ${status === Status.RUNNING ? "Current" : "End"}: ${endTime}<br/>
                            Duration: ${duration}
                        </div>
                    )
                },
            },
            grid: {
                height: 300,
                right: 20,
                top: 20,
                bottom: 30,
                left: 150,
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
                    formatter: (value: string) => {
                        // Truncate long task names
                        return value.length > 20 ? value.substring(0, 17) + "..." : value
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
            series: [
                {
                    type: "custom",
                    renderItem: (params, api) => {
                        const categoryIndex = api.value(0)
                        const start = api.coord([api.value(1), categoryIndex])
                        const end = api.coord([api.value(2), categoryIndex])
                        const height = api.size([0, 1])[1] * 0.6
                        const status = api.value(3) // Get status from value[3]

                        // For pending tasks, just show a circle
                        if (status === "PENDING") {
                            return {
                                type: "circle",
                                shape: {
                                    cx: start[0],
                                    cy: start[1],
                                    r: 4,
                                },
                                style: api.style(),
                            }
                        }

                        // For running tasks, add a gradient effect
                        if (status === "RUNNING") {
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
                                    style: api.style(),
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
        }

        chartInstance.current.setOption(option)
    }, [tasks, timeRange])

    return <div ref={chartRef} style={{width: "100%", height: "350px"}}/>
}
