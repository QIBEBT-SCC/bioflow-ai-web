import axios from 'axios';
import {isTokenExpired, useAuthStore} from "@/stores/authStore";
import {Project, ProjectCreateProp, ProjectTag} from "@/types/project.tsx";
import {
    AIGenProp,
    AIGenTool,
    DockerToolCreate,
    EventType,
    SimpleToolInfo,
    ToolGroup,
    ToolInfo,
    ToolSSEEventData,
    ToolTag
} from "@/types/tool.tsx";
import {ToolArgPublic} from "@/types/node.tsx";
import {SimpleWorkflowInfo, Workflow, WorkflowDefinition} from "@/types/workflow.tsx";
import {MonitorRecord, SimpleTask, TaskPublic} from "@/types/task.tsx";
import {RunPublic, Stats} from "@/types/run.tsx";
import {BioDb, BioDbCreate, BioDbSimple} from "@/types/resource.tsx";

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
    // 使用fetch方式处理POST表单数据和身份认证
    generateToolConfig: async (
        prop: AIGenProp,
        onMessage: (event: ToolSSEEventData) => void,
        onError?: (error: Error) => void,
        onComplete?: () => void
    ): Promise<void> => {
        const token = localStorage.getItem('token');

        try {
            // 构建FormData
            const formData = new FormData();
            formData.append('name', prop.name.trim());
            formData.append('description', prop.description.trim());
            formData.append('help_command', prop.help_command.trim());
            formData.append('repository', prop.repository.trim());
            formData.append('tag', (prop.tag || 'latest').trim());

            const response = await fetch('/api/v1/tools/ai/config', {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    // 不设置Content-Type，让浏览器自动设置multipart/form-data
                },
                body: formData,
            });

            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    console.error('API Error Details:', errorData);
                } catch (e) {
                    console.error('Failed to parse error response:', e);
                }
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('无法读取响应流');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            try {
                while (true) {
                    const {done, value} = await reader.read();

                    if (done) {
                        onComplete?.();
                        break;
                    }

                    buffer += decoder.decode(value, {stream: true});

                    // 按照SSE格式解析，每个消息以两个换行符分隔
                    const messages = buffer.split('\n\n');
                    buffer = messages.pop() || ''; // 保留最后一个可能不完整的消息

                    for (const message of messages) {
                        if (message.trim() === '') continue;

                        const lines = message.split('\n');
                        let eventType: EventType = EventType.LOADING;
                        let data: string | AIGenTool | null = null;

                        for (const line of lines) {
                            if (line.startsWith('event:')) {
                                eventType = line.substring(6).trim() as EventType;
                            } else if (line.startsWith('data:')) {
                                try {
                                    data = JSON.parse(line.substring(5).trim());
                                } catch (e) {
                                    console.log(e)
                                    // 如果不是JSON，就作为字符串处理
                                    data = line.substring(5).trim();
                                }
                            }
                        }

                        if (data !== null) {
                            onMessage({event: eventType, data});
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }
        } catch (error) {
            onError?.(error as Error);
        }
    }
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
    }
}