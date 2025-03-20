"use client"

import {BaseToolNode} from "@/components/node-editor/base-node.tsx";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {Info} from "lucide-react";
import {Label} from "@/components/ui/label.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {useEffect, useState} from "react";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";


const ToolCard = (
    {
        data,
        topPadding
    }: {
        data: {
            prefix: string,
            title: string;
            description: string;
            defaultArgs: string;

        };
        topPadding: number;
    }) => {
    const [args, setArgs] = useState(data.defaultArgs);

    useEffect(() => {
        setArgs(data.defaultArgs);
    }, [data.defaultArgs, data.prefix]);

    return (
        <Card className="w-[350px] py-0 gap-0 bg-gray-50 shadow-lg">
            <CardHeader className="nodeDragable h-8 py-2 bg-fuchsia-600 rounded-t-xl flex flex-row items-center">
                <CardTitle className="text-white">{data.title}</CardTitle>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger><Info className="w-3 h-3 text-gray-300"/></TooltipTrigger>
                        <TooltipContent>
                            <p>{data.description}</p>
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
                        setArgs(e.target.value);
                    }}
                />
            </CardContent>
        </Card>
    )
}

const SelectToolCard = (
    {
        data,
        topPadding
    }: {
        data: {
            prefix: string,
            title: string;
            description: string;
            defaultArgs: string;
            selectors: string[];
        };
        topPadding: number;
    }) => {
    const [args, setArgs] = useState(data.defaultArgs);

    useEffect(() => {
        setArgs(data.defaultArgs);
    }, [data.defaultArgs, data.prefix]);

    return (
        <Card className="w-[350px] py-0 gap-0 bg-gray-50 shadow-lg">
            <CardHeader className="nodeDragable h-8 py-2 bg-fuchsia-600 rounded-t-xl flex flex-row items-center">
                <CardTitle className="text-white">{data.title}</CardTitle>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger><Info className="w-3 h-3 text-gray-300"/></TooltipTrigger>
                        <TooltipContent>
                            <p>{data.description}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardHeader>
            <CardContent className="pb-4" style={{paddingTop: `calc(var(--spacing) * ${topPadding})`}}>
                <Label className="pb-2 font-medium">Args:</Label>
                <Select>
                    <SelectTrigger className="w-[200px] bg-white">
                        <SelectValue placeholder="Select function"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {data.selectors.map((item,index)=>(
                                <SelectItem value={item} key={index}>{item}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Label className="pb-2 font-medium">Args:</Label>
                <Textarea
                    className="h-[80px] text-sm resize-none bg-white overflow-y-auto !focus:ring-1"
                    placeholder="Enter arguments here..."
                    value={args}
                    onChange={(e) => {
                        setArgs(e.target.value);
                    }}
                />
            </CardContent>
        </Card>
    )
}

export function FastPNode({id}: { id: string }) {
    const self_data = {
        title: "FastP",
        prefix: id,
        description: "A tool designed to provide ultrafast all-in-one preprocessing and quality control for FastQ data.",
        defaultArgs: "-w 8"
    }
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
    const topPadding = 4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))

    return (
        <BaseToolNode data={self_data} handles={handles} nodeComponent={<ToolCard data={self_data} topPadding={topPadding}/>}/>
    )
}

export function KrakenNode({id}: { id: string }) {
    const self_data = {
        title: "Kraken 2",
        prefix: id,
        description: "Bowtie 2 is an ultrafast and memory-efficient tool for aligning sequencing reads to long reference sequences.",
        defaultArgs: "--db /mnt/data01/kraken_db  --threads 64 --use-names --gzip-compressed --paired"
    }
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
    const topPadding = 4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))

    return (
        <BaseToolNode data={self_data} handles={handles} nodeComponent={<ToolCard data={self_data} topPadding={topPadding}/>}/>
    )
}


export function Bowtie2Node({id}: { id: string }) {
    const self_data = {
        title: "Bowtie2",
        prefix: id,
        description: "Bowtie 2 is an ultrafast and memory-efficient tool for aligning sequencing reads to long reference sequences.",
        defaultArgs: "--threads 32"
    }
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
    const topPadding = 4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))

    return (
        <BaseToolNode data={self_data} handles={handles} nodeComponent={<ToolCard data={self_data} topPadding={topPadding}/>}/>
    )
}

export function SamToolsNode({id}: { id: string }) {
    const self_data = {
        title: "Samtools",
        prefix: id,
        description: "Bowtie 2 is an ultrafast and memory-efficient tool for aligning sequencing reads to long reference sequences.",
        defaultArgs: "",
        selectors:["index","sort"]
    }
    const handles = {
        inputs: [
            {id: 1, description: "raw bam file"},
        ],
        outputs: [
            {id: 1, description: "output bam file"},
        ]
    }
    const topPadding = 4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))

    return (
        <BaseToolNode data={self_data} handles={handles} nodeComponent={<SelectToolCard data={self_data} topPadding={topPadding}/>}/>
    )
}

export function QualiMapNode({id}: { id: string }) {
    const self_data = {
        title: "QualiMap",
        prefix: id,
        description: "QualiMap 2, a platform-independent application written in Java and R that provides both a Graphical User Inteface (GUI) and a command-line interface to facilitate the quality control of alignment sequencing data and its derivatives like feature counts.",
        defaultArgs: "bamqc -p non-strand-specific --collect-overlap-pairs --java-mem-size=4G"
    }
    const handles = {
        inputs: [
            {id: 1, description: "raw bam file"},
            {id: 2, description: "gff file"}
        ],
        outputs: [
            {id: 1, description: "qualimap reports"}
        ]
    };
    const topPadding = 4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))

    return (
        <BaseToolNode data={self_data} handles={handles} nodeComponent={<ToolCard data={self_data} topPadding={topPadding}/>}/>
    )
}

export function BBNormNode({id}: { id: string }) {
    const self_data = {
        title: "BBNorm",
        prefix: id,
        description: "Normalizes read depth based on kmer counts. Can also error-correct, bin reads by kmer depth, and generate a kmer depth histogram.",
        defaultArgs: "threads=64 -Xmx16g"
    }
    const handles = {
        inputs: [
            {id: 1, description: "raw r1 file"},
            {id: 2, description: "raw r2 file"}
        ],
        outputs: [
            {id: 1, description: "normalized r1 file"},
            {id: 2, description: "normalized r2 file"}
        ]
    };
    const topPadding = 4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))

    return (
        <BaseToolNode data={self_data} handles={handles} nodeComponent={<ToolCard data={self_data} topPadding={topPadding}/>}/>
    )
}



export function SpadesNode({id}: { id: string }) {
    const self_data = {
        title: "Spades",
        prefix: id,
        description: "SPAdes is a versatile toolkit designed for assembly and analysis of sequencing data. ",
        defaultArgs: "--sc --t 64"
    }
    const handles = {
        inputs: [
            {id: 1, description: "raw r1 file"},
            {id: 2, description: "raw r2 file"}
        ],
        outputs: [
            {id: 1, description: "contigs"},
        ]
    }
    const topPadding = 4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))

    return (
        <BaseToolNode data={self_data} handles={handles} nodeComponent={<ToolCard data={self_data} topPadding={topPadding}/>}/>
    )
}

export function CheckM2Node({id}: { id: string }) {
    const self_data = {
        title: "CheckM2",
        prefix: id,
        description: "QualiMap 2, a platform-independent application written in Java and R that provides both a Graphical User Inteface (GUI) and a command-line interface to facilitate the quality control of alignment sequencing data and its derivatives like feature counts.",
        defaultArgs: "--database_path /mnt/data01/checkm2_db --threads 32 -x fasta"
    }
    const handles = {
        inputs: [
            {id: 1, description: "contigs file"},
        ],
        outputs: [
            {id: 1, description: "checkm2 reports"}
        ]
    };
    const topPadding = 4 + (6 * Math.max(handles.inputs.length, handles.outputs.length))

    return (
        <BaseToolNode data={self_data} handles={handles} nodeComponent={<ToolCard data={self_data} topPadding={topPadding}/>}/>
    )
}