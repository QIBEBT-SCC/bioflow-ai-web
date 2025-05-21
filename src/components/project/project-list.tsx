import {Clock, ClockIcon, PlayIcon, Star, UserIcon} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {Link} from "react-router-dom";
import {Badge} from "@/components/ui/badge.tsx";
import {colorClassMap} from "@/types/color.tsx";
import {Project} from "@/types/project.tsx";
import {Card, CardContent} from "@/components/ui/card.tsx";
import {useAllProjects, useMyProjects, useRecentProject, useStarProject, useStarredProjects} from "@/hooks/useProject.tsx";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";

function ProjectTable({projects}: { projects: Project[] }) {
    const {mutate: starProject, isPending, variables} = useStarProject();

    const handleStar = (project: Project) => {
        starProject({id: project.id, starred: project.starred});
    };

    return (
        <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="h-12 px-4">项目名称</TableHead>
                            <TableHead className="h-12 px-4">描述</TableHead>
                            <TableHead className="h-12 px-4">标签</TableHead>
                            <TableHead className="h-12 text-right">
                                <div className="flex items-center justify-end">
                                    <UserIcon className="h-3 w-3 mr-1"/>
                                    创建人
                                </div>
                            </TableHead>
                            <TableHead className="h-12 text-right">
                                <div className="flex items-center justify-end">
                                    <Clock className="h-3 w-3 mr-1"/>
                                    上次更新
                                </div>
                            </TableHead>
                            <TableHead className="h-12 text-right">
                                <div className="flex items-center justify-end">
                                    <Clock className="h-3 w-3 mr-1"/>
                                    创建
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* 项目列表行 */}
                        {projects.map((project) => (
                            <TableRow key={project.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={project.starred ? "text-amber-400" : "text-muted-foreground"}
                                            onClick={() => handleStar(project)}
                                            disabled={isPending && variables?.id === project.id}
                                        >
                                            <Star className="h-4 w-4"/>
                                            <span className="sr-only">收藏</span>
                                        </Button>
                                        <Link to={`/project/${project.id}`}
                                              className="font-medium hover:underline">
                                            {project.name}
                                        </Link>
                                    </div>
                                </TableCell>
                                <TableCell><div className="line-clamp-1">{project.description}</div></TableCell>
                                <TableCell>
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
                                </TableCell>
                                <TableCell className="text-right">{project.owner_name}</TableCell>
                                <TableCell className="text-right">{project.update_time}</TableCell>
                                <TableCell className="text-right">{project.create_time}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export function AllProjectTable() {
    const {data: projects = [], isLoading, error} = useAllProjects();

    if (isLoading) return <div>加载中...</div>;
    if (error) return <div>加载失败</div>;

    return (
        <ProjectTable projects={projects}/>
    )
}

export function StarredProjectTable() {
    const {data: projects = [], isLoading, error} = useStarredProjects();

    if (isLoading) return <div>加载中...</div>;
    if (error) return <div>加载失败</div>;

    return (
        <ProjectTable projects={projects}/>
    )
}

export function MyProjectTable() {
    const {data: projects = [], isLoading, error} = useMyProjects();

    if (isLoading) return <div>加载中...</div>;
    if (error) return <div>加载失败</div>;

    return (
        <ProjectTable projects={projects}/>
    )
}

export function RecentProjectCard() {
    const {data: recentProject = null} = useRecentProject();

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