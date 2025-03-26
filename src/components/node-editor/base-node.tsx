"use client"

import {Handle, Position, useEdges, useNodeId} from '@xyflow/react';
import * as React from "react";

// 基础类型定义
interface HandleConfig {
    id: number;
    description: string;
}

interface NodeProps {
    handles: {
        inputs: HandleConfig[];
        outputs: HandleConfig[];
    };
    nodeComponent: React.ReactNode
}

interface HandleProps {
    id: number;
    type: 'source' | 'target';
    position: Position;
    description: string;
}

// 基础 Handle 组件
const NodeHandle = ({id, type, position, description,}: HandleProps) => {
    const nodeId = useNodeId();
    const edges = useEdges();

    const isConnected = () => {
        return edges.some(edge => edge.sourceHandle === nodeId || edge.targetHandle === nodeId);
    };

    const topPos = (id + 1) * 6

    return (
        <>
            <p className={`absolute text-xs text-neutral-400 ${position === Position.Left ? 'left-5' : 'right-5'} transform -translate-y-1/2`}
               style={{top: `calc(var(--spacing) * ${topPos})`}}
            >
                {description}
            </p>
            <Handle
                id={`${nodeId}-${type === 'source' ? 'out' : 'in'}${id}`}
                type={type}
                position={position}
                style={{top: `calc(var(--spacing) * ${topPos})`}}
                className={`w-2.5 h-2.5 ${position === Position.Left ? '!left-2.5' : '!right-2.5'} rounded-full border-2 ${type === 'target' ? 'border-green-400' : 'border-blue-400'} shadow-sm transition-all duration-200 hover:scale-110 ${isConnected() ? type === 'target' ? '!bg-green-400' : '!bg-blue-400' : '!bg-white'}`}
            />
        </>
    );
};

// 基础节点组件
export const BaseToolNode = ({handles, nodeComponent}: NodeProps) => {
    return (
        <div className="flex justify-center relative">
            {/* Input handles */}
            {handles.inputs.map((input) => (
                <NodeHandle
                    key={`in${input.id}`}
                    id={input.id}
                    type="target"
                    position={Position.Left}
                    description={input.description}
                />
            ))}

            {nodeComponent}

            {/* Output handles */}
            {handles.outputs.map((output) => (
                <NodeHandle
                    key={`out${output.id}`}
                    id={output.id}
                    type="source"
                    position={Position.Right}
                    description={output.description}
                />
            ))}
        </div>
    );
};