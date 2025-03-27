import axios from 'axios';
import {type Edge, type Node} from "@xyflow/react";

const api = axios.create({
    baseURL: '/api/v1', // 通过vite的proxy配置，会自动代理到 http://172.18.19.113:8000
});

// 后续添加认证拦截器
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

export interface WorkflowDefinition {
    nodes: Node[];
    edges: Edge[];
}

export interface DefaultArgs {
    [key: string]: string;
}

export const workflowApi = {
    // TODO: 后续通过状态管理或props传入工作流名称
    saveWorkflow: async (workflow: WorkflowDefinition) => {
        const {data} = await api.post('/workflow/flows/default_workflow', workflow);
        return data;
    },
    getWorkflows: async () => {
        const {data} = await api.get<string[]>('/workflow/flows');
        return data;
    },
};

export const toolApi = {
    getDefaultArgs: async () => {
        const {data} = await api.get<DefaultArgs>('/tool/args');
        return data;
    },
}; 