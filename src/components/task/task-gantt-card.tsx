"use client"

import React from "react"
import {useEffect, useRef} from "react"
import {format, subHours} from "date-fns"
import * as echarts from "echarts"
import {useRecentTasks} from "@/hooks/use-instance.tsx";
import {Status} from "@/types/task.tsx";
import {renderToString} from "react-dom/server";
import {Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {ToggleGroup, ToggleGroupItem} from "@/components/ui/toggle-group.tsx";
import {useTaskStore} from "@/stores/task-store.tsx";

function TaskGanttChart({timeRange}: { timeRange: number }) {
    const {data: tasks = [], isLoading: dataLoading} = useRecentTasks(timeRange);

    const chartRef = useRef<HTMLDivElement>(null)
    const chartInstance = useRef<echarts.ECharts | null>(null)
    const resizeObserver = useRef<ResizeObserver | null>(null)

    useEffect(() => {
        if (dataLoading || tasks.length === 0) {
            if (chartInstance.current) {
                resizeObserver.current?.disconnect();
                chartInstance.current.dispose();
                chartInstance.current = null;
                resizeObserver.current = null;
            }
            return;
        }

        if (chartRef.current) {
            if (!chartInstance.current) {
                chartInstance.current = echarts.init(chartRef.current);

                resizeObserver.current = new ResizeObserver(() => {
                    chartInstance.current?.resize();
                });
                resizeObserver.current.observe(chartRef.current);
            }

            const now = new Date()
            const startTimeBoundary = subHours(now, timeRange)

            const data: never[] = []
            const taskNames: string[] = []

            tasks.forEach((task, index) => {
                taskNames.push(task.name)
                const taskStartTime = new Date(task?.start_time ?? '')
                const taskEndTime = task.end_time ? new Date(task.end_time) : now

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

                // @ts-expect-error no need
                data.push({
                    name: task.name,
                    value: [index, taskStartTime, taskEndTime, task.status],
                    itemStyle: {
                        color,
                    },
                })
            })

            const option: echarts.EChartsOption = {
                tooltip: {
                    formatter: (params) => {
                        // @ts-expect-error no need
                        const itemData = params.data
                        const status = itemData.value[3]
                        const sTime = format(itemData.value[1], "HH:mm:ss")
                        const eTime = format(itemData.value[2], "HH:mm:ss")
                        const durationMs = itemData.value[2].getTime() - itemData.value[1].getTime()
                        const durationMinutes = Math.floor(durationMs / (1000 * 60))
                        const durationSeconds = Math.floor((durationMs % (1000 * 60)) / 1000)
                        const duration = durationMinutes > 0 ? `${durationMinutes}m ${durationSeconds}s` : `${durationSeconds}s`
                        return renderToString(
                            React.createElement('div', null,
                                React.createElement('b', null, itemData.name), React.createElement('br'),
                                `Status: ${Status[status]}`, React.createElement('br'),
                                `Start: ${sTime}`, React.createElement('br'),
                                `${status === Status.RUNNING ? "Current" : "End"}: ${eTime}`, React.createElement('br'),
                                `Duration: ${duration}`
                            )
                        );
                    },
                },
                grid: {
                    height: 150,
                    right: 30,
                    top: 20,
                    bottom: 30,
                    left: 20,
                },
                xAxis: {
                    type: "time",
                    min: startTimeBoundary.getTime(),
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
                        renderItem: (_, api) => {
                            const categoryIndex = api.value(0)
                            const start = api.coord([api.value(1), categoryIndex])
                            const end = api.coord([api.value(2), categoryIndex])
                            const height = 20
                            const status = api.value(3)

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
                                                text: Status[status],
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
                                            // @ts-expect-error no need
                                            text: Status[status], 
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
                ],
                // dataZoom: [
                //     {
                //         type: 'slider',
                //         yAxisIndex: 0,
                //         orient: 'vertical',
                //         right: 10,
                //         width: 16,
                //         handleSize: 20,
                //         show: true,
                //         start: 0,
                //         end: 100,
                //     }
                // ],
            }

            chartInstance.current.setOption(option)
        } else if (!dataLoading && tasks.length > 0) {
            console.error("TaskGanttChart: chartRef.current is null, but data is loaded and tasks exist. This is unexpected.");
        }

        return () => {
            if (chartInstance.current) {
                resizeObserver.current?.disconnect();
                chartInstance.current.dispose();
                chartInstance.current = null;
                resizeObserver.current = null;
            }
        };
    }, [tasks, timeRange, dataLoading]);

    if (dataLoading) {
        return (
            <div className="w-full h-[200px] flex items-center justify-center text-muted-foreground">
                加载中...
            </div>
        )
    }

    if (tasks.length === 0) {
        return (
            <div className="w-full h-[200px] text-center">
                近期没有活动
            </div>
        )
    }

    return <div ref={chartRef} style={{width: "100%", height: "200px"}}/>
}


export function TaskGanttCard() {
    const {timeRange, setTimeRange} = useTaskStore()

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-0">
                    <CardTitle className="text-md font-medium">Task Execution Timeline</CardTitle>
                    <CardDescription>{`Total for the last ${timeRange} hours`}</CardDescription>
                    <CardAction>
                        <ToggleGroup
                            type="single"
                            value={timeRange}
                            onValueChange={setTimeRange}
                            variant="outline"
                        >
                            <ToggleGroupItem value="1">Last 1 Hours</ToggleGroupItem>
                            <ToggleGroupItem value="3">Last 3 Hours</ToggleGroupItem>
                            <ToggleGroupItem value="6">Last 6 Hours</ToggleGroupItem>
                            <ToggleGroupItem value="12">Last 12 Hours</ToggleGroupItem>
                        </ToggleGroup>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    <TaskGanttChart timeRange={Number(timeRange)}/>
                </CardContent>
            </Card>
        </div>
    )
}