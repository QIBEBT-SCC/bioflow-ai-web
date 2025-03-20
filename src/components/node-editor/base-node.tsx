"use client"

import {Handle, Position, useStore} from '@xyflow/react';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Info} from "lucide-react";
import {useState, useEffect} from 'react';

// 基础类型定义
interface BaseNodeData {
    title: string;
    prefix: string;
    description: string;
    defaultArgs: string;
}

interface HandleConfig {
    id: number;
    description: string;
}

interface NodeProps {
    data: BaseNodeData;
    handles: {
        inputs: HandleConfig[];
        outputs: HandleConfig[];
    };
}

// 基础 Handle 组件
const NodeHandle = ({
                        id,
                        prefix,
                        type,
                        position,
                        description,
                        isConnected,
                    }: {
    id: number;
    prefix: string;
    type: 'source' | 'target';
    position: Position;
    description: string;
    isConnected: boolean;
}) => {
    const topPos = (id + 1) * 6

    return (
        <>
            <p className={`absolute text-xs text-neutral-400 ${position === Position.Left ? 'left-5' : 'right-5'} top-${topPos} transform -translate-y-1/2`}>
                {description}
            </p>
            <Handle
                id={`${prefix}-${type === 'source' ? 'out' : 'in'}${id}`}
                type={type}
                position={position}
                style={{top: `calc(var(--spacing) * ${topPos})`}}
                className={`w-2.5 h-2.5 ${position === Position.Left ? '!left-2.5' : '!right-2.5'} rounded-full border-2 ${type === 'target' ? 'border-green-400' : '!border-blue-400'} shadow-sm transition-all duration-200 hover:scale-110 ${isConnected ? `!bg-${type === 'target' ? 'green' : 'blue'}-400` : '!bg-white'}`}
            />
        </>
    );
};

// 基础节点组件
export const BaseToolNode = ({data, handles}: NodeProps) => {
    const [args, setArgs] = useState(data.defaultArgs);
    const edges = useStore((state) => state.edges);

    useEffect(() => {
        setArgs(data.defaultArgs);
    }, [data.defaultArgs]);

    const isHandleConnected = (handleId: string) => {
        return edges.some(edge => edge.sourceHandle === handleId || edge.targetHandle === handleId);
    };

    const topPadding = 4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))

    return (
        <div className="flex justify-center relative">
            {/* Input handles */}
            {handles.inputs.map((input) => (
                <NodeHandle
                    key={`${data.prefix}-in${input.id}`}
                    id={input.id}
                    prefix={data.prefix}
                    type="target"
                    position={Position.Left}
                    description={input.description}
                    isConnected={isHandleConnected(`${data.prefix}-in${input.id}`)}
                />
            ))}

            <Card className="w-[350px] py-0 gap-0 bg-gray-50 shadow-lg">
                <CardHeader className="nodeDragable h-8 py-2 bg-fuchsia-400 rounded-t-xl flex flex-row items-center">
                    <CardTitle>{data.title}</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger><Info className="w-3 h-3 text-gray-600"/></TooltipTrigger>
                            <TooltipContent>
                                <p>{data.description}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardHeader>
                <CardContent className="pb-4" style={{paddingTop: `calc(var(--spacing) * ${topPadding})`}}>
                    <Label className="pb-2 font-medium">Args:</Label>
                    <Textarea
                        className="h-[80px] text-sm resize-none bg-white overflow-y-auto !focus:ring-1"
                        placeholder="Enter arguments here..."
                        value={args}
                        onChange={(e) => {
                            setArgs(e.target.value);
                            data.defaultArgs = e.target.value;
                        }}
                    />
                </CardContent>
            </Card>

            {/* Output handles */}
            {handles.outputs.map((output) => (
                <NodeHandle
                    key={`${data.prefix}-out${output.id}`}
                    id={output.id}
                    prefix={data.prefix}
                    type="source"
                    position={Position.Right}
                    description={output.description}
                    isConnected={isHandleConnected(`${data.prefix}-out${output.id}`)}
                />
            ))}
        </div>
    );
};