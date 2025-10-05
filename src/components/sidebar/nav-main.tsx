"use client";

import {EditIcon, HomeIcon, NetworkIcon, TvMinimalIcon} from "lucide-react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect} from "react";
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import {useSidebarStore} from "@/stores/sidebar-store";

const projects = [
    {
        name: "Chat",
        url: "/chat",
        icon: HomeIcon,
    },
    {
        name: "Projects",
        url: "/project",
        icon: HomeIcon, // 临时使用 HomeIcon，后续可以换
    },
    {
        name: "Editor",
        url: "/editor",
        icon: EditIcon,
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
        icon: TvMinimalIcon,
    },
];

export function NavMain() {
    const {activePage, setActivePage} = useSidebarStore();
    const pathname = usePathname();

    // 根据当前路径自动设置活动页面
    useEffect(() => {
        if (pathname) {
            const currentPage = projects.find((p) => pathname.startsWith(p.url));
            if (currentPage) {
                setActivePage(currentPage.name);
            }
        }

    }, [pathname, setActivePage]);

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarMenu>
                {projects.map((item) => (
                    <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                            asChild
                            isActive={item.name === activePage}
                            onClick={() => setActivePage(item.name)}
                        >
                            <Link href={item.url}>
                                {item.icon_rotate ? (
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
    );
}
