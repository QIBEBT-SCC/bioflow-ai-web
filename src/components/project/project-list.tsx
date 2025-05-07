import {useProjectStore} from "@/stores/projectStore.tsx";
import {useEffect, useState} from "react";
import {projectApi} from "@/services/api.tsx";
import {Clock, ClockIcon, PlayIcon, Star, UserIcon} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {Link} from "react-router-dom";
import {Badge} from "@/components/ui/badge.tsx";
import {colorClassMap} from "@/types/color.tsx";
import {Project} from "@/types/project.tsx";
import {Card, CardContent} from "@/components/ui/card.tsx";

function ProjectTable({projects, setProjects}: { projects: Project[], setProjects: (projects: Project[]) => void; }) {
    const [loadingId, setLoadingId] = useState<number>(-1);

    const handleStar = async (project: Project) => {
        setLoadingId(project.id);
        try {
            if (project.starred) {
                await projectApi.unstarProject(`${project.id}`);
                const newProjects = projects.map(p =>
                    p.id === project.id ? {...p, starred: false} : p
                );
                setProjects(newProjects);
            } else {
                await projectApi.starProject(`${project.id}`);
                const newProjects = projects.map(p =>
                    p.id === project.id ? {...p, starred: true} : p
                );
                setProjects(newProjects);
            }

        } catch (e) {
            console.log(e)
        } finally {
            setLoadingId(-1);
        }
    };

    return (
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
                                        onClick={() => handleStar(project)}
                                        disabled={loadingId == project.id}
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
    )
}

export function AllProjectTable() {
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
        <ProjectTable projects={projects} setProjects={setProjects}/>
    )
}

export function StarredProjectTable() {
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
        <ProjectTable projects={starredProjects} setProjects={setStarredProjects}/>
    )
}

export function MyProjectTable() {
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
        <ProjectTable projects={myProjects} setProjects={setMyProjects}/>
    )
}

export function RecentProjectCard() {
    const [recentProject, setRecentProject] = useState<Project>()

    useEffect(() => {
        projectApi.getRecentProject()
            .then(setRecentProject)
            .catch(() => {
            });
    }, []);

    return (
        (!recentProject) ? (
            <Card className="border rounded-lg gap-0 py-0">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <h3 className="text-lg font-medium mb-2">没有最近运行的项目</h3>
                    <p className="text-muted-foreground">您最近运行过的项目将显示在这里。</p>
                </CardContent>
            </Card>
        ) : (
            <Card className="border rounded-lg gap-0 py-0">
                <Link to={`/project/${recentProject.id}`} className="block p-4 hover:bg-slate-50 transition-colors">
                    <div className="font-medium mb-2">{recentProject.name}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                        <ClockIcon className="h-3 w-3 mr-1"/> 最后更新: {recentProject.update_time}
                        <span className="mx-2">•</span>
                        <span className="flex items-center"><PlayIcon className="h-3 w-3 mr-1"/> -- 条数据</span>
                    </div>
                </Link>
            </Card>
        )

    )
}