"use client"

import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {Link} from "react-router-dom";
import {EditIcon, NetworkIcon, HomeIcon, TvMinimalIcon} from "lucide-react";
import {ProjectOutlined} from "@ant-design/icons";
import {useSidebarStore} from "@/stores/sidebar-store.tsx";

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
        icon: NetworkIcon,
        icon_rotate: true,
    },
    {
        name: "Tasks",
        url: "/task",
        icon: TvMinimalIcon
    }
]

export function NavMain() {
    const {activePage, setActivePage} = useSidebarStore()

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarMenu>
                {projects.map((item) => (
                    <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild isActive={item.name === activePage} onClick={() => setActivePage(item.name)}>
                            <Link to={item.url}>
                                {(item.icon_rotate) ? (
                                    <item.icon className="-rotate-90"/>
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
