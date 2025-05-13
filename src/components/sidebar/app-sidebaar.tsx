"use client"

import * as React from "react"
import {
    AudioWaveform,
    Command,
    GalleryVerticalEnd,
    GitFork,
    Home,
    Settings2,
    TvMinimal,
    EditIcon,
    BoxesIcon
} from "lucide-react"
import {ProjectOutlined} from "@ant-design/icons"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar.tsx"
import {NavMain} from "@/components/sidebar/nav-main.tsx";
import {NavUser} from "@/components/sidebar/nav-user.tsx";
import {TeamSwitcher} from "@/components/sidebar/team-switcher.tsx";

// This is sample data.
const data = {
    teams: [
        {
            name: "Acme Inc",
            logo: GalleryVerticalEnd,
            plan: "Enterprise",
        },
        {
            name: "Acme Corp.",
            logo: AudioWaveform,
            plan: "Startup",
        },
        {
            name: "Evil Corp.",
            logo: Command,
            plan: "Free",
        },
    ],
    projects: [
        {
            name: "Home",
            url: "/home",
            icon: Home,
        },
        {
            name: "Projects",
            url: "/project",
            icon: ProjectOutlined,
        },
        {
            name: "Workflows",
            url: "/workflow",
            icon: GitFork,
            icon_rotate: true,
        },
        {
            name: "Tasks",
            url: "/task",
            icon: TvMinimal
        },
        {
            name: "Editor",
            url: "/editor",
            icon: EditIcon
        },
        {
            name: "ToolConfig",
            url: "/tool",
            icon: BoxesIcon,
        },
    ],
}

export function AppSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={data.teams}/>
            </SidebarHeader>
            <SidebarContent>
                <NavMain projects={data.projects}/>
            </SidebarContent>
            <SidebarFooter>
                <NavUser/>
            </SidebarFooter>
            <SidebarRail/>
        </Sidebar>
    )
}
