import axios from 'axios';
import {type Edge, type Node} from "@xyflow/react";
import {isTokenExpired, useAuthStore} from "@/stores/authStore";
import {Project, Tag} from "@/types/project.tsx";

export const api = axios.create({
    baseURL: '/api/v1',
});

export const apiPublic = axios.create({
    baseURL: '/api/v1'
})

// 添加认证拦截器
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    // 检查token是否过期
    if (token && !isTokenExpired(token)) {
        config.headers.Authorization = `Bearer ${token}`;
    } else if (token) {
        // 如果token存在但已过期，执行登出操作
        useAuthStore.getState().logout();
    }

    return config;
});

// 添加响应拦截器
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // 执行登出操作
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

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
    getWorkflow: async (name: string) => {
        const {data} = await api.get<WorkflowDefinition>(`/workflow/flows/${name}`);
        return data;
    },
};

export const toolApi = {
    getDefaultArgs: async () => {
        const {data} = await apiPublic.get<DefaultArgs>('/tool/args');
        return data;
    },
};

export const projectApi = {
    newTag: async (name: string, color: string) => {
        const {data} = await api.post('/tags', null, {
            params: {name, color}
        });
        return data;
    },
    getTagList: async () => {
        const {data} = await api.get<Tag[]>('/tags');
        return data;
    },
    getProjectList: async () => {
        const {data} = await api.get<Project[]>('/projects');
        return data;
    },
    getStarredProjectList: async () => {
        const {data} = await api.get<Project[]>('/projects/starred');
        return data;
    },
    getMyProjectList: async () => {
        const {data} = await api.get<Project[]>('/projects/my');
        return data;
    },
    getProject: async (id: string) => {
        const {data} = await api.get<Project>(`/projects/${id}`);
        return data;
    }
}; 