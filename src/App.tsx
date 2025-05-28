import {MainLayout} from "@/pages/main-layout.tsx";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {isTokenExpired, useAuthStore} from "@/stores/authStore.tsx";
import {createBrowserRouter, Navigate, RouterProvider} from "react-router-dom";
import React, {useEffect} from "react";
import {LoginPage} from "@/pages/login-page.tsx";
import {TooltipProvider} from "@/components/ui/tooltip.tsx";

// 受保护的路由组件
const ProtectedRoute = ({children}: { children: React.ReactNode }) => {
    const token = localStorage.getItem('token')
    const {isAuthenticated, logout} = useAuthStore()

    useEffect(() => {
        // 检查 token 是否过期
        if (token && isTokenExpired(token)) {
            logout()
            return
        }
    }, [token, logout])

    // 如果没有认证，重定向到登录页
    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>
    }

    return <>{children}</>
}

// 公开路由组件
const PublicRoute = ({children}: { children: React.ReactNode }) => {
    return <>{children}</>
}


const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
})

export default function App() {
    const router = createBrowserRouter(
        [
            {
                path: "/login",
                element: <PublicRoute><LoginPage/></PublicRoute>,
            },
            {
                path: "/home",
                element: <ProtectedRoute><MainLayout page={"home"}/></ProtectedRoute>,
            },
            {
                path: "/project",
                element: <ProtectedRoute><MainLayout page={"project"}/></ProtectedRoute>
            },
            {
                path: "/project/:projectId",
                element: <ProtectedRoute><MainLayout page={"projectInfo"}/></ProtectedRoute>
            },
            {
                path: "/editor",
                element: <ProtectedRoute><MainLayout page={"editor"}/></ProtectedRoute>
            },
            {
                path: "/editor/:workflowUid",
                element: <ProtectedRoute><MainLayout page={"editor"}/></ProtectedRoute>
            },
            {
              path:"/task",
              element:<ProtectedRoute><MainLayout page={"task"}/></ProtectedRoute>
            },
            {
                path: "/tool",
                element: <ProtectedRoute><MainLayout page={"tool"}/></ProtectedRoute>,
            },
            {
                path: "/tool/add",
                element: <ProtectedRoute><MainLayout page={"addTool"}/></ProtectedRoute>
            },
            {
                path: "/tool/:toolUid",
                element: <ProtectedRoute><MainLayout page={"toolInfo"}/></ProtectedRoute>
            },
            {
                path: "/",
                element: <Navigate to="/home" replace/>,
            },
            {
                path: "*",
                element: <Navigate to="/home" replace/>,
            }
        ]
    )

    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <RouterProvider
                    router={router}
                />
            </TooltipProvider>
        </QueryClientProvider>
    );
}

