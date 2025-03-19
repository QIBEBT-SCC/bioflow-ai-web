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
    ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges, addEdge, MiniMap
} from "@xyflow/react";
import {useCallback, useState} from "react";
import {ToolNode2in2out, ToolNode2in3out, ToolNode3in1out} from "@/components/node-editor/tool-node.tsx";
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

const initialNodes = [
    {
        id: 'node-1',
        type: 'fileInput',
        dragHandle: '.nodeDragable',
        position: {x: 0, y: 60},
        data: {
            prefix: 'node-1',
            out1Description: 'file output',
            defaultArgs: 'M3_1.fq.gz'
        },
    },
    {
        id: 'node-2',
        type: 'fileInput',
        dragHandle: '.nodeDragable',
        position: {x: 0, y: -60},
        data: {
            prefix: 'node-2',
            out1Description: 'file output',
            defaultArgs: 'M3_2.fq.gz'
        },
    },
    {
        id: 'node-3',
        type: 't2in3out',
        dragHandle: '.nodeDragable',
        position: {x: 400, y: 0},
        data: {
            title: 'FastP',
            prefix: 'node-3',
            description: 'A tool designed to provide ultrafast all-in-one preprocessing and quality control for FastQ data.',
            in1Description: 'raw r1 file',
            in2Description: 'raw r2 file',
            out1Description: 'clean r1 file',
            out2Description: 'clean r2 file',
            out3Description: 'json report',
            defaultArgs: '-w 8'
        },
    },
    {
        id: 'node-4',
        type: 't2in2out',
        dragHandle: '.nodeDragable',
        position: {x: 800, y: -40},
        data: {
            title: 'BBNorm',
            prefix: 'node-4',
            description: 'A tool designed to provide ultrafast all-in-one preprocessing and quality control for FastQ data.',
            in1Description: 'raw r1 file',
            in2Description: 'raw r2 file',
            out1Description: 'normalized r1 file',
            out2Description: 'normalized r2 file',
            defaultArgs: 'threads=64 -Xmx16g'
        },
    },
    {
        id: 'node-5',
        type: 'fileInput',
        dragHandle: '.nodeDragable',
        position: {x: 400, y: -300},
        data: {
            prefix: 'node-5',
            out1Description: 'file output',
            defaultArgs: '/mnt/genode/ecoli'
        },
    },
    {
        id: 'node-6',
        type: 't3in1out',
        dragHandle: '.nodeDragable',
        position: {x: 800, y: 0},
        data: {
            title: 'Bowtie2',
            prefix: 'node-6',
            description: 'A tool designed to provide ultrafast all-in-one preprocessing and quality control for FastQ data.',
            in1Description: 'raw r1 file',
            in2Description: 'raw r2 file',
            in3Description: 'bowtie index',
            out1Description: 'bam file',
            defaultArgs: '--threads 32'
        },
    },
];

const nodeTypes = {t2in3out: ToolNode2in3out, t2in2out: ToolNode2in2out, t3in1out: ToolNode3in1out, fileInput: FileInputNode};

export function FlowWorkspace() {
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [edgeType, setEdgeType] = useState("default");


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
                    <Button variant="outline" size="icon" title="保存" onClick={() => {
                        console.log(nodes)
                        console.log(edges)
                    }}>
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
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                >
                    <Background/>
                    <Controls/>
                    <MiniMap nodeStrokeWidth={3} zoomable pannable/>
                </ReactFlow>
            </div>
        </SidebarInset>
    );
}