"use client"

import {BaseToolNode} from "@/components/node-editor/base-node.tsx";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Info} from "lucide-react";
import {Label} from "@/components/ui/label.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
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
        <Card className="w-[350px] py-0 gap-0 bg-gray-50 shadow-lg">
            <CardHeader className="nodeDragable h-8 py-2 bg-fuchsia-600 rounded-t-xl flex flex-row items-center">
                <CardTitle className="text-white">{title}</CardTitle>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger><Info className="w-3 h-3 text-gray-300"/></TooltipTrigger>
                        <TooltipContent>
                            <p>{description}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardHeader>
            <CardContent className="pb-4" style={{paddingTop: `calc(var(--spacing) * ${topPadding})`}}>
                <Label className="pb-2 font-medium">Args:</Label>
                <Textarea
                    className="h-[80px] text-sm resize-none bg-white overflow-y-auto !focus:ring-1"
                    placeholder="Enter arguments here..."
                    value={args}
                    onChange={(e) => {
                        setArgs(e.target.value)
                    }}
                />
            </CardContent>
        </Card>
    )
}

export function FastPNode() {
    const handles = {
        inputs: [
            {id: 1, description: "raw r1 file"},
            {id: 2, description: "raw r2 file"}
        ],
        outputs: [
            {id: 1, description: "clean r1 file"},
            {id: 2, description: "clean r2 file"},
            {id: 3, description: "fastp report"},
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

export function KrakenNode() {
    const handles = {
        inputs: [
            {id: 1, description: "raw r1 file"},
            {id: 2, description: "raw r2 file"},
        ],
        outputs: [
            {id: 1, description: "kraken report"},
            {id: 2, description: "kraken output"},
        ]
    }

    return (
        <BaseToolNode handles={handles} nodeComponent={
            <ToolCard
                title="Kraken 2"
                description="The second version of the Kraken taxonomic sequence classification system."
                topPadding={4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))}
            />
        }/>
    )
}


export function Bowtie2Node() {
    const handles = {
        inputs: [
            {id: 1, description: "raw r1 file"},
            {id: 2, description: "raw r2 file"},
            {id: 3, description: "bowtie index"},
        ],
        outputs: [
            {id: 1, description: "bam file"}
        ]
    };

    return (
        <BaseToolNode handles={handles} nodeComponent={
            <ToolCard
                title="Bowtie2"
                description="Bowtie 2 is an ultrafast and memory-efficient tool for aligning sequencing reads to long reference sequences."
                topPadding={4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))}
            />
        }/>
    )
}


export function SamToolsNode() {
    const handles = {
        inputs: [
            {id: 1, description: "raw bam file"},
        ],
        outputs: [
            {id: 1, description: "output bam file"},
        ]
    }

    return (
        <BaseToolNode handles={handles} nodeComponent={
            <ToolCard
                title="Samtools"
                description="Samtools is a suite of programs for interacting with high-throughput sequencing data."
                topPadding={4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))}
            />
        }/>
    )
}


export function QualiMapNode() {
    const handles = {
        inputs: [
            {id: 1, description: "raw bam file"},
            {id: 2, description: "gff file"}
        ],
        outputs: [
            {id: 1, description: "qualimap reports"}
        ]
    };

    return (
        <BaseToolNode handles={handles} nodeComponent={
            <ToolCard
                title="QualiMap"
                description="QualiMap 2, a platform-independent application written in Java and R that provides both a Graphical User Inteface (GUI) and a command-line interface to facilitate the quality control of alignment sequencing data and its derivatives like feature counts."
                topPadding={4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))}
            />
        }/>
    )
}


export function SpadesNode() {
    const handles = {
        inputs: [
            {id: 1, description: "raw r1 file"},
            {id: 2, description: "raw r2 file"}
        ],
        outputs: [
            {id: 1, description: "contigs"},
        ]
    }

    return (
        <BaseToolNode handles={handles} nodeComponent={
            <ToolCard
                title="Spades"
                description="SPAdes is a versatile toolkit designed for assembly and analysis of sequencing data."
                topPadding={4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))}
            />
        }/>
    )
}


export function CheckM2Node() {
    const handles = {
        inputs: [
            {id: 1, description: "contigs file"},
        ],
        outputs: [
            {id: 1, description: "checkm2 reports"}
        ]
    };

    return (
        <BaseToolNode handles={handles} nodeComponent={
            <ToolCard
                title="CheckM2"
                description="Rapid assessment of genome bin quality using machine learning."
                topPadding={4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))}
            />
        }/>
    )
}