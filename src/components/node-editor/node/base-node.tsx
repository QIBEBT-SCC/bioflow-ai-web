"use client"

import {Handle, NodeResizer, Position, useEdges, useNodeId} from '@xyflow/react';
import * as React from "react";
import {HandleDefine} from "@/types/node.tsx";

// 基础类型定义
interface NodeProps {
    handles: {
        inputs: HandleDefine[];
        outputs: HandleDefine[];
    };
    nodeComponent: React.ReactNode;
}

interface ResizeNodeProps {
    handles: {
        inputs: HandleDefine[];
        outputs: HandleDefine[];
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
    const topPos = (id + 2) * 6

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
            {handles.inputs.map((input, index) => (
                <NodeHandle
                    key={`in${index}`}
                    id={index}
                    argName={input.name}
                    type="target"
                    position={Position.Left}
                    description={input.name.replace("_", " ")}
                />
            ))}

            {nodeComponent}

            {/* Output handles */}
            {handles.outputs.map((output, index) => (
                <NodeHandle
                    key={`out${index}`}
                    id={index}
                    argName={output.name}
                    type="source"
                    position={Position.Right}
                    description={output.name.replace("_", " ")}
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
            {handles.inputs.map((input, index) => (
                <NodeHandle
                    key={`in${index}`}
                    id={index}
                    argName={input.name}
                    type="target"
                    position={Position.Left}
                    description={input.name.replace("_", " ")}
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
            {handles.outputs.map((output, index) => (
                <NodeHandle
                    key={`out${index}`}
                    id={index}
                    argName={output.name}
                    type="source"
                    position={Position.Right}
                    description={output.name.replace("_", " ")}
                />
            ))}
        </div>
    )
}