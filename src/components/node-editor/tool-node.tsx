"use client"


import {Info} from "lucide-react";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {BaseToolNode} from "@/components/node-editor/base-node.tsx";
import {useEffect, useState} from "react";
import {useNodeId, useNodesData, useReactFlow} from '@xyflow/react';


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

export function FastPNode() {
    const handles = {
        inputs: [
            {id: 1, argName: "r1", description: "raw r1 file"},
            {id: 2, argName: "r2", description: "raw r2 file"}
        ],
        outputs: [
            {id: 1, argName: "r1", description: "clean r1 file"},
            {id: 2, argName: "r2", description: "clean r2 file"},
            {id: 3, argName: "json_report", description: "fastp report"},
        ]
    };

    return (
        <BaseToolNode handles={handles} nodeComponent={
            <ToolCard
                title="FastP"
                description="A tool designed to provide ultrafast all-in-one preprocessing and quality control for FastQ data."
                topPadding={4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))}
            />
        }/>
    )
}

export function MetaPhlanNode() {
    const handles = {
        inputs: [
            {id: 1, argName: "r1", description: "raw r1 file"},
            {id: 2, argName: "r2", description: "raw r2 file"},
        ],
        outputs: [
            {id: 1, argName: "bowtie2out", description: "bowtie2 output"},
            {id: 2, argName: "taxon", description: "taxon report"},
        ]
    }

    return (
        <BaseToolNode handles={handles} nodeComponent={
            <ToolCard
                title="MetaPhlan"
                description="MetaPhlAn is a computational tool for species-level microbial profiling (bacteria, archaea, eukaryotes, and viruses) from metagenomic shotgun sequencing data."
                topPadding={4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))}
            />
        }/>
    )
}


export function DiamondNode() {
    const handles = {
        inputs: [
            {id: 1, argName: "input_path", description: "raw fasta file"},
            // {id: 2, description: "diamond nr db"},
        ],
        outputs: [
            {id: 1, argName: "daa_file", description: "daa file"},
        ]
    };

    return (
        <BaseToolNode handles={handles} nodeComponent={
            <ToolCard
                title="Diamond blastx"
                description="Align translated DNA query sequences against a protein reference database."
                topPadding={4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))}
            />
        }/>
    )
}

export function MeganPrepareNode() {
    const handles = {
        inputs: [
            {id: 1, argName: "daa", description: "raw DAA file"},
            {id: 2, argName: "mdb", description: "megan map db"},
        ],
        outputs: [
            {id: 1, argName: "daa_file", description: "meganized daa file"},
        ]
    };

    return (
        <BaseToolNode handles={handles} nodeComponent={
            <ToolCard
                title="MEGAN6 daa-meganizer"
                description="Computes a MEGAN .rma6 file from a DIAMOND .daa file"
                topPadding={4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))}
            />
        }/>
    )
}


export function Daa2RmaNode() {
    const handles = {
        inputs: [
            {id: 1, argName: "daa_r1", description: "raw r1 DAA file"},
            {id: 2, argName: "daa_r2", description: "raw r2 DAA file"},
            {id: 3, argName: "mdb", description: "megan map db"},
        ],
        outputs: [
            {id: 1, argName: "megan_rma", description: "rma6"},
        ]
    };

    return (
        <BaseToolNode handles={handles} nodeComponent={
            <ToolCard
                title="MEGAN6 daa2rma"
                description="Computes a MEGAN .rma6 file from a DIAMOND .daa file"
                topPadding={4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))}
            />
        }/>
    )
}

export function Rma2InfoNode() {
    const handles = {
        inputs: [
            {id: 1, argName: "rma", description: "rma6 file"},
        ],
        outputs: [
            {id: 1, argName: "report", description: "report file"},
        ]
    };

    return (
        <BaseToolNode handles={handles} nodeComponent={
            <ToolCard
                title="MEGAN6 rma2info"
                description="Analyses an RMA file"
                topPadding={4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))}
            />
        }/>
    )
}