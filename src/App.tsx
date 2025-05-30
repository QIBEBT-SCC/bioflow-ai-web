import React, {Suspense} from "react";
import {MainLayout} from "@/pages/main-layout.tsx";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {isTokenExpired, useAuthStore} from "@/stores/authStore.tsx";
import {createBrowserRouter, Navigate, RouterProvider} from "react-router-dom";
import {LoginPage} from "@/pages/login-page.tsx";
import {TooltipProvider} from "@/components/ui/tooltip.tsx";

// 懒加载页面组件，确保为默认导出
const HomePage = React.lazy(() => import("@/pages/home-page.tsx").then(m => ({default: m.HomePage})));
const ProjectsPage = React.lazy(() => import("@/pages/project/project-page.tsx").then(m => ({default: m.ProjectsPage})));
const ProjectDetailPage = React.lazy(() => import("@/pages/project/project-detail-page.tsx").then(m => ({default: m.ProjectDetailPage})));
const FlowWorkspace = React.lazy(() => import("@/components/node-editor/viewport.tsx").then(m => ({default: m.FlowWorkspace})));
const TaskPage = React.lazy(() => import("@/pages/task/task-page.tsx").then(m => ({default: m.TaskPage})));
const ToolsPage = React.lazy(() => import("@/pages/tool/tool-page.tsx").then(m => ({default: m.ToolsPage})));
const AddToolPage = React.lazy(() => import("@/pages/tool/add-tool-page.tsx").then(m => ({default: m.AddToolPage})));
const ToolDetailPage = React.lazy(() => import("@/pages/tool/tool-detail-page.tsx").then(m => ({default: m.ToolDetailPage})));
const TaskDetailPage = React.lazy(() => import("@/pages/task/task-detail-page.tsx").then(m => ({default: m.TaskDetailPage})))

// 受保护的路由组件
const ProtectedRoute = ({children}: { children: React.ReactNode }) => {
    const token = localStorage.getItem('token')
    const {isAuthenticated, logout} = useAuthStore()

    React.useEffect(() => {
        if (token && isTokenExpired(token)) {
            logout()
            return
        }
    }, [token, logout])

    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>
    }
    return <>{children}</>
}

// 公开路由组件
const PublicRoute = ({children}: { children: React.ReactNode }) => <>{children}</>;

const withSuspense = (Component: React.LazyExoticComponent<any>) => (
    <Suspense fallback={<div>加载中...</div>}>
        <Component/>
    </Suspense>
);

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 5 * 60 * 1000,
        },
    },
});

export default function App() {
    const router = createBrowserRouter([
        {
            path: "/login",
            element: <PublicRoute><LoginPage/></PublicRoute>,
        },
        {
            path: "/",
            element: <ProtectedRoute><MainLayout/></ProtectedRoute>,
            children: [
                {path: "home", element: withSuspense(HomePage)},
                {
                    path: "project",
                    children: [
                        {index: true, element: withSuspense(ProjectsPage)},
                        {path: ":projectId", element: withSuspense(ProjectDetailPage)}
                    ]
                },
                {
                    path: "editor",

                    children: [
                        {index: true, element: withSuspense(FlowWorkspace),},
                        {path: ":workflowUid", element: withSuspense(FlowWorkspace)},
                    ]
                },
                {
                    path: "task",
                    children: [
                        {index: true, element: withSuspense(TaskPage)},
                        {path: ":taskUid", element: withSuspense(TaskDetailPage)}
                    ]
                },
                {
                    path: "tool",
                    children: [
                        {index: true, element: withSuspense(ToolsPage)},
                        {path: "add", element: withSuspense(AddToolPage)},
                        {path: ":toolUid", element: withSuspense(ToolDetailPage)},
                    ]
                },
                {path: "*", element: <Navigate to="/home" replace/>},
            ]
        },
        {
            path: "*",
            element: <Navigate to="/home" replace/>,
        }
    ]);

    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <RouterProvider router={router}/>
            </TooltipProvider>
        </QueryClientProvider>
    );
}

