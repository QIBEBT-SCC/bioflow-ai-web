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
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent
} from "@/components/ui/context-menu.tsx";
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
    useReactFlow
} from "@xyflow/react";
import {
    type Node,
    type Edge,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect
} from "@xyflow/react";
import {useSaveWorkflow} from '@/hooks/useWorkflow.tsx';
import {useToolStore} from '@/stores/toolStore.tsx';
import {nodeConfig, nodeTypes} from "@/components/node-editor/menus.tsx";
import {v4 as uuid4} from 'uuid';


export function FlowWorkspace() {
    return (
        <ReactFlowProvider>
            <FlowContent/>
        </ReactFlowProvider>
    );
}

function MenuButton({icon, tooltip, onClick}: { icon: ReactNode, tooltip: string, onClick: () => void }) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="border-0 shadow-none text-muted-foreground hover:text-foreground"
                        onClick={onClick}
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

function FlowContent() {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const {saveWorkflow, isRunning: isSaving} = useSaveWorkflow();
    const {screenToFlowPosition} = useReactFlow();
    const defaultArgs = useToolStore(state => state.defaultArgs);

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

    const onAddNode = useCallback((event: React.MouseEvent, type: string) => {
        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        const nodeId = uuid4();
        const newNode = {
            id: nodeId,
            type,
            dragHandle: '.nodeDragable',
            position,
            data: {
                args: defaultArgs[`${type}` as keyof typeof defaultArgs] ?? ''
            },
            zIndex: type === 'note' ? -10 : 20,
        };

        setNodes((nds) => [...nds, newNode]);
    }, [screenToFlowPosition, defaultArgs]);

    const handleSave = () => {
        const workflow = {
            nodes,
            edges
        };
        saveWorkflow(workflow);
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
                        />
                        <MenuButton
                            icon={<SaveIcon className="h-4 w-4"/>}
                            onClick={handleSave}
                            tooltip={"保存"}
                        />
                        <MenuButton
                            icon={<SaveAllIcon className="h-4 w-4"/>}
                            onClick={handleSave}
                            tooltip={"另存为"}
                        />
                        <MenuButton
                            icon={<DownloadIcon className="h-4 w-4"/>}
                            onClick={handleSave}
                            tooltip={"导出配置"}
                        />
                        <MenuButton
                            icon={<UploadIcon className="h-4 w-4"/>}
                            onClick={handleSave}
                            tooltip={"从JSON导入"}
                        />
                    </div>
                    <Separator orientation="vertical" className="!h-8"/>
                    <div className="flex items-center gap-1 ml-1">
                        <MenuButton
                            icon={<PlayIcon className="h-4 w-4 text-green-400"/>}
                            onClick={() => setIsRunning(!isRunning)}
                            tooltip={"Run"}
                        />
                        <MenuButton
                            icon={<CheckCircle2 className="h-4 w-4 text-yellow-400"/>}
                            onClick={() => {}}
                            tooltip={"检查合法性"}
                        />
                    </div>
                </div>
            </header>
            <div className="h-full w-full">
                <ContextMenu>
                    <ContextMenuTrigger>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            nodeTypes={nodeTypes}
                            fitView
                        >
                            <Background variant={BackgroundVariant.Dots} className="!bg-gray-100"/>
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