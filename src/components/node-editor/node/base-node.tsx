"use client"

import {Handle, Position, useEdges, useNodeId} from '@xyflow/react';
import * as React from "react";
import {HandleDefine} from "@/types/node.tsx";
import {cn} from "@/lib/utils.ts";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet.tsx";
import {InfoIcon} from "lucide-react";

// 基础类型定义
interface NodeProps {
    handles: {
        inputs: HandleDefine[];
        outputs: HandleDefine[];
    };
    nodeComponent: React.ReactNode;
}

interface BaseNodeProps {
    title: string;
    description: string;
    handles: {
        inputs: HandleDefine[];
        outputs: HandleDefine[];
    };
    color: {
        gradient: string
        indicatorColors: string[]
    }
    nodeComponent: React.ReactNode;
}

interface HandleProps {
    id: number;
    argName: string;
    type: 'source' | 'target';
    position: Position;
    description: string;
}


// 基础 Handle 组件
function NodeHandle({id, argName, type, position, description,}: HandleProps) {
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
}

// 基础节点组件
function BaseToolNode({handles, nodeComponent}: NodeProps) {
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
}

function BaseNode({title, description, handles, color, nodeComponent}: BaseNodeProps) {
    const nodeId = useNodeId();
    const edges = useEdges();

    const maxRows = Math.max(handles.inputs.length, handles.outputs.length);


    function isConnected(handleId: string) {
        return edges.some(edge => edge.sourceHandle === handleId || edge.targetHandle === handleId);
    }

    function topPos(index: number) {
        return (index + 2) * 6;
    }

    return (
        <NodeCard>
            <NodeCardHeader
                className={color.gradient}>
                <NodeTitle className="text-white">
                    {title}
                </NodeTitle>
                <Sheet>
                    <SheetTrigger><InfoIcon className="w-3 h-3 text-gray-300"/></SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>{title}</SheetTitle>
                            <SheetDescription>{description}</SheetDescription>
                        </SheetHeader>
                    </SheetContent>
                </Sheet>
            </NodeCardHeader>
            <NodeCardContent>
                {/*Handles */}
                {Array.from({length: maxRows}).map((_, index) => {
                    const input = handles.inputs[index]
                    const output = handles.outputs[index]

                    return (
                        <div key={index}>
                            {/* Input Handle */}
                            {input && (
                                <>
                                    <Handle
                                        id={`${nodeId}-in-${input.name}`}
                                        type="target"
                                        position={Position.Left}
                                        className={cn(
                                            "w-3 h-3 !left-3 rounded-full border-2 border-green-600 shadow-sm transition-all duration-200 hover:scale-110",
                                            isConnected(`${nodeId}-in-${input.name}`) ? "!bg-green-400" : "!bg-white"
                                        )}
                                        style={{top: `calc(var(--spacing) * ${topPos(index)})`}}
                                    />
                                    <span
                                        className="absolute text-xs text-gray-600 left-6 truncate transform -translate-y-1/2"
                                        style={{top: `calc(var(--spacing) * ${topPos(index)})`}}
                                    >
                                        {input.name.replace("_", " ")}
                                    </span>
                                </>
                            )}


                            {/* Output Handle */}
                            {output && (
                                <>
                                    <span
                                        className="absolute text-xs text-gray-600 right-6 truncate transform -translate-y-1/2"
                                        style={{top: `calc(var(--spacing) * ${topPos(index)})`}}
                                    >
                                        {output.name.replace("_", " ")}
                                    </span>
                                    <Handle
                                        id={`${nodeId}-out-${output.name}`}
                                        type="source"
                                        position={Position.Right}
                                        className={cn(
                                            "w-3 h-3 !right-3 rounded-full border-2 border-blue-600 shadow-sm transition-all duration-200 hover:scale-110",
                                            isConnected(`${nodeId}-out-${output.name}`) ? "!bg-blue-400" : "!bg-white"
                                        )}
                                        style={{top: `calc(var(--spacing) * ${topPos(index)})`}}
                                    />
                                </>
                            )}
                        </div>
                    )
                })}
                <div className="border-b border-gray-100 pb-3" style={{paddingTop: `calc(var(--spacing) * ${6 * maxRows})`}}/>

                {nodeComponent}
            </NodeCardContent>
            <NodeCardFooter>
                <div className={cn("w-2 h-2 rounded-full", color.indicatorColors[0])}></div>
                <div className={cn("w-2 h-2 rounded-full", color.indicatorColors[1])}></div>
                <div className={cn("w-2 h-2 rounded-full", color.indicatorColors[2])}></div>
            </NodeCardFooter>
        </NodeCard>
    )
}

function NodeCard({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div className="flex w-[300px] relative font-sans">
            <div
                className={cn(
                    "relative w-full min-h-[150px] border border-gray-200 bg-white rounded-lg shadow-md overflow-hidden",
                    className
                )}
                {...props}
            />
        </div>

    )
}

function NodeCardHeader({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            className={cn(
                "nodeDragable h-8 flex flex-row items-center px-3 gap-1.5",
                className
            )}
            {...props}
        />
    )
}

function NodeTitle({className, ...props}: React.ComponentProps<"div">) {
    return (
        <span
            className={cn("text-sm font-medium", className)}
            {...props}
        />
    )
}

function NodeCardContent({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            className={cn("pb-3", className)}
            {...props}
        />
    )
}

function NodeCardFooter({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            className={cn("absolute bottom-2 right-2 flex space-x-1", className)}
            {...props}
        />
    )
}

export {
    BaseToolNode,
    BaseNode,
    NodeCard,
    NodeCardHeader,
    NodeTitle,
    NodeCardContent,
    NodeCardFooter
}
