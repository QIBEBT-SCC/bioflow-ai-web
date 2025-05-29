import {SidebarProvider} from "@/components/ui/sidebar.tsx";
import {AppSidebar} from "@/components/sidebar/app-sidebaar.tsx";
import {Suspense} from "react";
import {Outlet} from "react-router-dom";

export function MainLayout() {
    return (
        <SidebarProvider>
            <AppSidebar/>
            <Suspense fallback={<div>加载中...</div>}>
                <Outlet />
            </Suspense>
        </SidebarProvider>
    );
}
