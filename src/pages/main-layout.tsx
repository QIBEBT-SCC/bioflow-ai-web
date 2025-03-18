import {SidebarProvider} from "@/components/ui/sidebar.tsx";
import {AppSidebar} from "@/components/sidebar/app-sidebaar.tsx";
import {FlowWorkspace} from "@/components/node-editor/viewport.tsx";

export function MainLayout() {
    return (
        <SidebarProvider>
            <AppSidebar/>
            <FlowWorkspace/>
        </SidebarProvider>
    );
}