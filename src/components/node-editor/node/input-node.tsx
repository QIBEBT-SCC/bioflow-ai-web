"use client"

import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {BaseNode} from "@/components/node-editor/node/base-node.tsx";
import {useNodeId, useNodesData, useReactFlow, type Node, useNodeConnections} from "@xyflow/react";
import {useEffect, useState} from "react";
import {colorSchemes} from "@/components/node-editor/node/color.tsx";
import {useDB} from "@/hooks/use-resource.tsx";


function StringInputNode() {
    const nodeId = useNodeId() ?? "";
    const nodeData = useNodesData<Node<{ args: string }, 'value_string'>>(nodeId);
    const {updateNodeData} = useReactFlow();

    const [args, setArgs] = useState<string>(nodeData?.data.args ?? '');


    const handles = {
        inputs: [],
        outputs: [
            {name: "value", description: "string value"},
        ]
    }

    return (
        <BaseNode
            title="String Value"
            description="Simple string value."
            handles={handles}
            color={colorSchemes.blue}
            nodeComponent={
                <div className="p-3">
                    <Label className="pb-2 font-medium">Value:</Label>
                    <Input
                        className="w-full border-gray-200 focus-visible:ring-blue-500 focus-visible:ring-[2px] focus-visible:ring-offset-2"
                        placeholder="Enter string value here..."
                        value={args}
                        onChange={(e) => setArgs(e.target.value)}
                        onBlur={() => updateNodeData(nodeId, {'args': args})}
                        spellCheck={false}
                    />
                </div>
            }
        />
    )
}

function FileInputNode() {
    const nodeId = useNodeId() ?? "";
    const nodeData = useNodesData<Node<{ args: string }, 'resource_file'>>(nodeId);
    const {updateNodeData} = useReactFlow();

    const [args, setArgs] = useState<string>(nodeData?.data.args ?? "");


    const handles = {
        inputs: [],
        outputs: [
            {name: "file_path", description: "output file"},
        ]
    }

    return (
        <BaseNode
            title="File Input"
            description="load file from local path."
            handles={handles}
            color={colorSchemes.green}
            nodeComponent={
                <div className="p-3">
                    <Label className="pb-2 font-medium">File:</Label>
                    <Input
                        className="w-full border-gray-200 focus-visible:ring-green-500 focus-visible:ring-[2px] focus-visible:ring-offset-2"
                        placeholder="Enter file path here..."
                        value={args}
                        onChange={(e) => setArgs(e.target.value)}
                        onBlur={() => updateNodeData(nodeId, {'args': args})}
                        spellCheck={false}
                    />
                </div>
            }
        />
    )
}

function SequenceInputNode() {
    const nodeId = useNodeId() ?? "";
    const nodeData = useNodesData<Node<{ args: { r1: string, r2: string } }, 'resource_sequence'>>(nodeId);
    const {updateNodeData} = useReactFlow();

    const [r1, setR1] = useState<string>(nodeData?.data.args.r1 ?? "");
    const [r2, setR2] = useState<string>(nodeData?.data.args.r2 ?? "");

    const handles = {
        inputs: [],
        outputs: [
            {name: "r1", description: "r1 file"},
            {name: "r2", description: "r2 file"},
        ]
    }

    return (
        <BaseNode
            title="Pair-end Reads Input"
            description="用于手动指定双端测序文件输入"
            handles={handles}
            color={colorSchemes.green}
            nodeComponent={
                <div className="p-3">
                    <Label className="pb-2 font-medium">R1 path:</Label>
                    <Input
                        className="w-full border-gray-200 focus-visible:ring-green-500 focus-visible:ring-[2px] focus-visible:ring-offset-2"
                        placeholder="Enter arguments here..."
                        value={r1}
                        onChange={(e) => setR1(e.target.value)}
                        onBlur={() => updateNodeData(
                            nodeId,
                            {args: {r1: r1, r2: r2}}
                        )}
                        spellCheck={false}
                    />
                    <Label className="pb-2 pt-4 font-medium">R2 path:</Label>
                    <Input
                        className="w-full border-gray-200 focus-visible:ring-green-500 focus-visible:ring-[2px] focus-visible:ring-offset-2"
                        placeholder="Enter arguments here..."
                        value={r2}
                        onChange={(e) => setR2(e.target.value)}
                        onBlur={() => updateNodeData(
                            nodeId,
                            {args: {r1: r1, r2: r2}}
                        )}
                        spellCheck={false}
                    />
                </div>
            }
        />
    )
}

function DBInputNode() {
    const nodeId = useNodeId() ?? "";
    const nodeData = useNodesData<Node<{ resource_uid: string, args: string }, 'resource_db'>>(nodeId);

    const {data: bioDb} = useDB(Number(nodeData?.data.resource_uid))

    const handles = {
        inputs: [],
        outputs: [
            {name: "file_path", description: "output file"},
        ]
    }

    return (
        <BaseNode
            title="BioInfo DB"
            description="分析软件所使用的生物信息数据库"
            handles={handles}
            color={colorSchemes.green}
            nodeComponent={
                <div className="p-3">
                    <Label className="pb-2 font-medium">Database:</Label>
                    <code className="text-muted-foreground text-sm overflow-x-auto max-w-full">{bioDb?.description}</code>
                </div>
            }
        />
    )
}

function ReferenceInputNode() {
    const nodeId = useNodeId() ?? "";
    const nodeData = useNodesData<Node<{ args: { requiredIndex: string[] } }, 'resource_db'>>(nodeId);
    const connections = useNodeConnections({handleType: 'source'});
    const {updateNodeData} = useReactFlow()

    useEffect(() => {
        const indexes: string[] = connections.map(conn => {
            // @ts-expect-error no need
            const parts = conn.sourceHandle.split('-out-');
            return parts[parts.length - 1];
        });
        updateNodeData(nodeId, {args: {requiredIndex: indexes}})
    }, [connections])

    const handles = {
        inputs: [
            {name: "species_name", description: "species name of the reference gene to be used"},
            {name: "ncbi_tax_id", description: "NCBI taxonomy ID of the species of the reference gene to be used"}
        ],
        outputs: [
            {name: "genome_fasta", description: "Gene fasta file of the reference genome"},
            {name: "annotation_gff", description: "GFF annotation file of the reference genome"},
            {name: "bowtie2_index", description: ""},
            {name: "bwa_index", description: ""},
            {name: "hisat2_index", description: ""},
            {name: "minimap2_index", description: ""},
            {name: "star_index", description: ""},
        ]
    }

    return (
        <BaseNode
            title="Reference Genomes"
            description="参考基因组输入节点"
            handles={handles}
            color={colorSchemes.green}
            nodeComponent={
                <div className="p-3">
                    <Label className="pb-2 font-medium">Species:</Label>
                    <code className="text-muted-foreground text-sm overflow-x-auto max-w-full">{String(nodeData?.data.args)}</code>
                </div>
            }
        />
    )
}

export {
    StringInputNode,
    FileInputNode,
    SequenceInputNode,
    DBInputNode,
    ReferenceInputNode
}