"use client"


import {Info} from "lucide-react";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {BaseToolNode} from "@/components/node-editor/base-node.tsx";
import {useEffect, useState} from "react";
import {useNodeId, useNodesData, useReactFlow} from '@xyflow/react';
import {useToolArg} from "@/hooks/useTool.tsx";


const ToolCard = (
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
        <Card className="w-[300px] py-0 gap-0 bg-white shadow-lg">
            <CardHeader
                className="nodeDragable h-8 py-2 bg-gradient-to-r from-rose-500 to-pink-500 rounded-t-lg flex flex-row items-center">
                <CardTitle className="text-white">{title}</CardTitle>
                <Sheet>
                    <SheetTrigger><Info className="w-3 h-3 text-gray-300"/></SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>{title}</SheetTitle>
                            <SheetDescription>{description}</SheetDescription>
                        </SheetHeader>
                    </SheetContent>
                </Sheet>
            </CardHeader>
            <CardContent className="p-3" style={{paddingTop: `calc(var(--spacing) * ${topPadding})`}}>
                <Label className="pb-2 font-medium">Args:</Label>
                <Textarea
                    className="w-full h-[80px] text-sm resize-none overflow-y-auto border-gray-200 focus:ring-rose-500 focus:border-rose-500"
                    placeholder="Enter arguments here..."
                    value={args}
                    onChange={(e) => {
                        setArgs(e.target.value)
                    }}
                />
            </CardContent>
            <CardFooter className="h-4">
                <div className="absolute bottom-2 right-2 flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                    <div className="w-2 h-2 rounded-full bg-pink-400"></div>
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                </div>
            </CardFooter>
        </Card>
    )
}

export function ToolNode() {
    const nodeId = useNodeId();
    const nodeData = useNodesData(nodeId ? nodeId : '');
    // @ts-expect-error no need
    const {data: toolData} = useToolArg({uid: nodeData.data.tool_uid})
    const handles = {
        inputs: toolData ? toolData.input_handles : [],
        outputs: toolData ? toolData.output_handles : []
    };

    return (
        <BaseToolNode handles={handles} nodeComponent={
            <ToolCard
                title={toolData ? toolData.name : ''}
                description={toolData ? toolData.description : ''}
                topPadding={4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))}
            />
        }/>
    )
}
