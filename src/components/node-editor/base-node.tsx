"use client"

import {Handle, NodeResizer, Position, useEdges, useNodeId} from '@xyflow/react';
import * as React from "react";

// 基础类型定义
interface HandleConfig {
    id: number;
    argName: string;
    description: string;
}

interface NodeProps {
    handles: {
        inputs: HandleConfig[];
        outputs: HandleConfig[];
    };
    nodeComponent: React.ReactNode;
}

interface ResizeNodeProps {
    handles: {
        inputs: HandleConfig[];
        outputs: HandleConfig[];
    };
    nodeComponent: React.ReactNode;
    minW: number;
    minH: number;
    onResize: () => void;
}

interface HandleProps {
    id: number;
    argName: string;
    type: 'source' | 'target';
    position: Position;
    description: string;
}

// 基础 Handle 组件
const NodeHandle = ({id, argName, type, position, description,}: HandleProps) => {
    const nodeId = useNodeId();
    const edges = useEdges();

    const handleId = `${nodeId}-${type === 'source' ? 'out' : 'in'}-${argName}`
    const topPos = (id + 1) * 6

    const isConnected = () => {
        return edges.some(edge => edge.sourceHandle === handleId || edge.targetHandle === handleId);
    };

    return (
        <>
            <span
                className={`absolute text-xs text-neutral-500 ${position === Position.Left ? 'left-6' : 'right-6'} transform -translate-y-1/2`}
                style={{top: `calc(var(--spacing) * ${topPos})`}}
            >
                {description}
            </span>
            <Handle
                id={handleId}
                type={type}
                position={position}
                style={{top: `calc(var(--spacing) * ${topPos})`}}
                className={`w-3 h-3 ${position === Position.Left ? '!left-3' : '!right-3'} rounded-full border-2 ${type === 'target' ? 'border-green-400' : 'border-blue-400'} shadow-sm transition-all duration-200 hover:scale-110 ${isConnected() ? type === 'target' ? '!bg-green-400' : '!bg-blue-400' : '!bg-white'}`}
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
                    argName={input.argName}
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
                    argName={output.argName}
                    type="source"
                    position={Position.Right}
                    description={output.description}
                />
            ))}
        </div>
    );
};

export const BaseResizeableNode = ({handles, nodeComponent, onResize, minW, minH}: ResizeNodeProps) => {
    return (
        <div
            className={`flex h-full w-full relative font-sans shadow-lg rounded-xl overflow-hidden`}
            style={{minWidth: `${minW}px`, minHeight: `${minH}px`}}
        >
            {/* Input handles */}
            {handles.inputs.map((input) => (
                <NodeHandle
                    key={`in${input.id}`}
                    id={input.id}
                    argName={input.argName}
                    type="target"
                    position={Position.Left}
                    description={input.description}
                />
            ))}

            <NodeResizer
                color="#ffff"
                onResizeEnd={() => {
                    console.log('resized');
                    onResize()
                }}
                minHeight={minH}
                minWidth={minW}
            />
            {nodeComponent}

            {/* Output handles */}
            {handles.outputs.map((output) => (
                <NodeHandle
                    key={`out${output.id}`}
                    id={output.id}
                    argName={output.argName}
                    type="source"
                    position={Position.Right}
                    description={output.description}
                />
            ))}
        </div>
    )
}