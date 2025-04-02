import {SidebarInset, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";
import {
    ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges, addEdge, MiniMap, BackgroundVariant,
    ReactFlowProvider, useReactFlow
} from "@xyflow/react";
import {useCallback, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {Play, Save, SaveAll, Download, Menu, CheckCircle2} from "lucide-react";
import {useSaveWorkflow} from '@/hooks/useWorkflow.tsx';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent
} from "@/components/ui/context-menu.tsx";
import {type Node, type Edge, type OnNodesChange, type OnEdgesChange, type OnConnect} from "@xyflow/react";
import {useToolStore} from '@/stores/toolStore.tsx';
import {nodeConfig, nodeTypes} from "@/components/node-editor/menus.tsx";

export function FlowWorkspace() {
    return (
        <ReactFlowProvider>
            <FlowContent/>
        </ReactFlowProvider>
    );
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

        const lastId = nodes.length == 0 ? -1 : parseInt(nodes[nodes.length - 1].id.replace("node", ""))
        const newNode = {
            id: `node${lastId + 1}`,
            type,
            dragHandle: '.nodeDragable',
            position,
            data: {
                args: defaultArgs[`${type}_arg` as keyof typeof defaultArgs] ?? ''
            },
            zIndex: type === 'note' ? -10 : 20,
        };

        setNodes((nds) => [...nds, newNode]);
    }, [nodes, screenToFlowPosition, defaultArgs]);

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
                        <Button
                            variant="outline"
                            size="icon"
                            title="加载配置"
                            className="border-0 shadow-none text-muted-foreground hover:text-foreground"
                            onClick={() => {
                            }}
                        >
                            <Menu className="h-4 w-4"/>
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            title="保存"
                            className="border-0 shadow-none text-muted-foreground hover:text-foreground"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <Save className="h-4 w-4"/>
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            title="另存为"
                            className="border-0 shadow-none text-muted-foreground hover:text-foreground"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <SaveAll className="h-4 w-4"/>
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            title="导出配置"
                            className="border-0 shadow-none text-muted-foreground hover:text-foreground"
                            onClick={() => {
                            }}
                        >
                            <Download className="h-4 w-4"/>
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="!h-8"/>

                    <div className="flex items-center gap-1 ml-1">
                        <Button
                            variant="outline"
                            size="icon"
                            title="运行"
                            className="border-0 shadow-none text-muted-foreground hover:text-foreground"
                            onClick={() => setIsRunning(!isRunning)}
                        >
                            <Play className="h-4 w-4"/>
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            title="检查合法性"
                            className="border-0 shadow-none text-muted-foreground hover:text-foreground"
                            onClick={() => {
                            }}
                        >
                            <CheckCircle2 className="h-4 w-4"/>
                        </Button>
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