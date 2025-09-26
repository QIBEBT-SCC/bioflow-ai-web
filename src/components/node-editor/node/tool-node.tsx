"use client"


import {Label} from "@/components/ui/label.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {BaseNode,} from "@/components/node-editor/node/base-node.tsx";
import {useEffect, useState} from "react";
import {type Node, useNodeId, useNodesData, useReactFlow} from '@xyflow/react';
import {useToolArg} from "@/hooks/use-tool.tsx";
import {colorSchemes} from "@/components/node-editor/node/color.tsx";


export function ToolNode() {
    const nodeId = useNodeId() ?? "";
    const {updateNodeData} = useReactFlow();
    const nodeData = useNodesData<Node<{ resource_uid: string, args: string }, 'tool'>>(nodeId);

    const {data: toolData, isLoading} = useToolArg({uid: nodeData?.data.resource_uid ?? ""})
    const [args, setArgs] = useState<string>("");

    useEffect(() => {
        const nodeArgs = nodeData?.data.args;
        if (nodeArgs && nodeArgs.length > 0) {
            setArgs(nodeArgs);
            return;
        }
        if (toolData?.static_params !== undefined) {
            setArgs(toolData.static_params ?? "");
        }
    }, [nodeData?.data.args, toolData?.static_params]);

    const handles = {
        inputs: toolData?.input_handles || [],
        outputs: toolData?.output_handles || []
    };

    if (isLoading) return (
        <BaseNode
            title="--"
            description="--"
            handles={handles}
            color={colorSchemes.pink}
            nodeComponent={
                <div className="p-3">
                    <Label className="pb-2 font-medium">Args:</Label>
                    <Textarea
                        className="w-full h-[100px] text-sm resize-none overflow-y-auto border-gray-200 focus-visible:ring-rose-500 focus-visible:ring-[2px] focus-visible:ring-offset-2"
                        placeholder="Enter arguments here..."
                        value="--"
                        disabled={true}
                    />
                </div>
            }
        />
    )

    return (
        <BaseNode
            title={toolData?.name ?? '--'}
            description={toolData?.description ?? ''}
            handles={handles}
            color={colorSchemes.pink}
            nodeComponent={
                <div className="p-3">
                    <Label className="pb-2 font-medium">Args:</Label>
                    <Textarea
                        className="w-full h-[100px] text-sm resize-none overflow-y-auto border-gray-200 focus-visible:ring-rose-500 focus-visible:ring-[2px] focus-visible:ring-offset-2"
                        placeholder="Enter arguments here..."
                        value={args}
                        onChange={(e) => {
                            setArgs(e.target.value)
                        }}
                        onBlur={() => updateNodeData(nodeId, {args: args})}
                        spellCheck={false}
                    />
                </div>
            }
        />
    )
}
