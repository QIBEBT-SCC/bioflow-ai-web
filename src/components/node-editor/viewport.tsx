import React, {type ReactNode, useCallback, useState} from "react";
import {
    PlayIcon,
    SaveIcon,
    DownloadIcon,
    MenuIcon,
    CheckCircle2,
    UploadIcon,
    SaveAllIcon,
} from "lucide-react";
import {SidebarInset, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {
    ReactFlow,
    Background,
    Controls,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    MiniMap,
    ReactFlowProvider,
    BackgroundVariant,
    useReactFlow,
    type XYPosition
} from "@xyflow/react";
import {
    type Node,
    type Edge,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect
} from "@xyflow/react";
import {useSaveWorkflow} from '@/hooks/useWorkflow.tsx';
import {v7 as uuid7} from 'uuid';
import {FileInputNode} from "@/components/node-editor/input-node.tsx";
import {LineFigNode} from "@/components/node-editor/draw-node.tsx";
import {CutNode, JsonFilterNode} from "@/components/node-editor/data-node.tsx";
import {NoteNode} from "@/components/node-editor/note-node.tsx";
import {PanelMenu} from "@/components/node-editor/panel-menu.tsx";
import {ToolNode} from "@/components/node-editor/tool-node.tsx";


function MenuButton({icon, tooltip, onClick, disable}: { icon: ReactNode, tooltip: string, onClick: () => void, disable: boolean }) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="border-0 shadow-none text-muted-foreground hover:text-foreground"
                        onClick={onClick}
                        disabled={disable}
                    >
                        {icon}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

const nodeTypes = {
    tool: ToolNode,
    fileInput: FileInputNode,
    lineFig: LineFigNode,
    dataFilter: JsonFilterNode,
    dataCut: CutNode,
    note: NoteNode,
}

function FlowContent() {


    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const {saveWorkflow, isRunning: isSaving} = useSaveWorkflow();
    const reactFlow = useReactFlow();

    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [clickPosition, setClickPosition] = useState<XYPosition>({x: 0, y: 0})

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [setNodes],
    );
    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges],
    );
    const onConnect: OnConnect = useCallback(
        (connection) => setEdges((eds) => addEdge(connection, eds)),
        [setEdges],
    );

    const openMenu = (event: MouseEvent | React.MouseEvent<Element, MouseEvent>) => {
        event.preventDefault()
        const position = {
            x: event.clientX,
            y: event.clientY,
        }
        setClickPosition(position)
        setIsMenuOpen(true)
    }

    const closeMenu = () => {
        setIsMenuOpen(false)
        setClickPosition({x: 0, y: 0})
    }

    const onAddNode = (toolType: string, toolUid?: string) => {
        const nodeId = uuid7();
        const position = reactFlow.screenToFlowPosition(clickPosition, {snapToGrid: true});

        if (toolType === "tool") {
            const newNode = {
                id: nodeId,
                type: "tool",
                dragHandle: '.nodeDragable',
                position: position,
                data: {tool_uid: toolUid, args: ''},
                zIndex: 20,
            }
            setNodes((nds) => [...nds, newNode]);
        } else {
            const newNode = {
                id: nodeId,
                type: toolType,
                dragHandle: '.nodeDragable',
                position: position,
                data: {args: ''},
                zIndex: toolType === 'note' ? -10 : 20,
            }
            console.log(newNode)
            setNodes((nds) => [...nds, newNode]);
        }
    }

    const handleSave = () => {
        const workflow = {
            nodes,
            edges
        };
        saveWorkflow(workflow);
    };

    return (
        <SidebarInset>
            <header
                className="flex flex-col shrink-0 border-b">
                <div className="flex items-center gap-2 px-4 h-12 bg-background">
                    <SidebarTrigger className="-ml-1"/>
                    <Separator orientation="vertical" className="!mr-2 !h-4"/>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbPage>
                                    Building Your Application
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block"/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <div className="flex items-center px-3 h-12 border-t bg-muted/30">
                    <div className="flex items-center gap-1 mr-2">
                        <MenuButton
                            icon={<MenuIcon className="h-4 w-4"/>}
                            onClick={() => {
                            }}
                            tooltip={"加载配置"}
                            disable={isSaving}
                        />
                        <MenuButton
                            icon={<SaveIcon className="h-4 w-4"/>}
                            onClick={handleSave}
                            tooltip={"保存"}
                            disable={isSaving}
                        />
                        <MenuButton
                            icon={<SaveAllIcon className="h-4 w-4"/>}
                            onClick={handleSave}
                            tooltip={"另存为"}
                            disable={isSaving}
                        />
                        <MenuButton
                            icon={<DownloadIcon className="h-4 w-4"/>}
                            onClick={handleSave}
                            tooltip={"导出配置"}
                            disable={isSaving}
                        />
                        <MenuButton
                            icon={<UploadIcon className="h-4 w-4"/>}
                            onClick={handleSave}
                            tooltip={"从JSON导入"}
                            disable={isSaving}
                        />
                    </div>
                    <Separator orientation="vertical" className="!h-8"/>
                    <div className="flex items-center gap-1 ml-1">
                        <MenuButton
                            icon={<PlayIcon className="h-4 w-4 text-green-400"/>}
                            onClick={() => setIsRunning(!isRunning)}
                            tooltip={"Run"}
                            disable={isSaving}
                        />
                        <MenuButton
                            icon={<CheckCircle2 className="h-4 w-4 text-yellow-400"/>}
                            onClick={() => {
                            }}
                            tooltip={"检查合法性"}
                            disable={isSaving}
                        />
                    </div>
                </div>
            </header>
            <div className="h-full w-full">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onPaneContextMenu={openMenu}
                    onPaneClick={closeMenu}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                >
                    <Background variant={BackgroundVariant.Dots} className="!bg-gray-100"/>
                    <Controls/>
                    <MiniMap nodeStrokeWidth={3} zoomable pannable/>
                </ReactFlow>
                <PanelMenu isOpen={isMenuOpen} position={clickPosition} onClose={closeMenu} onSelectTool={onAddNode}/>
            </div>
        </SidebarInset>
    );
}

export function FlowWorkspace() {
    return (
        <ReactFlowProvider>
            <FlowContent/>
        </ReactFlowProvider>
    );
}