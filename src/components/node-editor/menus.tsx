import {
    Bowtie2Node,
    CheckM2Node, DiamondNode,
    FastPNode,
    KrakenNode, MeganDaa2RmaNode, MeganRma2InfoNode,
    QualiMapNode,
    SamToolsNode,
    SpadesNode
} from "@/components/node-editor/tool-node.tsx";
import {FileInputNode} from "@/components/node-editor/input-node.tsx";
import {LineFigNode} from "@/components/node-editor/draw-node.tsx";
import {CutNode, JsonFilterNode} from "@/components/node-editor/data-node.tsx";
import {NoteNode} from "@/components/node-editor/note-node.tsx";

export const nodeTypes = {
    fastp: FastPNode,
    kraken2: KrakenNode,
    bowtie2: Bowtie2Node,
    samtool: SamToolsNode,
    qualimap: QualiMapNode,
    spades: SpadesNode,
    diamond: DiamondNode,
    checkm: CheckM2Node,
    fileInput: FileInputNode,
    lineFig: LineFigNode,
    dataFilter: JsonFilterNode,
    dataCut: CutNode,
    note: NoteNode,
    daa2rma: MeganDaa2RmaNode,
    rma2info: MeganRma2InfoNode,
};

// 节点类型配置
export const nodeConfig = {
    tools: {
        name: '工具',
        items: [
            {type: 'fastp', label: 'FastP'},
            {type: 'kraken2', label: 'Kraken2'},
            {type: 'bowtie2', label: 'Bowtie2'},
            {type: 'samtool', label: 'SamTools'},
            {type: 'qualimap', label: 'QualiMap'},
            {type: 'spades', label: 'Spades'},
            {type: 'checkm', label: 'CheckM2'},
            {type: 'diamond', label: 'Diamond'},
            {type: 'daa2rma', label: 'daa2rma'},
            {type: 'rma2info', label: 'rma2info'},
        ]
    },
    dataProcessing: {
        name: '数据处理',
        items: [
            {type: 'dataFilter', label: '数据过滤'},
            {type: 'dataCut', label: '数据截取'},
        ]
    },
    io: {
        name: '输入输出',
        items: [
            {type: 'fileInput', label: '文件输入'},
        ]
    },
    visualization: {
        name: '可视化',
        items: [
            {type: 'lineFig', label: '折线图'},
        ]
    },
    other: {
        name: '其它',
        items: [
            {type: 'note', label: '笔记'}
        ]
    }
};