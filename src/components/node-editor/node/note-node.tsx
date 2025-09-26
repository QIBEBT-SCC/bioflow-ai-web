import {useNodeId, useNodesData, useReactFlow} from '@xyflow/react';
import {Textarea} from "@/components/ui/textarea.tsx";
import {useEffect, useState} from "react";
import {NodeCard, NodeCardContent, NodeCardFooter, NodeCardHeader, NodeTitle} from "@/components/node-editor/node/base-node.tsx";
import {colorSchemes} from "@/components/node-editor/node/color.tsx";
import {cn} from "@/lib/utils.ts";


export function NoteNode() {
    const nodeId = useNodeId();
    // @ts-expect-error no need
    const nodeData = useNodesData(nodeId);
    const {setNodes} = useReactFlow();
    // @ts-expect-error no need
    const [args, setArgs] = useState<string>(nodeData.data.args);

    useEffect(() => {
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            args: args,
                        },
                    };
                }
                return node;
            })
        );
    }, [args, nodeId, setNodes]);

    return (
        <NodeCard className="w-[400px] h-[350px]">
            <NodeCardHeader
                className={colorSchemes.gray.gradient}>
                <NodeTitle className="text-white">Note</NodeTitle>
            </NodeCardHeader>
            <NodeCardContent>
                <Textarea
                    className="w-full h-[calc(100%-3.5rem)] p-3 rounded-none resize-none border-none focus:ring-0 focus:outline-none bg-white text-gray-700"
                    placeholder="Enter notes here..."
                    value={args}
                    onChange={(e) => {
                        setArgs(e.target.value)
                    }}
                />
            </NodeCardContent>
            <NodeCardFooter>
                <div className={cn("w-2 h-2 rounded-full", colorSchemes.gray.indicatorColors[0])}></div>
                <div className={cn("w-2 h-2 rounded-full", colorSchemes.gray.indicatorColors[1])}></div>
                <div className={cn("w-2 h-2 rounded-full", colorSchemes.gray.indicatorColors[2])}></div>
            </NodeCardFooter>
        </NodeCard>
    )
}