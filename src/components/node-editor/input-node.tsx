import {useEffect, useState} from "react";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Info} from "lucide-react";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {BaseToolNode} from "@/components/node-editor/base-node.tsx";
import {useNodeId, useNodesData, useReactFlow} from "@xyflow/react";

const FileCard = (
    {
        title,
        description,
        topPadding,
    }: {
        title: string;
        description: string;
        topPadding: number;
    }) => {
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
        <Card className="w-[350px] py-0 gap-3 bg-white shadow-lg">
            <CardHeader className="nodeDragable h-8 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-t-xl flex flex-row items-center">
                <CardTitle className="text-white">
                    {title}
                </CardTitle>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger><Info className="w-3 h-3 text-gray-300"/></TooltipTrigger>
                        <TooltipContent>
                            <p>{description}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardHeader>
            <CardContent className="p-3" style={{paddingTop: `calc(var(--spacing) * ${topPadding})`}}>
                <Label className="pb-2 font-medium">File:</Label>
                <Input
                    className="w-full border-gray-200 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Enter arguments here..."
                    value={args}
                    onChange={(e) => {
                        setArgs(e.target.value);
                    }}
                />
            </CardContent>
            <CardFooter className="h-4">
                <div className="absolute bottom-2 right-2 flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                    <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                </div>
            </CardFooter>
        </Card>
    )
}

export function FileInputNode() {
    const handles = {
        inputs: [],
        outputs: [
            {id: 1, description: "output file"},
        ]
    }

    return (
        <BaseToolNode handles={handles} nodeComponent={<FileCard
            title="File Input"
            description="load file from local path."
            topPadding={(6 * Math.max(handles.inputs.length, handles.outputs.length))}
        />}/>
    )
}