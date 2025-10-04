import {useQueryClient} from '@tanstack/react-query'
import {
    addEdge,
    Background,
    BackgroundVariant,
    Controls,
    type FinalConnectionState,
    MiniMap,
    ReactFlow,
    ReactFlowProvider,
    useReactFlow,
    type XYPosition,
} from '@xyflow/react'
import {
    CheckCircle2Icon,
    DownloadIcon,
    MenuIcon,
    PlayIcon,
    SaveAllIcon,
    SaveIcon,
    UploadIcon,
} from 'lucide-react'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {useShallow} from 'zustand/react/shallow'
import {
    LoadWorkflowDialog,
    MenuButton,
    SaveWorkflowDialog,
} from '@/components/node-editor/menu/editor-menu-component'
import {PanelMenu} from '@/components/node-editor/menu/panel-menu.tsx'
import {
    PythonCodeNode,
    RCodeNode,
} from '@/components/node-editor/node/code-node.tsx'
import {Copy2FolderNode} from '@/components/node-editor/node/data-node.tsx'
import {
    DBInputNode,
    FileInputNode,
    ReferenceInputNode,
    SequenceInputNode,
    StringInputNode,
} from '@/components/node-editor/node/input-node.tsx'
import {NoteNode} from '@/components/node-editor/node/note-node.tsx'
import {ToolNode} from '@/components/node-editor/node/tool-node.tsx'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb.tsx'
import {Separator} from '@/components/ui/separator.tsx'
import {SidebarInset, SidebarTrigger} from '@/components/ui/sidebar.tsx'
import {useUpdateWorkflow, useWorkflow} from '@/hooks/useWorkflow.tsx'
import {generateLetterId} from '@/lib/id-generator'
import {workflowApi} from '@/services/api.tsx'
import {useNodeEditorStore} from '@/stores/nodeviewStore.tsx'

const nodeTypes = {
    tool: ToolNode,
    value_string: StringInputNode,
    resource_file: FileInputNode,
    resource_sequence: SequenceInputNode,
    resource_db: DBInputNode,
    resource_genome: ReferenceInputNode,
    processor_copy2folder: Copy2FolderNode,
    // processor_cut: CutNode,
    // processor_concat: ConcatNode,
    code_R: RCodeNode,
    code_python: PythonCodeNode,
    note: NoteNode,
    // lineFig: LineFigNode,
}

function FlowContent() {
    const {
        currentWorkflowUid,
        setCurrentWorkflowUid,
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        setNodes,
        setEdges,
    } = useNodeEditorStore(
        useShallow((state) => ({
            currentWorkflowUid: state.currentWorkflowUid,
            setCurrentWorkflowUid: state.setCurrentWorkflowUid,
            nodes: state.nodes,
            edges: state.edges,
            onNodesChange: state.onNodesChange,
            onEdgesChange: state.onEdgesChange,
            onConnect: state.onConnect,
            setNodes: state.setNodes,
            setEdges: state.setEdges,
        })),
    )
    const {screenToFlowPosition} = useReactFlow()

    const queryClient = useQueryClient()

    const {data: workflowData} = useWorkflow({uid: currentWorkflowUid})
    const {mutate: updateWorkflow} = useUpdateWorkflow()

    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [clickPosition, setClickPosition] = useState<XYPosition>({x: 0, y: 0})

    const openMenu = (
        event: MouseEvent | React.MouseEvent<Element, MouseEvent>,
    ) => {
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
    }

    const onAddNode = (nodeType: string, resourceId?: string) => {
        const nodeId = generateLetterId()
        const position = screenToFlowPosition(clickPosition, {snapToGrid: true})

        const nodeConfig = {
            tool: {data: {resource_uid: resourceId, args: ''}},
            resource_db: {data: {resource_uid: resourceId, args: ''}},
            resource_sequence: {data: {args: {r1: '', r2: ''}}},
            resource_genome: {data: {args: {requiredIndex: []}}},
            code_R: {data: {args: {description: '', code: ''}}},
            code_python: {data: {args: {description: '', code: ''}}},
        }

        const config = nodeConfig[nodeType as keyof typeof nodeConfig]
        const newNode = {
            id: nodeId,
            type: nodeType,
            dragHandle: '.nodeDragable',
            position,
            data: config?.data ?? {args: ''},
            zIndex: nodeType === 'note' ? -10 : 20,
        }

        setNodes([...nodes, newNode])
    }

    const onConnectEnd = useCallback(
        (event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
            // when a connection is dropped on the pane it's not valid
            if (!connectionState.isValid) {
                // we need to remove the wrapper bounds, in order to get the correct position
                if (
                    connectionState.fromNode &&
                    connectionState.fromNode.type === 'resource_genome'
                ) {
                    const nodeId = generateLetterId()
                    const {clientX, clientY} =
                        'changedTouches' in event ? event.changedTouches[0] : event
                    const position = screenToFlowPosition({
                        x: clientX - 300,
                        y: clientY - 20,
                    })

                    const newNode = {
                        id: nodeId,
                        type: 'value_string',
                        dragHandle: '.nodeDragable',
                        position,
                        data: {args: ''},
                        zIndex: 20,
                    }
                    setNodes([...nodes, newNode])
                    setEdges(
                        addEdge(
                            {
                                source: nodeId,
                                sourceHandle: `${nodeId}-out-value`,
                                target: connectionState.fromNode?.id ?? '',
                                targetHandle: connectionState.fromHandle?.id ?? '',
                                animated: true,
                            },
                            edges,
                        ),
                    )
                    console.log(connectionState)
                }
            }
        },
        [edges, nodes, screenToFlowPosition, setEdges, setNodes],
    )

    const onLoadWorkflow = (uid: string) => {
        setCurrentWorkflowUid(uid)
    }

    useEffect(() => {
        if (currentWorkflowUid) {
            if (workflowData?.workflow) {
                setNodes(workflowData.workflow.nodes || [])
                setEdges(workflowData.workflow.edges || [])
            }
        }
    }, [currentWorkflowUid, workflowData, setEdges, setNodes])

    const onUpdate = () => {
        const workflow = {
            nodes: nodes,
            edges: edges,
        }

        updateWorkflow(
            {uid: currentWorkflowUid, workflow: workflow},
            {
                onSuccess: () => {
                    queryClient
                        .invalidateQueries({queryKey: ['workflow', currentWorkflowUid]})
                        .then()
                    alert('修改已保存！')
                },
                onError: (error) => {
                    console.log(error)
                },
            },
        )
    }

    const onRun = () => {
        const workflow = {
            nodes,
            edges,
        }
        const template_name = workflowData?.name ?? undefined
        workflowApi.newRunInstance(workflow, template_name).then((data) => {
            if (data) {
                console.log(data)
            }
        })
    }

    return (
        <SidebarInset>
            <header className='flex shrink-0 flex-col border-b'>
                <div className='flex h-12 items-center gap-2 bg-background px-4'>
                    <SidebarTrigger className='-ml-1'/>
                    <Separator orientation='vertical' className='!mr-2 !h-4'/>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className='hidden md:block'>
                                <BreadcrumbPage>workflow editor</BreadcrumbPage>
                            </BreadcrumbItem>
                            {currentWorkflowUid && (
                                <>
                                    <BreadcrumbSeparator className='hidden md:block'/>
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className='font-semibold'>
                                            {workflowData?.name ?? '--'}
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </>
                            )}
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <div className='flex h-12 items-center border-t bg-muted/30 px-3'>
                    <div className='mr-2 flex items-center gap-1'>
                        <LoadWorkflowDialog
                            icon={<MenuIcon className='h-4 w-4'/>}
                            onClick={onLoadWorkflow}
                            tooltip={'加载配置'}
                        />
                        <MenuButton
                            icon={<SaveIcon className='h-4 w-4'/>}
                            onClick={onUpdate}
                            tooltip={'保存'}
                            disable={!currentWorkflowUid}
                        />
                        <SaveWorkflowDialog
                            icon={<SaveAllIcon className='h-4 w-4'/>}
                            tooltip={'另存为'}
                        />
                        <MenuButton
                            icon={<DownloadIcon className='h-4 w-4'/>}
                            onClick={() => {
                            }}
                            tooltip={'导出配置'}
                        />
                        <MenuButton
                            icon={<UploadIcon className='h-4 w-4'/>}
                            onClick={() => {
                            }}
                            tooltip={'从JSON导入'}
                        />
                    </div>
                    <Separator orientation='vertical' className='!h-8'/>
                    <div className='ml-1 flex items-center gap-1'>
                        <MenuButton
                            icon={<PlayIcon className='h-4 w-4 text-green-400'/>}
                            onClick={onRun}
                            tooltip={'Run'}
                        />
                        <MenuButton
                            icon={<CheckCircle2Icon className='h-4 w-4 text-yellow-400'/>}
                            onClick={() => {
                            }}
                            tooltip={'检查合法性'}
                        />
                    </div>
                </div>
            </header>
            <div className='h-full w-full'>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onPaneContextMenu={openMenu}
                    onPaneClick={closeMenu}
                    onConnect={onConnect}
                    onConnectEnd={onConnectEnd}
                    nodeTypes={nodeTypes}
                    defaultEdgeOptions={{animated: true}}
                    fitView
                >
                    <Background
                        variant={BackgroundVariant.Dots}
                        className='!bg-gray-100'
                    />
                    <Controls/>
                    <MiniMap nodeStrokeWidth={3} zoomable pannable/>
                </ReactFlow>
                <PanelMenu
                    isOpen={isMenuOpen}
                    position={clickPosition}
                    onClose={closeMenu}
                    onSelectTool={onAddNode}
                />
            </div>
        </SidebarInset>
    )
}

export function FlowWorkspace() {
    return (
        <ReactFlowProvider>
            <FlowContent/>
        </ReactFlowProvider>
    )
}
