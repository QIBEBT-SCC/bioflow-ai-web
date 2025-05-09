import {SidebarProvider} from "@/components/ui/sidebar.tsx";
import {AppSidebar} from "@/components/sidebar/app-sidebaar.tsx";
import {FlowWorkspace} from "@/components/node-editor/viewport.tsx";
import {HomePage} from "@/pages/home-page.tsx";
import {ProjectsPage} from "@/pages/project/project-page.tsx";
import {ProjectDetailPage} from "@/pages/project/project-detail-page.tsx";

interface MainLayoutProps {
    page: 'home' | 'project' | 'projectInfo' | 'editor' | 'setting';
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
            ) : (
                <HomePage/>
            )}
        </SidebarProvider>
    );
}