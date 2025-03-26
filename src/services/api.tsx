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
    fastp_arg: string;
    // 后续可以添加其他工具的默认参数
}

export const workflowApi = {
    runWorkflow: async (workflow: WorkflowDefinition) => {
        const {data} = await api.post('/workflow/run', workflow);
        return data;
    },
};

export const toolApi = {
    getDefaultArgs: async () => {
        const {data} = await api.get<DefaultArgs>('/tool/args');
        return data;
    },
}; 