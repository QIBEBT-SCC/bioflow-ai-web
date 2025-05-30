import {useTaskMonitor} from "@/hooks/use-instance.tsx";
import {useParams} from "react-router-dom";
import * as echarts from "echarts"
import {useEffect, useRef} from "react";

export function TaskRecordPage() {
    const {taskUid = ''} = useParams();
    const {data: records = [], isLoading: recordLoading} = useTaskMonitor(taskUid)

    // refs for each chart
    const cpuRef = useRef<HTMLDivElement>(null);
    const memUsageRef = useRef<HTMLDivElement>(null);
    const memUsedRef = useRef<HTMLDivElement>(null);
    const ioRef = useRef<HTMLDivElement>(null);

    // chart instances and observers
    const cpuChartInstance = useRef<echarts.ECharts | null>(null);
    const memUsageChartInstance = useRef<echarts.ECharts | null>(null);
    const memUsedChartInstance = useRef<echarts.ECharts | null>(null);
    const ioChartInstance = useRef<echarts.ECharts | null>(null);
    const cpuResizeObserver = useRef<ResizeObserver | null>(null);
    const memUsageResizeObserver = useRef<ResizeObserver | null>(null);
    const memUsedResizeObserver = useRef<ResizeObserver | null>(null);
    const ioResizeObserver = useRef<ResizeObserver | null>(null);

    // Helper to extract x/y data
    const times = records.map(r => r.time);
    const cpuData = records.map(r => r.cpu_usage);
    const memUsageData = records.map(r => r.mem_usage);
    const memUsedData = records.map(r => r.mem_used);
    const ioInData = records.map(r => r.io_in);
    const ioOutData = records.map(r => r.io_out);

    // CPU Chart
    useEffect(() => {
        if (recordLoading || records.length === 0) {
            if (cpuChartInstance.current) {
                cpuResizeObserver.current?.disconnect();
                cpuChartInstance.current.dispose();
                cpuChartInstance.current = null;
                cpuResizeObserver.current = null;
            }
            return;
        }
        if (cpuRef.current) {
            if (!cpuChartInstance.current) {
                cpuChartInstance.current = echarts.init(cpuRef.current);
                cpuResizeObserver.current = new ResizeObserver(() => {
                    cpuChartInstance.current?.resize();
                });
                cpuResizeObserver.current.observe(cpuRef.current);
            }
            cpuChartInstance.current.setOption({
                title: {text: 'CPU占用'},
                tooltip: {trigger: 'axis'},
                xAxis: {type: 'category', data: times},
                yAxis: {type: 'value', name: '%'},
                series: [{name: 'CPU占用', type: 'line', data: cpuData, smooth: true}]
            });
        }
        return () => {
            cpuResizeObserver.current?.disconnect();
            cpuChartInstance.current?.dispose();
            cpuChartInstance.current = null;
            cpuResizeObserver.current = null;
        }
    }, [records, recordLoading]);

    // 内存占用 Chart
    useEffect(() => {
        if (recordLoading || records.length === 0) {
            if (memUsageChartInstance.current) {
                memUsageResizeObserver.current?.disconnect();
                memUsageChartInstance.current.dispose();
                memUsageChartInstance.current = null;
                memUsageResizeObserver.current = null;
            }
            return;
        }
        if (memUsageRef.current) {
            if (!memUsageChartInstance.current) {
                memUsageChartInstance.current = echarts.init(memUsageRef.current);
                memUsageResizeObserver.current = new ResizeObserver(() => {
                    memUsageChartInstance.current?.resize();
                });
                memUsageResizeObserver.current.observe(memUsageRef.current);
            }
            memUsageChartInstance.current.setOption({
                title: {text: '内存占用'},
                tooltip: {trigger: 'axis'},
                xAxis: {type: 'category', data: times},
                yAxis: {type: 'value', name: '%'},
                series: [{name: '内存占用', type: 'line', data: memUsageData, smooth: true}]
            });
        }
        return () => {
            memUsageResizeObserver.current?.disconnect();
            memUsageChartInstance.current?.dispose();
            memUsageChartInstance.current = null;
            memUsageResizeObserver.current = null;
        }
    }, [records, recordLoading]);

    // 实际内存使用 Chart
    useEffect(() => {
        if (recordLoading || records.length === 0) {
            if (memUsedChartInstance.current) {
                memUsedResizeObserver.current?.disconnect();
                memUsedChartInstance.current.dispose();
                memUsedChartInstance.current = null;
                memUsedResizeObserver.current = null;
            }
            return;
        }
        if (memUsedRef.current) {
            if (!memUsedChartInstance.current) {
                memUsedChartInstance.current = echarts.init(memUsedRef.current);
                memUsedResizeObserver.current = new ResizeObserver(() => {
                    memUsedChartInstance.current?.resize();
                });
                memUsedResizeObserver.current.observe(memUsedRef.current);
            }
            memUsedChartInstance.current.setOption({
                title: {text: '实际内存使用'},
                tooltip: {trigger: 'axis'},
                xAxis: {type: 'category', data: times},
                yAxis: {type: 'value', name: 'MB'},
                series: [{name: '实际内存使用', type: 'line', data: memUsedData, smooth: true}]
            });
        }
        return () => {
            memUsedResizeObserver.current?.disconnect();
            memUsedChartInstance.current?.dispose();
            memUsedChartInstance.current = null;
            memUsedResizeObserver.current = null;
        }
    }, [records, recordLoading]);

    // IO Chart
    useEffect(() => {
        if (recordLoading || records.length === 0) {
            if (ioChartInstance.current) {
                ioResizeObserver.current?.disconnect();
                ioChartInstance.current.dispose();
                ioChartInstance.current = null;
                ioResizeObserver.current = null;
            }
            return;
        }
        if (ioRef.current) {
            if (!ioChartInstance.current) {
                ioChartInstance.current = echarts.init(ioRef.current);
                ioResizeObserver.current = new ResizeObserver(() => {
                    ioChartInstance.current?.resize();
                });
                ioResizeObserver.current.observe(ioRef.current);
            }
            ioChartInstance.current.setOption({
                title: {text: 'IO流量'},
                tooltip: {trigger: 'axis'},
                legend: {data: ['IO In', 'IO Out']},
                xAxis: {type: 'category', data: times},
                yAxis: {type: 'value', name: 'MB/s'},
                series: [
                    {name: 'IO In', type: 'line', data: ioInData, smooth: true},
                    {name: 'IO Out', type: 'line', data: ioOutData, smooth: true}
                ]
            });
        }
        return () => {
            ioResizeObserver.current?.disconnect();
            ioChartInstance.current?.dispose();
            ioChartInstance.current = null;
            ioResizeObserver.current = null;
        }
    }, [records, recordLoading]);

    if (recordLoading) {
        return <div className="w-full h-[200px] flex items-center justify-center text-muted-foreground">加载中...</div>;
    }
    if (records.length === 0) {
        return <div className="w-full h-[200px] text-center">暂无监控数据</div>;
    }

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
            <div ref={cpuRef} style={{width: '100%', height: 260, background: '#fff', borderRadius: 8}} />
            <div ref={memUsageRef} style={{width: '100%', height: 260, background: '#fff', borderRadius: 8}} />
            <div ref={memUsedRef} style={{width: '100%', height: 260, background: '#fff', borderRadius: 8}} />
            <div ref={ioRef} style={{width: '100%', height: 260, background: '#fff', borderRadius: 8}} />
        </div>
    )
}