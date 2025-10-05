import {redirect} from "next/navigation";
import type React from "react";
import {getCurrentUser} from "@/app/actions/auth";
import {AppSidebar} from "@/components/sidebar/app-sidebar";
import {SidebarProvider} from "@/components/ui/sidebar";
import {Toaster} from "@/components/ui/sonner";

export default async function MainLayout({children,}: { children: React.ReactNode; }) {
    // 获取当前用户信息
    const user = await getCurrentUser();

    // 如果未登录，重定向到登录页
    if (!user) {
        redirect("/login");
    }

    return (
        <SidebarProvider>
            <AppSidebar user={user}/>
            <main className="flex-1 overflow-auto">{children}</main>
            <Toaster/>
        </SidebarProvider>
    );
}
