import {SidebarProvider} from "@/components/ui/sidebar.tsx";
import {AppSidebar} from "@/components/sidebar/app-sidebaar.tsx";
import {Suspense} from "react";
import {Outlet} from "react-router-dom";
import {LoadingSpinner} from "@/components/ui/loading-spinner.tsx";

export function MainLayout() {
    return (
        <SidebarProvider>
            <AppSidebar/>
            <Suspense fallback={<LoadingSpinner size="md" text="加载中..." />}>
                <Outlet />
            </Suspense>
        </SidebarProvider>
    );
}
