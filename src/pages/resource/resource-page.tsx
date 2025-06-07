import {SidebarInset, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage} from "@/components/ui/breadcrumb.tsx";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useState} from "react";
import {SamplesManager} from "@/components/resource/samples/samples-manager.tsx";
import {DatabasesManager} from "@/components/resource/databases/database-manager.tsx";

export function ResourcePage() {
    const [activeTab, setActiveTab] = useState("samples")

    return (
        <SidebarInset className="h-screen flex flex-col">
            <header
                className="flex flex-col shrink-0 border-b">
                <div className="flex items-center gap-2 px-4 h-12 bg-background">
                    <SidebarTrigger className="-ml-1"/>
                    <Separator orientation="vertical" className="!mr-2 !h-4"/>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbPage>
                                    Resource
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto py-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">资源管理</h1>
                            <p className="text-muted-foreground">管理样本数据和生物信息数据库</p>
                        </div>
                    </div>
                    <Tabs defaultValue="samples" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="samples">样本数据</TabsTrigger>
                            <TabsTrigger value="databases">生物信息数据库</TabsTrigger>
                        </TabsList>
                        <TabsContent value="samples">
                            <SamplesManager />
                        </TabsContent>
                        <TabsContent value="databases">
                            <DatabasesManager />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </SidebarInset>
    )
}