"use client"

import {Handle, Position, useStore} from '@xyflow/react';
import * as React from "react";

// 基础类型定义
interface BaseNodeData {
    prefix: string;
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
    nodeComponent: React.ReactNode
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
export const BaseToolNode = ({data, handles, nodeComponent}: NodeProps) => {

    const edges = useStore((state) => state.edges);


    const isHandleConnected = (handleId: string) => {
        return edges.some(edge => edge.sourceHandle === handleId || edge.targetHandle === handleId);
    };

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

            {nodeComponent}

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