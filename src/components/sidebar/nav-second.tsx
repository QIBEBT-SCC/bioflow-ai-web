import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "@/components/ui/sidebar.tsx";
import {SettingsIcon, WrenchIcon, ServerCogIcon} from "lucide-react";
import {useSidebarStore} from "@/stores/sidebar-store.tsx";
import {Link} from "react-router-dom";

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
]

export function NavSecond() {
    const {activePage, setActivePage} = useSidebarStore()

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {projects.map((item) => (
                        <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton asChild isActive={item.name === activePage} onClick={() => setActivePage(item.name)}>
                                <Link to={item.url}>
                                    <item.icon/>
                                    <span>{item.name}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}