import {
    Daa2RmaNode,
    DiamondNode,
    FastPNode, MeganPrepareNode,
    MetaPhlanNode, Rma2InfoNode
} from "@/components/node-editor/tool-node.tsx";
import {FileInputNode} from "@/components/node-editor/input-node.tsx";
import {LineFigNode} from "@/components/node-editor/draw-node.tsx";
import {CutNode, JsonFilterNode} from "@/components/node-editor/data-node.tsx";
import {NoteNode} from "@/components/node-editor/note-node.tsx";

export const nodeTypes = {
    fastp: FastPNode,
    metaphlan: MetaPhlanNode,
    diamond: DiamondNode,
    daa_meganizer: MeganPrepareNode,
    daa2rma: Daa2RmaNode,
    rma2info_taxon: Rma2InfoNode,
    rma2info_go: Rma2InfoNode,
    rma2info_eggnog: Rma2InfoNode,
    fileInput: FileInputNode,
    lineFig: LineFigNode,
    dataFilter: JsonFilterNode,
    dataCut: CutNode,
    note: NoteNode,
};

// 节点类型配置
export const nodeConfig = {
    tools: {
        name: '分析工具',
        items: [
            {type: 'fastp', label: 'FastP'},
            {type: 'metaphlan', label: 'MetaPhlan'},
            {type: 'diamond', label: 'Diamond'},
            {type: 'daa_meganizer', label: 'daa-meganizer'},
            {type: 'daa2rma', label: 'daa2rma'},
            {type: 'rma2info_taxon', label: 'rma2info(Taxon)'},
            {type: 'rma2info_go', label: 'rma2info(GO)'},
            {type: 'rma2info_eggnog', label: 'rma2info(eggNOG)'},
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