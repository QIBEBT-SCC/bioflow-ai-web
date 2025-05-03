"use client"

import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {Link} from "react-router-dom";

export function NavMain({projects}: {
    projects: {
        name: string
        url: string
        icon: any
        icon_rotate?: boolean
    }[]
}) {

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarMenu>
                {projects.map((item) => (
                    <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild>
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
