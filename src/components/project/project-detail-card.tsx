import {Link, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {Project} from "@/types/project.tsx";
import {projectApi} from "@/services/api.tsx";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    Database,
    Download,
    FlaskConical,
    Loader2,
    Play,
    Settings,
    Share2,
    Star
} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {colorClassMap} from "@/types/color.tsx";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Progress} from "@/components/ui/progress.tsx";

export function ProjectDetailCard() {
    const {projectId} = useParams();
    const [project, setProject] = useState<Project>()

    useEffect(() => {
        if (projectId) {
            projectApi.getProject(projectId)
                .then(setProject)
                .catch(() => {/* 错误处理可扩展 */
                });
        }
    }, [projectId]);

    if (!project) {
        return (<div>

        </div>)
    }

    return (
        <div>
            {/* 返回和项目标题 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                <div>
                    <Link
                        to="/project"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1"/>
                        返回项目列表
                    </Link>
                    <div className="flex items-start gap-2">
                        <h1 className="text-2xl font-bold">{project.name}</h1>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={project.starred ? "text-amber-400" : "text-muted-foreground"}
                        >
                            <Star className="h-5 w-5"/>
                            <span className="sr-only">收藏</span>
                        </Button>
                    </div>
                    <p className="text-muted-foreground mt-1">{project.description}</p>

                    <div className="flex flex-wrap gap-1 mt-3">
                        {project.tags.map((tag) => (
                            <Badge
                                key={tag.id}
                                className={`${colorClassMap[tag.color]} border-0`}
                            >
                                {tag.name}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button>
                        <Play className="h-4 w-4 mr-2"/>
                        运行工作流
                    </Button>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2"/>
                        导出
                    </Button>
                    <Button variant="outline">
                        <Share2 className="h-4 w-4 mr-2"/>
                        分享
                    </Button>
                    <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2"/>
                        设置
                    </Button>
                </div>
            </div>

            {/* 项目信息卡片 */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <FlaskConical className="h-4 w-4 mr-2"/>
                            工作流状态
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-2xl font-bold">
                                {project.completedWorkflows}/{tempProject.totalWorkflows}
                            </p>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 flex items-center">
                                    <CheckCircle2 className="h-3 w-3 mr-1"/>
                                    {tempProject.completedWorkflows}
                                </Badge>
                                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 flex items-center">
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin"/>
                                    {tempProject.inProgressWorkflows}
                                </Badge>
                                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 flex items-center">
                                    <AlertCircle className="h-3 w-3 mr-1"/>
                                    {tempProject.failedWorkflows}
                                </Badge>
                            </div>
                        </div>
                        <Progress value={(tempProject.completedWorkflows / tempProject.totalWorkflows) * 100} className="h-2"/>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <Clock className="h-4 w-4 mr-2"/>
                            最后更新
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{tempProject.lastUpdated}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <Database className="h-4 w-4 mr-2"/>
                            样本数量
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{tempProject.sampleCount.toLocaleString()}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}