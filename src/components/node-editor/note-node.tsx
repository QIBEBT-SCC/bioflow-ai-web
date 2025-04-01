import {NodeResizer, NodeProps, useNodeId, useNodesData, useReactFlow} from '@xyflow/react';
import {Textarea} from "@/components/ui/textarea.tsx";
import {useEffect, useState} from "react";

export const ResizableNodeSelected = ({selected}: NodeProps) => {
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
        <div className={`flex h-full w-full relative`}>
            <NodeResizer
                color="#ffffff"
                isVisible={selected}
                minWidth={100}
                minHeight={30}
            />
            <Textarea
                className="flex w-fit h-fit max-w-5/6 rounded-none resize-none bg-amber-200 z-10"
                placeholder="Enter notes here..."
                value={args}
                onChange={(e) => {
                    setArgs(e.target.value)
                }}/>
            <div className="nodeDragable absolute w-full h-[calc(100%-calc(var(--spacing)*5))] top-5 border-2 border-purple-400 bg-purple-50 rounded"></div>
        </div>
    );
};