import {SidebarInset, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage} from "@/components/ui/breadcrumb.tsx";
import {Card, CardContent} from "@/components/ui/card.tsx";
import {FolderIcon, PlayIcon, StarIcon, UsersIcon} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {Link} from "react-router-dom";
import {RecentProjectCard, StarredProjectTable} from "@/components/project/project-list.tsx";
import {useStarredProjects} from "@/hooks/useProject.tsx";
import {ModeToggle} from "@/components/mode-toggle.tsx";

export function HomePage() {
    const { data: projects = []} = useStarredProjects();

    return (
        <SidebarInset>
            <header
                className="flex flex-row justify-between shrink-0 border-b">
                <div className="flex items-center gap-2 px-4 h-12 bg-background">
                    <SidebarTrigger className="-ml-1"/>
                    <Separator orientation="vertical" className="!mr-2 !h-4"/>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbPage>
                                    Home
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <div className="items-center pt-1.5 px-3"><ModeToggle/></div>
            </header>
            <div className="container mx-auto px-4 py-6 space-y-8">
                {/* 收藏的项目 */}
                <section>
                    <h2 className="text-xl font-medium mb-4">收藏的项目</h2>
                    {(projects.length == 0) ? (
                        <Card className="border rounded-lg gap-0 py-0">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="bg-amber-50 p-4 rounded-full mb-4">
                                    <StarIcon className="h-6 w-6 text-amber-400"/>
                                </div>
                                <h3 className="text-lg font-medium mb-2">没有收藏的项目</h3>
                                <p className="text-muted-foreground">从您的项目列表中收藏一个项目，它将始终显示在这里。</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <StarredProjectTable/>
                    )}

                </section>

                {/* 最近的项目 */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-medium">您最近的项目</h2>
                        <div className="flex items-center gap-2">
                            <Link to="/project" className="text-sm text-muted-foreground flex items-center">
                                查看全部 <span className="ml-1">→</span>
                            </Link>
                            <Button size="sm">
                                <span className="mr-1">+</span> 新项目
                            </Button>
                        </div>
                    </div>
                    <RecentProjectCard/>


                </section>

                {/* 最近的报告 */}
                <section>
                    <h2 className="text-xl font-medium mb-4">最近的报告</h2>
                    <Card className="border rounded-lg gap-0 py-0">
                        <CardContent className="p-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="flex items-center">
                                    <div className="border rounded p-4 mr-4">
                                        <div className="w-16 h-8 bg-blue-100 rounded mb-2"></div>
                                        <div className="w-16 h-4 bg-gray-100 rounded"></div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium mb-2">创建您的第一份报告</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        报告是您的想法记录、灵感时刻以及其他所有内容。它们可以与 Web
                                        中的其他内容很好地配合，因此您可以分享、存储或解释您的发现。
                                    </p>
                                    <div className="text-xs text-blue-500">
                                        <span>← 点击查看您的图表如何在报告中展示</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* 组织活动 */}
                <section>
                    <h2 className="text-xl font-medium mb-4">组织活动</h2>
                    <Card className="border rounded-lg overflow-hidden gap-0 py-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <tbody>
                                {[
                                    {id: 1, name: "imagenet_VGGNet11", time: "1 天前", status: "已完成"},
                                    {id: 2, name: "imagenet_AlexNet", time: "3 天前", status: "已完成"},
                                    {id: 3, name: "cifar10_mlp", time: "3 周前", status: "已完成"},
                                    {id: 4, name: "cifar10_lenet", time: "3 周前", status: "已完成"},
                                    {id: 5, name: "mnist_mlp", time: "3 周前", status: "已完成"},
                                ].map((run) => (
                                    <tr key={run.id} className="border-b last:border-b-0">
                                        <td className="py-3 pl-4">
                                            <Button variant="ghost" size="sm" className="text-blue-500 px-2">
                                                <PlayIcon className="h-3 w-3 mr-1"/> 运行
                                            </Button>
                                        </td>
                                        <td className="py-3 font-medium">{run.name}</td>
                                        <td className="py-3 text-sm text-muted-foreground">{run.time}</td>
                                        <td className="py-3">
                                            <Badge
                                                variant="outline"
                                                className="bg-green-50 text-green-600 border-green-200 flex items-center"
                                            >
                                                <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                                                {run.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 text-right pr-4">
                                            <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <UsersIcon className="h-3 w-3 mr-1"/> tc_aye
                        </span>
                                                <span className="flex items-center">
                          <FolderIcon className="h-3 w-3 mr-1"/> tensorflow_models
                        </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </section>
            </div>
        </SidebarInset>
    )
}