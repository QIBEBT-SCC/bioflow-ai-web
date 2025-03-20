import axios from 'axios';

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
  nodes: any[];
  edges: any[];
}

export const workflowApi = {
  runWorkflow: async (workflow: WorkflowDefinition) => {
    const { data } = await api.post('/workflow/run', workflow);
    return data;
  },
}; 