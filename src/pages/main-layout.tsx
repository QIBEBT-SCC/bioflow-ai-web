import {SidebarProvider} from "@/components/ui/sidebar.tsx";
import {AppSidebar} from "@/components/sidebar/app-sidebaar.tsx";
import {FlowWorkspace} from "@/components/node-editor/viewport.tsx";
import {HomePage} from "@/pages/home-page.tsx";
import {ProjectsPage} from "@/pages/project/project-page.tsx";
import {ProjectDetailPage} from "@/pages/project/project-detail-page.tsx";
import {AddToolPage} from "@/pages/tool/add-tool-page.tsx";
import {ToolsPage} from "@/pages/tool/tool-page.tsx";
import {ToolDetailPage} from "@/pages/tool/tool-detail-page.tsx";
import {TaskPage} from "@/pages/task/task-page.tsx";

interface MainLayoutProps {
    page: 'home' | 'project' | 'projectInfo' | 'editor' | 'task' | 'tool' | 'addTool' | 'toolInfo' | 'setting';
}

export function MainLayout({page}: MainLayoutProps) {
    return (
        <SidebarProvider>
            <AppSidebar/>
            {(page === 'home') ? (
                <HomePage/>
            ) : (page === 'project') ? (
                <ProjectsPage/>
            ) : (page === 'projectInfo') ? (
                <ProjectDetailPage/>
            ) : (page === 'editor') ? (
                <FlowWorkspace/>
            ) : (page === 'tool') ? (
                <ToolsPage/>
            ) : (page === 'task') ? (
                <TaskPage/>
            ) : (page === 'addTool') ? (
                <AddToolPage/>
            ) : (page === 'toolInfo') ? (
                <ToolDetailPage/>
            ) : (
                <HomePage/>
            )}
        </SidebarProvider>
    );
}