import axios from 'axios';
import {isTokenExpired, useAuthStore} from "@/stores/authStore";
import {Project, ProjectCreateProp, ProjectTag} from "@/types/project.tsx";
import {DockerToolCreate, SimpleToolInfo, ToolGroup, ToolInfo, ToolTag} from "@/types/tool.tsx";
import {ToolArgPublic} from "@/types/node.tsx";
import {SimpleWorkflowInfo, Workflow, WorkflowDefinition} from "@/types/workflow.tsx";
import {TaskInstance} from "@/types/instance.tsx";

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


export const workflowApi = {
    getWorkflows: async (offset: number) => {
        const url = `/workflows?offset=${offset}&limit=8`;
        const {data} = await api.get<SimpleWorkflowInfo[]>(url);
        return data;
    },
    getWorkflowCount: async () => {
        const {data} = await api.get<number>('/workflows/count');
        return data;
    },
    getWorkflow: async (uid: string) => {
        const {data} = await api.get<Workflow>(`/workflows/${uid}`);
        return data;
    },
    saveWorkflow: async (workflow: Workflow) => {
        const {data} = await api.post('/workflows', workflow);
        return data;
    },
    updateWorkflow: async (uid: string, workflow: WorkflowDefinition) => {
        const {data} = await api.patch(`/workflows/${uid}`, workflow);
        return data;
    },
};

export const instanceApi = {
    newRunInstance: async (workflow: WorkflowDefinition, project_id?: string) => {
        const url = project_id !== undefined ? `/runs?project_id=${project_id}` : '/runs';
        const {data} = await api.post(url, workflow);
        return data;
    },
    getRecentTasks: async (hour: number) => {
        const {data} = await api.get<TaskInstance[]>(`/tasks/recent/${hour}`);
        return data;
    },
    getTaskCount: async () => {
        const {data} = await api.get<number>('/tasks/count');
        return data;
    },
    getTaskList: async (offset: number) => {
        const {data} = await api.get<TaskInstance[]>(`/tasks?offset=${offset}&limit=8`);
        return data;
    },
}

export const toolApi = {
    getTagList: async () => {
        const {data} = await api.get<ToolTag[]>('/tool-tags');
        return data;
    },
    getGroupList: async () => {
        const {data} = await api.get<ToolGroup[]>('/tool-groups');
        return data;
    },
    getGroupTools: async (parent_id?: number) => {
        const url = parent_id !== undefined
            ? `/tool-groups/tools?parent_id=${parent_id}`
            : '/tool-groups/tools';
        const {data} = await api.get<SimpleToolInfo[]>(url);
        return data;
    },
    newTool: async (tool: DockerToolCreate) => {
        const {data} = await api.post('/tools', tool);
        return data;
    },
    getToolList: async () => {
        const {data} = await api.get<SimpleToolInfo[]>('/tools');
        return data
    },
    searchToolList: async (name: string, offset?: number) => {
        const url = `/tools/search?name=${name}${offset !== undefined ? `&offset=${offset}` : ''}&limit=8`;
        const {data} = await api.get<SimpleToolInfo[]>(url);
        return data;
    },
    getTool: async (uid: string) => {
        const {data} = await api.get<ToolInfo>(`/tools/${uid}`);
        return data;
    },
    getToolArg: async (uid: string) => {
        const {data} = await api.get<ToolArgPublic>(`/tools/${uid}/args`);
        return data;
    },
};

export const projectApi = {
    newTag: async (name: string, color: string) => {
        const {data} = await api.post('/project-tags', {
            name: name,
            color: color
        });
        return data;
    },
    getTagList: async () => {
        const {data} = await api.get<ProjectTag[]>('/project-tags');
        return data;
    },
    newProject: async (project: ProjectCreateProp) => {
        const {data} = await api.post('/projects', project);
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
    getRecentProject: async () => {
        const {data} = await api.get<Project>('/projects/recent');
        return data;
    },
    getProject: async (id: string) => {
        const {data} = await api.get<Project>(`/projects/${id}`);
        return data;
    },
    starProject: async (project_id: string,) => {
        const {data} = await api.post(`/projects/${project_id}/star`);
        return data;
    },
    unstarProject: async (project_id: string,) => {
        const {data} = await api.post(`/projects/${project_id}/unstar`);
        return data;
    },
}; 