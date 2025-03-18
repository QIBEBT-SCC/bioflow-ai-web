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
import {TextUpdaterNode} from "@/components/node-editor/custom-node.tsx";

const initialNodes = [
    {
        id: 'node-1',
        type: 'textUpdater',
        position: {x: 0, y: 0},
        data: {title: 'FastP'},
    },
    {
        id: 'node-2',
        type: 'output',
        targetPosition: 'left',
        position: {x: 0, y: 200},
        data: {label: 'node 2'},
    },
    {
        id: 'node-3',
        type: 'output',
        targetPosition: 'left',
        position: {x: 200, y: 200},
        data: {label: 'node 3'},
    },
];

const initialEdges = [
    {id: 'edge-1', source: 'node-1', sourceHandle: 'a', target: 'node-2'},
    {id: 'edge-2', source: 'node-1', sourceHandle: 'b', target: 'node-3'},
];

const nodeTypes = {textUpdater: TextUpdaterNode};

export function FlowWorkspace() {
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);

    const onNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [setNodes],
    );
    const onEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges],
    );
    const onConnect = useCallback(
        (connection) => setEdges((eds) => addEdge(connection, eds)),
        [setEdges],
    );

    return (
        <SidebarInset>
            <header
                className="flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b-2">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1"/>
                    <Separator orientation="vertical" className="mr-2 h-4"/>
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