import {useNodeId, useNodesData, useReactFlow} from '@xyflow/react';
import {Textarea} from "@/components/ui/textarea.tsx";
import {useEffect, useState} from "react";
import {BaseResizeableNode} from "@/components/node-editor/node/base-node.tsx";

const NoteCard = () => {
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
        <div className="absolute w-full h-full top-0 border border-gray-200 bg-white rounded-xl overflow-hidden">
            <div className="nodeDragable bg-gradient-to-r from-indigo-500 to-purple-500 h-8 flex items-center px-3">
                <span className="text-white text-sm font-medium">Note</span>
            </div>
            <Textarea
                className="w-full h-[calc(100%-3.5rem)] p-3 rounded-none resize-none border-none focus:ring-0 focus:outline-none bg-white text-gray-700"
                placeholder="Enter notes here..."
                value={args}
                onChange={(e) => {
                    setArgs(e.target.value)
                }}
            />
            <div className="absolute bottom-2 right-2 flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <div className="w-2 h-2 rounded-full bg-pink-400"></div>
            </div>
        </div>
    );
};

export function NoteNode() {
    const handles = {
        inputs: [],
        outputs: []
    };

    return (
        <BaseResizeableNode
            handles={handles}
            nodeComponent={<NoteCard/>}
            onResize={() => {
            }}
            minH={120}
            minW={250}
        />
    )
}