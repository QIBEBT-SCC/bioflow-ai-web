import axios from 'axios';
import {isTokenExpired, useAuthStore} from "@/stores/authStore";
import {Project, ProjectCreateProp, ProjectTag} from "@/types/project.tsx";
import {
    DockerToolCreate,
    SimpleToolInfo,
    ToolGroup,
    ToolInfo,
    ToolTag
} from "@/types/tool.tsx";
import {ToolArgPublic} from "@/types/node.tsx";
import {SimpleWorkflowInfo, Workflow, WorkflowDefinition} from "@/types/workflow.tsx";
import {MonitorRecord, SimpleTask, TaskPublic} from "@/types/task.tsx";
import {RunPublic, Stats} from "@/types/run.tsx";
import {BioDb, BioDbCreate, BioDbSimple} from "@/types/resource.tsx";
import {ChatSessionPublic} from "@/types/chat.tsx";

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
    newRunInstance: async (workflow: WorkflowDefinition, template_name?: string) => {
        const url = template_name !== undefined ? `/workflows/run?template_name=${template_name}` : '/workflows/run';
        const {data} = await api.post(url, workflow);
        return data;
    },
};

export const runInstanceApi = {
    getRunStats: async () => {
        const {data} = await api.get<Stats>('/runs/stats');
        return data;
    },
    getRunCount: async () => {
        const {data} = await api.get<number>('/runs/count');
        return data;
    },
    getRunList: async (offset: number) => {
        const {data} = await api.get<RunPublic[]>(`/runs?offset=${offset}&limit=8`);
        return data;
    }
}

export const instanceApi = {
    getRecentTasks: async (hour: number) => {
        const {data} = await api.get<SimpleTask[]>(`/tasks/recent/${hour}`);
        return data;
    },
    getTaskCount: async () => {
        const {data} = await api.get<number>('/tasks/count');
        return data;
    },
    getTaskList: async (offset: number) => {
        const {data} = await api.get<SimpleTask[]>(`/tasks?offset=${offset}&limit=8`);
        return data;
    },
    getTaskInfo: async (uid: string) => {
        const {data} = await api.get<TaskPublic>(`/tasks/${uid}`);
        return data;
    },
    getTaskLog: async (uid: string) => {
        const {data} = await api.get<{ content: string }>(`/tasks/${uid}/log`);
        return data;
    },
    getTaskMonitor: async (uid: string) => {
        const {data} = await api.get<MonitorRecord[]>(`/tasks/${uid}/monitor`);
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
    getToolCount: async () => {
        const {data} = await api.get<number>('/tools/count');
        return data;
    },
    getToolList: async (offset?: number) => {
        const url = `/tools?offset=${offset}&limit=10`;
        const {data} = await api.get<SimpleToolInfo[]>(url);
        return data
    },
    searchToolList: async (name: string, offset?: number) => {
        const url = `/tools/search?name=${name}${offset !== undefined ? `&offset=${offset}` : ''}&limit=12`;
        const {data} = await api.get<SimpleToolInfo[]>(url);
        return data;
    },
    getTool: async (id: string) => {
        const {data} = await api.get<ToolInfo>(`/tools/${id}`);
        return data;
    },
    getToolArg: async (id: string) => {
        const {data} = await api.get<ToolArgPublic>(`/tools/${id}/args`);
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

export const resourceApi = {
    newDb: async (db: BioDbCreate) => {
        const {data} = await api.post('/bio_dbs', db);
        return data;
    },
    getDBList: async (offset: number) => {
        const {data} = await api.get<BioDbSimple[]>(`/bio_dbs?offset=${offset}&limit=8`);
        return data;
    },
    getDBCount: async () => {
        const {data} = await api.get<number>('/bio_dbs/count');
        return data;
    },
    getDB: async (id: number) => {
        const {data} = await api.get<BioDb>(`/bio_dbs/${id}`)
        return data;
    },
    deleteDB: async (id: number) => {
        const {data} = await api.delete(`/bio_dbs/${id}`);
        return data;
    },
    searchDB: async (name: string) => {
        const {data} = await api.get<BioDb[]>(`/bio_dbs/search?name=${name}&offset=0&limit=10`);
        return data;
    }
}

export const chatApi = {
    // 创建新的聊天会话
    createSession: async (): Promise<ChatSessionPublic> => {
        const {data} = await api.post('/chat');
        return data;
    },

    // 获取所有聊天历史
    getSessions: async (offset: number = 0, limit: number = 8): Promise<ChatSessionPublic[]> => {
        const {data} = await api.get('/chat', {
            params: {offset, limit}
        });
        return data;
    },

    // 获取指定会话的聊天历史消息
    getSessionHistory: async (session_id: string) => {
        const {data} = await api.get(`/chat/${session_id}/history`);
        return data;
    },

    // 更新聊天历史描述
    updateSession: async (session_id: string, description: string): Promise<ChatSessionPublic> => {
        const {data} = await api.put(`/chat/${session_id}`, null, {
            params: {description}
        });
        return data;
    },

    // 删除聊天会话
    deleteSession: async (session_id: string): Promise<{message: string}> => {
        const {data} = await api.delete(`/chat/${session_id}`);
        return data;
    }
}