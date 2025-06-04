"use client"

import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {Link} from "react-router-dom";
import {BoxesIcon, EditIcon, GitForkIcon, HomeIcon, TvMinimalIcon} from "lucide-react";
import {ProjectOutlined} from "@ant-design/icons";
import {useState} from "react";

const projects = [
    {
        name: "Home",
        url: "/home",
        icon: HomeIcon,
    },
    {
        name: "Projects",
        url: "/project",
        icon: ProjectOutlined,
    },
    {
        name: "Editor",
        url: "/editor",
        icon: EditIcon
    },
    {
        name: "Workflows",
        url: "/workflow",
        icon: GitForkIcon,
        icon_rotate: true,
    },
    {
        name: "Tasks",
        url: "/task",
        icon: TvMinimalIcon
    },
    {
        name: "ToolConfig",
        url: "/tool",
        icon: BoxesIcon,
    },
]

export function NavMain() {
    const [activePage, setActivePage] = useState('Home')

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarMenu>
                {projects.map((item) => (
                    <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild isActive={item.name === activePage} onClick={() => setActivePage(item.name)}>
                            <Link to={item.url}>
                                {(item.icon_rotate) ? (
                                    <item.icon className="rotate-90"/>
                                ) : (
                                    <item.icon/>
                                )}
                                <span>{item.name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}
