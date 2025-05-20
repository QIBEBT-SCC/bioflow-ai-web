import type {Edge, Node} from "@xyflow/react";

export interface WorkflowDefinition {
    nodes: Node[];
    edges: Edge[];
}

export interface Workflow {
    name: string;
    workflow: WorkflowDefinition;
    public: boolean;
}

export interface SimpleWorkflowInfo {
    uid: string;
    name: string;
}