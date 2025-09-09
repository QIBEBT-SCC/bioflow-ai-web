"use client"

import {InfoIcon} from "lucide-react";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {BaseToolNode} from "@/components/node-editor/node/base-node.tsx";
import {useEffect, useState} from "react";
import {useNodeId, useNodesData, useReactFlow} from '@xyflow/react';

const CodeCard = (
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

    // 解析 args 为对象
    function parseArgs(str: string): { description: string, code: string } {
        try {
            const obj = JSON.parse(str);
            return {description: obj.description || "", code: obj.code || ""};
        } catch {
            return {description: "", code: ""};
        }
    }

    // 初始化 args
    // @ts-expect-error no need
    const [args, setArgs] = useState<string>(() => {
        try {
            // @ts-expect-error no need
            JSON.parse(nodeData?.data.args ?? "");
            return nodeData?.data.args;
        } catch {
            return JSON.stringify({description: "", code: ""});
        }
    });

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

    const {description: descriptionValue, code: codeValue} = parseArgs(args);

    return (
        <Card className="w-[400px] py-0 gap-0 bg-white shadow-lg">
            <CardHeader
                className="nodeDragable h-8 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-t-lg flex flex-row items-center">
                <CardTitle className="text-white">{title}</CardTitle>
                <Sheet>
                    <SheetTrigger><InfoIcon className="w-3 h-3 text-gray-300"/></SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>{title}</SheetTitle>
                            <SheetDescription>{description}</SheetDescription>
                        </SheetHeader>
                    </SheetContent>
                </Sheet>
            </CardHeader>
            <CardContent className="p-3" style={{paddingTop: `calc(var(--spacing) * ${topPadding})`}}>
                <div className="space-y-4">
                    <div>
                        <Label className="pb-2 font-medium">Description (AI Prompt):</Label>
                        <Textarea
                            className="w-full h-[80px] text-sm resize-none overflow-y-auto border-gray-200 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="输入代码编写需求，作为AI编程的prompt..."
                            value={descriptionValue}
                            onChange={(e) => {
                                setArgs(JSON.stringify({description: e.target.value, code: codeValue}));
                            }}
                        />
                    </div>
                    <div>
                        <Label className="pb-2 font-medium">Code:</Label>
                        <Textarea
                            className="w-full h-[120px] text-sm resize-none overflow-y-auto border-gray-200 focus:ring-purple-500 focus:border-purple-500 font-mono"
                            placeholder="在这里编写或粘贴代码..."
                            value={codeValue}
                            onChange={(e) => {
                                setArgs(JSON.stringify({description: descriptionValue, code: e.target.value}));
                            }}
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="h-4">
                <div className="absolute bottom-2 right-2 flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                    <div className="w-2 h-2 rounded-full bg-violet-400"></div>
                </div>
            </CardFooter>
        </Card>
    )
}

export function RCodeNode() {
    const handles = {
        inputs: [
            {name: "input_files", description: "The files required by this code"}
        ],
        outputs: [
            {name: "output_folder", description: "The files required by this code"}
        ]
    };

    return (
        <BaseToolNode handles={handles} nodeComponent={
            <CodeCard
                title="R Code"
                description="AI编程节点，用于编写和执行代码。包含描述区域（AI prompt）和代码区域。"
                topPadding={4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))}
            />
        }/>
    )
}

export function PythonCodeNode() {
    const handles = {
        inputs: [
            {name: "input_files", description: "The files required by this code"}
        ],
        outputs: [
            {name: "output_folder", description: "The files required by this code"}
        ]
    };

    return (
        <BaseToolNode handles={handles} nodeComponent={
            <CodeCard
                title="Python Code"
                description="AI编程节点，用于编写和执行代码。包含描述区域（AI prompt）和代码区域。"
                topPadding={4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))}
            />
        }/>
    )
}
