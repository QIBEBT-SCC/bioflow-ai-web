import {Info} from "lucide-react";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet.tsx";
import {BaseToolNode} from "@/components/node-editor/node/base-node.tsx";
import {useNodeId, useNodesData, useReactFlow} from "@xyflow/react";
import {useEffect, useState} from "react";


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
            <CardHeader
                className="nodeDragable h-8 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-t-xl flex flex-row items-center">
                <CardTitle className="text-white">
                    {title}
                </CardTitle>
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
            {name: "file_path", description: "output file"},
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

export function SequenceInputNode() {
    const nodeId = useNodeId();
    // @ts-expect-error no need
    const nodeData = useNodesData(nodeId);
    const {setNodes} = useReactFlow();

    // 解析 args 为对象
    function parseArgs(str: string): { r1: string, r2: string } {
        try {
            const obj = JSON.parse(str);
            return {r1: obj.r1 || "", r2: obj.r2 || ""};
        } catch {
            return {r1: "", r2: ""};
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
            return JSON.stringify({r1: "", r2: ""});
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

    const {r1, r2} = parseArgs(args);

    const handles = {
        inputs: [],
        outputs: [
            {name: "r1", description: "r1 file"},
            {name: "r2", description: "r2 file"},
        ]
    }

    const PESeqCard = (
        <Card className="w-[350px] py-0 gap-3 bg-white shadow-lg">
            <CardHeader
                className="nodeDragable h-8 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-t-xl flex flex-row items-center">
                <CardTitle className="text-white">
                    Pair-end Reads Input
                </CardTitle>
                <Sheet>
                    <SheetTrigger><Info className="w-3 h-3 text-gray-300"/></SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Pair-end Reads Input</SheetTitle>
                            <SheetDescription>用于手动指定双端测序文件输入</SheetDescription>
                        </SheetHeader>
                    </SheetContent>
                </Sheet>
            </CardHeader>
            <CardContent
                className="p-3"
                style={{paddingTop: `calc(var(--spacing) * ${(6 * Math.max(handles.inputs.length, handles.outputs.length))})`}}
            >
                <Label className="pb-2 font-medium">R1 path:</Label>
                <Input
                    className="w-full border-gray-200 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Enter arguments here..."
                    value={r1}
                    onChange={(e) => {
                        setArgs(JSON.stringify({r1: e.target.value, r2}));
                    }}
                />
                <Label className="pb-2 pt-4 font-medium">R2 path:</Label>
                <Input
                    className="w-full border-gray-200 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Enter arguments here..."
                    value={r2}
                    onChange={(e) => {
                        setArgs(JSON.stringify({r1, r2: e.target.value}));
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

    return (
        <BaseToolNode handles={handles} nodeComponent={PESeqCard}/>
    )
}

export function DBInputNode() {
    const nodeId = useNodeId();
    const nodeData = useNodesData(nodeId ? nodeId : '');

    const handles = {
        inputs: [],
        outputs: [
            {name: "file_path", description: "output file"},
        ]
    }


    const DBCard = (
        <Card className="w-[350px] py-0 gap-3 bg-white shadow-lg">
            <CardHeader
                className="nodeDragable h-8 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-t-xl flex flex-row items-center">
                <CardTitle className="text-white">
                    BioInfo DB
                </CardTitle>
                <Sheet>
                    <SheetTrigger><Info className="w-3 h-3 text-gray-300"/></SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>BioInfo DB</SheetTitle>
                            <SheetDescription>分析软件所使用的生物信息数据库</SheetDescription>
                        </SheetHeader>
                    </SheetContent>
                </Sheet>
            </CardHeader>

            <CardContent
                className="p-3"
                style={{paddingTop: `calc(var(--spacing) * ${(6 * Math.max(handles.inputs.length, handles.outputs.length))})`}}
            >
                <Label className="pb-2 font-medium">Database:</Label>
                <code className="text-muted-foreground text-sm overflow-x-auto max-w-full">{String(nodeData?.data.args)}</code>
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

    return (
        <BaseToolNode handles={handles} nodeComponent={DBCard}/>
    )
}

export function ReferenceInput() {
    const nodeId = useNodeId();
    const nodeData = useNodesData(nodeId ? nodeId : '');

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


    const RefCard = (
        <Card className="w-[350px] py-0 gap-3 bg-white shadow-lg">
            <CardHeader
                className="nodeDragable h-8 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-t-xl flex flex-row items-center">
                <CardTitle className="text-white">
                    Reference Genomes
                </CardTitle>
                <Sheet>
                    <SheetTrigger><Info className="w-3 h-3 text-gray-300"/></SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Reference Genomes</SheetTitle>
                            <SheetDescription>参考基因组输入节点</SheetDescription>
                        </SheetHeader>
                    </SheetContent>
                </Sheet>
            </CardHeader>

            <CardContent
                className="p-3"
                style={{paddingTop: `calc(var(--spacing) * ${(6 * Math.max(handles.inputs.length, handles.outputs.length))})`}}
            >
                <Label className="pb-2 font-medium">Species:</Label>
                <code className="text-muted-foreground text-sm overflow-x-auto max-w-full">{String(nodeData?.data.args)}</code>
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

    return (
        <BaseToolNode handles={handles} nodeComponent={RefCard}/>
    )
}