import {isTokenExpired, useAuthStore} from "@/stores/authStore";
import {Project, ProjectCreateProp, ProjectTag} from "@/types/project.tsx";
import {
    DockerToolCreate,
    SimpleToolInfo,
    ToolGroup, ToolImage,
    ToolInfo,
    ToolTag
} from "@/types/tool.tsx";
import {ToolArgPublic} from "@/types/node.tsx";
import {SimpleWorkflowInfo, Workflow, WorkflowDefinition} from "@/types/workflow.tsx";
import {MonitorRecord, SimpleTask, TaskPublic} from "@/types/task.tsx";
import {RunPublic, Stats} from "@/types/run.tsx";
import {BioDb, BioDbCreate, BioDbSimple} from "@/types/resource.tsx";
import {ChatSessionPublic, LangchainMessage} from "@/types/chat.tsx";

// 基础配置
const BASE_URL = '/api/v1';

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public data?: never
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token && !isTokenExpired(token)) {
        headers['Authorization'] = `Bearer ${token}`;
    } else if (token) {
        useAuthStore.getState().logout();
    }

    return headers;
}

// 处理响应
async function handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
        useAuthStore.getState().logout();
        throw new ApiError('Unauthorized', 401);
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new ApiError(
            errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorData
        );
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }

    return await response.text() as unknown as T;
}

// 通用请求方法
async function request<T>(
    endpoint: string,
    options: RequestInit = {},
    needAuth: boolean = true
): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const defaultHeaders = needAuth ? getAuthHeaders() : {'Content-Type': 'application/json'};

    const config: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    const response = await fetch(url, config);
    return handleResponse<T>(response);
}

// API实例对象
export const api = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get<T>(url: string, config?: { params?: Record<string, any> }): Promise<T> {
        const searchParams = config?.params ? new URLSearchParams(config.params).toString() : '';
        const endpoint = searchParams ? `${url}?${searchParams}` : url;
        return request<T>(endpoint, {method: 'GET'});
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    post<T>(url: string, data?: any, config?: { params?: Record<string, any>, headers?: Record<string, string> }): Promise<T> {
        const searchParams = config?.params ? new URLSearchParams(config.params).toString() : '';
        const endpoint = searchParams ? `${url}?${searchParams}` : url;

        let body: string | undefined;
        const customHeaders = config?.headers || {};

        // 检查是否为表单数据
        if (data instanceof URLSearchParams) {
            body = data.toString();
        } else if (data) {
            body = JSON.stringify(data);
        }

        return request<T>(endpoint, {
            method: 'POST',
            body,
            headers: customHeaders,
        });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    put<T>(url: string, data?: any, config?: { params?: Record<string, any> }): Promise<T> {
        const searchParams = config?.params ? new URLSearchParams(config.params).toString() : '';
        const endpoint = searchParams ? `${url}?${searchParams}` : url;
        return request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    patch<T>(url: string, data?: any): Promise<T> {
        return request<T>(url, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    },
    delete: function <T>(url: string): Promise<T> {
        return request<T>(url, {method: 'DELETE'});
    },
};

// 公共API实例（不需要认证）
export const apiPublic = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get<T>(url: string, config?: { params?: Record<string, any> }): Promise<T> {
        const searchParams = config?.params ? new URLSearchParams(config.params).toString() : '';
        const endpoint = searchParams ? `${url}?${searchParams}` : url;
        return request<T>(endpoint, {method: 'GET'}, false);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    post<T>(url: string, data?: any): Promise<T> {
        return request<T>(url, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        }, false);
    },
};


export const workflowApi = {
    getWorkflows: async (offset: number) => {
        return await api.get<SimpleWorkflowInfo[]>('/workflows', {
            params: {offset, limit: 8}
        });
    },
    getWorkflowCount: async () => {
        return await api.get<number>('/workflows/count');
    },
    getWorkflow: async (uid: string) => {
        return await api.get<Workflow>(`/workflows/${uid}`);
    },
    saveWorkflow: async (workflow: Workflow) => {
        return await api.post('/workflows', workflow);
    },
    updateWorkflow: async (uid: string, workflow: WorkflowDefinition) => {
        return await api.patch(`/workflows/${uid}`, workflow);
    },
    newRunInstance: async (workflow: WorkflowDefinition, template_name?: string) => {
        const params = template_name !== undefined ? {template_name} : {};
        return await api.post('/workflows/run', workflow, {params});
    },
};

export const runInstanceApi = {
    getRunStats: async () => {
        return await api.get<Stats>('/runs/stats');
    },
    getRunCount: async () => {
        return await api.get<number>('/runs/count');
    },
    getRunList: async (offset: number) => {
        return await api.get<RunPublic[]>('/runs', {
            params: {offset, limit: 8}
        });
    }
};

export const instanceApi = {
    getRecentTasks: async (hour: number) => {
        return await api.get<SimpleTask[]>(`/tasks/recent/${hour}`);
    },
    getTaskCount: async () => {
        return await api.get<number>('/tasks/count');
    },
    getTaskList: async (offset: number) => {
        return await api.get<SimpleTask[]>('/tasks', {
            params: {offset, limit: 8}
        });
    },
    getTaskInfo: async (uid: string) => {
        return await api.get<TaskPublic>(`/tasks/${uid}`);
    },
    getTaskLog: async (uid: string) => {
        return await api.get<{ content: string }>(`/tasks/${uid}/log`);
    },
    getTaskMonitor: async (uid: string) => {
        return await api.get<MonitorRecord[]>(`/tasks/${uid}/monitor`);
    },

};

export const imageApi = {
    createImage: async (image: ToolImage) => {
        return await api.post<ToolImage>('/images', image)
    },
    searchImages: async (name: string) => {
        return await api.get<ToolImage[]>('/images/search', {
            params: {name: name}
        });
    },
}

export const toolApi = {
    getTagList: async () => {
        return await api.get<ToolTag[]>('/tool-tags');
    },
    getGroupList: async () => {
        return await api.get<ToolGroup[]>('/tool-groups');
    },
    getGroupTools: async (parent_id?: number) => {
        const params = parent_id !== undefined ? {parent_id} : {};
        return await api.get<SimpleToolInfo[]>('/tool-groups/tools', {params});
    },
    newTool: async (tool: DockerToolCreate) => {
        return await api.post('/tools', tool);
    },
    getToolCount: async () => {
        return await api.get<number>('/tools/count');
    },
    getToolList: async (offset?: number) => {
        return await api.get<SimpleToolInfo[]>('/tools', {
            params: {offset, limit: 10}
        });
    },
    searchToolList: async (name: string, offset?: number) => {
        const params: Record<string, string | number> = {name, limit: 12};
        if (offset !== undefined) {
            params.offset = offset;
        }
        return await api.get<SimpleToolInfo[]>('/tools/search', {params});
    },
    getTool: async (id: string) => {
        return await api.get<ToolInfo>(`/tools/${id}`);
    },
    getToolArg: async (id: string) => {
        return await api.get<ToolArgPublic>(`/tools/${id}/args`);
    },
};

export const projectApi = {
    newTag: async (name: string, color: string) => {
        return await api.post('/project-tags', {
            name: name,
            color: color
        });
    },
    getTagList: async () => {
        return await api.get<ProjectTag[]>('/project-tags');
    },
    newProject: async (project: ProjectCreateProp) => {
        return await api.post('/projects', project);
    },
    getProjectList: async () => {
        return await api.get<Project[]>('/projects');
    },
    getStarredProjectList: async () => {
        return await api.get<Project[]>('/projects/starred');
    },
    getMyProjectList: async () => {
        return await api.get<Project[]>('/projects/my');
    },
    getRecentProject: async () => {
        return await api.get<Project>('/projects/recent');
    },
    getProject: async (id: string) => {
        return await api.get<Project>(`/projects/${id}`);
    },
    starProject: async (project_id: string,) => {
        return await api.post(`/projects/${project_id}/star`);
    },
    unstarProject: async (project_id: string,) => {
        return await api.post(`/projects/${project_id}/unstar`);
    },
};

export const resourceApi = {
    newDb: async (db: BioDbCreate) => {
        return await api.post('/bio_dbs', db);
    },
    getDBList: async (offset: number) => {
        return await api.get<BioDbSimple[]>('/bio_dbs', {
            params: {offset, limit: 8}
        });
    },
    getDBCount: async () => {
        return await api.get<number>('/bio_dbs/count');
    },
    getDB: async (id: number) => {
        return await api.get<BioDb>(`/bio_dbs/${id}`);
    },
    deleteDB: async (id: number) => {
        return await api.delete(`/bio_dbs/${id}`);
    },
    searchDB: async (name: string) => {
        return await api.get<BioDb[]>('/bio_dbs/search', {
            params: {name, offset: 0, limit: 10}
        });
    }
}

export const chatApi = {
    createSession: async () => {
        return await api.post<ChatSessionPublic>('/chat');
    },
    deleteSession: async (session_id: string): Promise<{ message: string }> => {
        return await api.delete(`/chat/${session_id}`);
    },
    updateSession: async (session_id: string, description: string) => {
        return await api.put<ChatSessionPublic>(`/chat/${session_id}`, null, {
            params: {description}
        });
    },
    getSessions: async (offset: number = 0, limit: number = 8) => {
        return await api.get<ChatSessionPublic[]>('/chat', {
            params: {offset, limit}
        });
    },
    getSessionHistory: async (session_id: string) => {
        return await api.get<LangchainMessage[]>(`/chat/${session_id}/history`);
    },
}