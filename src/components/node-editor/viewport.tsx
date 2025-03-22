import {SidebarInset, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";
import {
    ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges, addEdge, MiniMap, BackgroundVariant,
    ReactFlowProvider
} from "@xyflow/react";
import {useCallback, useState} from "react";
import {
    BBNormNode,
    Bowtie2Node,
    CheckM2Node,
    FastPNode, KrakenNode,
    QualiMapNode,
    SamToolsNode,
    SpadesNode
} from "@/components/node-editor/tool-node.tsx";
import {FileInputNode} from "@/components/node-editor/input-node.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Play, Pause, Square, RotateCcw, Save, Upload, Share2} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.tsx";
import {LineFigNode} from "@/components/node-editor/draw-node.tsx";
import {CutNode, JsonFilterNode} from "@/components/node-editor/data-node.tsx";
import {useWorkflow} from '@/hooks/useWorkflow';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent
} from "@/components/ui/context-menu.tsx";
import {useReactFlow} from "@xyflow/react";

const nodeTypes = {
    fastp: FastPNode,
    kraken2: KrakenNode,
    bowtie2: Bowtie2Node,
    samtool: SamToolsNode,
    qualimap: QualiMapNode,
    bbnorm: BBNormNode,
    spades: SpadesNode,
    checkm: CheckM2Node,
    fileInput: FileInputNode,
    lineFig: LineFigNode,
    dataFilter: JsonFilterNode,
    dataCut: CutNode
};

// 节点类型配置
const nodeConfig = {
    tools: {
        name: '工具',
        items: [
            {type: 'fastp', label: 'FastP'},
            {type: 'kraken2', label: 'Kraken2'},
            {type: 'bowtie2', label: 'Bowtie2'},
            {type: 'samtool', label: 'SamTools'},
            {type: 'qualimap', label: 'QualiMap'},
            {type: 'bbnorm', label: 'BBNorm'},
            {type: 'spades', label: 'Spades'},
            {type: 'checkm', label: 'CheckM2'},
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
    }
} as const;

export function FlowWorkspace() {
    return (
        <ReactFlowProvider>
            <FlowContent/>
        </ReactFlowProvider>
    );
}

function FlowContent() {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [edgeType, setEdgeType] = useState("default");
    const {runWorkflow, isRunning: isSaving} = useWorkflow();
    const {screenToFlowPosition} = useReactFlow();

    const onNodesChange = useCallback(
        // @ts-expect-error no need
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [setNodes],
    );
    const onEdgesChange = useCallback(
        // @ts-expect-error no need
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges],
    );
    const onConnect = useCallback(
        // @ts-expect-error no need
        (connection) => setEdges((eds) => addEdge(connection, eds)),
        [setEdges],
    );

    const onAddNode = useCallback((event: React.MouseEvent, type: string) => {
        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        const newNode = {
            id: `node${nodes.length + 1}`,
            type,
            dragHandle: '.nodeDragable',
            position,
            data: {}
        };

        // @ts-expect-error no need
        setNodes((nds) => [...nds, newNode]);
    }, [nodes.length, screenToFlowPosition]);

    const handleSave = () => {
        const workflow = {
            nodes,
            edges
        };
        runWorkflow(workflow);
    };

    const renderMenuItems = useCallback(() => {
        return Object.entries(nodeConfig).map(([key, category]) => (
            <ContextMenuSub key={key}>
                <ContextMenuSubTrigger>{category.name}</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                    {category.items.map((item) => (
                        <ContextMenuItem
                            key={item.type}
                            onClick={(e) => onAddNode(e, item.type)}
                        >
                            {item.label}
                        </ContextMenuItem>
                    ))}
                </ContextMenuSubContent>
            </ContextMenuSub>
        ));
    }, [onAddNode]);

    return (
        <SidebarInset>
            <header
                className="flex h-12 shrink-0 items-center gap-2 transition-[width,height] border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1"/>
                    <Separator orientation="vertical" className="!mr-2 !h-4"/>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="#">
                                    Building Your Application
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block"/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <div className="flex items-center gap-2 ml-auto px-4">
                    <Select value={edgeType} onValueChange={setEdgeType}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="边连接风格"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">默认</SelectItem>
                            <SelectItem value="straight">直线</SelectItem>
                            <SelectItem value="step">阶梯</SelectItem>
                            <SelectItem value="smoothstep">平滑阶梯</SelectItem>
                        </SelectContent>
                    </Select>
                    <Separator orientation="vertical" className="!h-4"/>
                    <Button
                        variant="outline"
                        size="icon"
                        title="保存"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <Save className="h-4 w-4"/>
                    </Button>
                    <Button variant="outline" size="icon" title="加载">
                        <Upload className="h-4 w-4"/>
                    </Button>
                    <Button variant="outline" size="icon" title="分享">
                        <Share2 className="h-4 w-4"/>
                    </Button>
                    <Separator orientation="vertical" className="!h-4"/>
                    <Button variant="outline" size="icon" title={isRunning ? "暂停" : "运行"} onClick={() => setIsRunning(!isRunning)}>
                        {isRunning ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}
                    </Button>
                    <Button variant="outline" size="icon" title="停止">
                        <Square className="h-4 w-4"/>
                    </Button>
                    <Button variant="outline" size="icon" title="重跑">
                        <RotateCcw className="h-4 w-4"/>
                    </Button>
                </div>
            </header>
            <div className="h-full w-full">
                <ContextMenu>
                    <ContextMenuTrigger className="h-full w-full">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            nodeTypes={nodeTypes}
                            fitView
                        >
                            <Background variant={BackgroundVariant.Dots}/>
                            <Controls/>
                            <MiniMap nodeStrokeWidth={3} zoomable pannable/>
                        </ReactFlow>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        {renderMenuItems()}
                    </ContextMenuContent>
                </ContextMenu>
            </div>
        </SidebarInset>
    );
}