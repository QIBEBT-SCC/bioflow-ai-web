import type {Edge, Node} from "@xyflow/react";

export enum WorkflowType {
    SUBMODULE = 0,
    TEMPLATE = 1
}

export interface WorkflowDefinition {
    nodes: Node[];
    edges: Edge[];
}

export interface Workflow {
    name: string;
    workflow: WorkflowDefinition;
    public: boolean;
    wf_type: WorkflowType
}

export interface SimpleWorkflowInfo {
    uid: string;
    name: string;
}

