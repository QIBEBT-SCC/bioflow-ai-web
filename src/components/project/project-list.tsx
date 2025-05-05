import {useProjectStore} from "@/stores/projectStore.tsx";
import {useEffect} from "react";
import {projectApi} from "@/services/api.tsx";
import {Clock, Star, UserIcon} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {Link} from "react-router-dom";
import {Badge} from "@/components/ui/badge.tsx";
import {colorClassMap} from "@/types/color.tsx";
import {TabsContent} from "@/components/ui/tabs.tsx";
import {Project} from "@/types/project.tsx";

function ProjectTable({name, projects}: { name: string; projects: Project[] }) {
    return (
        <TabsContent value={name} className="mt-6">
            <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="bg-muted/50">
                        <tr className="border-b">
                            <th className="h-12 px-4 text-left align-middle font-medium hidden md:table-cell">项目名称</th>
                            <th className="h-12 px-4 text-left align-middle font-medium hidden md:table-cell">描述</th>
                            <th className="h-12 px-4 text-left align-middle font-medium hidden lg:table-cell">标签</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">
                                <div className="flex items-center">
                                    <UserIcon className="h-3 w-3 mr-1"/>
                                    创建人
                                </div>
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium">
                                <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1"/>
                                    上次更新
                                </div>
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium">
                                <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1"/>
                                    创建
                                </div>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {/* 项目列表行 */}
                        {projects.map((project) => (
                            <tr key={project.id} className="border-b hover:bg-muted/50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={project.starred ? "text-amber-400" : "text-muted-foreground"}
                                        >
                                            <Star className="h-4 w-4"/>
                                            <span className="sr-only">收藏</span>
                                        </Button>
                                        <Link to={`/project/${project.id}`}
                                              className="font-medium hover:underline">
                                            {project.name}
                                        </Link>
                                    </div>
                                </td>
                                <td className="p-4 text-muted-foreground hidden md:table-cell">
                                    <div className="line-clamp-1">{project.description}</div>
                                </td>
                                <td className="p-4 hidden lg:table-cell">
                                    <div className="flex flex-wrap gap-1">
                                        {project.tags.map((tag) => (
                                            <Badge
                                                key={tag.id}
                                                className={`${colorClassMap[tag.color]} border-0`}
                                            >
                                                {tag.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-4 text-muted-foreground">
                                    {project.owner_name}
                                </td>
                                <td className="p-4 text-muted-foreground">
                                    {project.update_time}
                                </td>
                                <td className="p-4 text-muted-foreground">
                                    {project.create_time}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </TabsContent>
    )
}

export function AllProjectTab() {
    const {projects, setProjects} = useProjectStore();
    useEffect(() => {
        if (projects.length === 0) {
            projectApi.getProjectList()
                .then(setProjects)
                .catch(() => {/* 错误处理可扩展 */
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <ProjectTable name="all" projects={projects}/>
    )
}

export function StarredProjectTab() {
    const {starredProjects, setStarredProjects} = useProjectStore();
    useEffect(() => {
        if (starredProjects.length === 0) {
            projectApi.getStarredProjectList()
                .then(setStarredProjects)
                .catch(() => {/* 错误处理可扩展 */
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <ProjectTable name="starred" projects={starredProjects}/>
    )
}

export function MyProjectTab() {
    const {myProjects, setMyProjects} = useProjectStore();
    useEffect(() => {
        if (myProjects.length === 0) {
            projectApi.getMyProjectList()
                .then(setMyProjects)
                .catch(() => {/* 错误处理可扩展 */
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <ProjectTable name="my" projects={myProjects}/>
    )
}