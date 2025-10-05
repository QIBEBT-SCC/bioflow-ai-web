"use client";

import {ServerCogIcon, SettingsIcon, WrenchIcon} from "lucide-react";
import Link from "next/link";
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import {useSidebarStore} from "@/stores/sidebar-store";

const projects = [
    {
        name: "ToolConfig",
        url: "/tool",
        icon: WrenchIcon,
    },
    {
        name: "Resource Management",
        url: "/resource",
        icon: ServerCogIcon,
    },
    {
        name: "Setting",
        url: "/setting",
        icon: SettingsIcon,
    },
];

export function NavSecond() {
    const {activePage, setActivePage} = useSidebarStore();

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {projects.map((item) => (
                        <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton
                                asChild
                                isActive={item.name === activePage}
                                onClick={() => setActivePage(item.name)}
                            >
                                <Link href={item.url}>
                                    <item.icon/>
                                    <span>{item.name}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
