"use client"

import {BaseToolNode} from "@/components/node-editor/base-node.tsx";

export function FastPNode({data}: { data: { prefix: string } }) {
    const self_data = {
        title: "FastP",
        prefix: data.prefix,
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

    return (
        <BaseToolNode data={self_data} handles={handles}/>
    )
}

export function Bowtie2Node({data}: { data: { prefix: string } }) {
    const self_data = {
        title: "Bowtie2",
        prefix: data.prefix,
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

    return (
        <BaseToolNode data={self_data} handles={handles}/>
    )
}

export function BBNormNode({data}: { data: { prefix: string } }) {
    const self_data = {
        title: "BBNorm",
        prefix: data.prefix,
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

    return (
        <BaseToolNode data={self_data} handles={handles}/>
    )
}

export function SpadesNode({data}: { data: { prefix: string } }) {
    const self_data = {
        title: "Spades",
        prefix: data.prefix,
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
    };

    return (
        <BaseToolNode data={self_data} handles={handles}/>
    )
}