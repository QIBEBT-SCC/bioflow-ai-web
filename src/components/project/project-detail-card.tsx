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
  Star,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useProject } from '@/hooks/use-project'
import { colorClassMap } from '@/types/color'

export function ProjectDetailCard() {
  const params = useParams()
  const projectId = params.id as string
  const { data: project, isLoading } = useProject(projectId)

  if (isLoading) return null
  if (!project) return null

  return (
    <div>
      {/* 返回和项目标题 */}
      <div className='flex flex-col sm:flex-row gap-4 justify-between items-start'>
        <div>
          <Link
            href='/project'
            className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2'
          >
            <ArrowLeft className='h-4 w-4 mr-1' />
            返回项目列表
          </Link>
          <div className='flex items-start gap-2'>
            <h1 className='text-2xl font-bold'>{project.name}</h1>
            <Button
              variant='ghost'
              size='icon'
              className={
                project.starred ? 'text-amber-400' : 'text-muted-foreground'
              }
            >
              <Star className='h-5 w-5' />
              <span className='sr-only'>收藏</span>
            </Button>
          </div>
          <p className='text-muted-foreground mt-1'>{project.description}</p>

          <div className='flex flex-wrap gap-1 mt-3'>
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

        <div className='flex flex-wrap gap-2'>
          <Button>
            <Play className='h-4 w-4 mr-2' />
            运行工作流
          </Button>
          <Button variant='outline'>
            <Download className='h-4 w-4 mr-2' />
            导出
          </Button>
          <Button variant='outline'>
            <Share2 className='h-4 w-4 mr-2' />
            分享
          </Button>
          <Button variant='outline'>
            <Settings className='h-4 w-4 mr-2' />
            设置
          </Button>
        </div>
      </div>

      {/* 项目信息卡片 */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center'>
              <Database className='h-4 w-4 mr-2' />
              样本数量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{20}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center'>
              <FlaskConical className='h-4 w-4 mr-2' />
              工作流状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between mb-1'>
              <p className='text-2xl font-bold'>
                {project.completedWorkflows}/{project.totalWorkflows}
              </p>
              <div className='flex items-center gap-2'>
                <Badge
                  variant='outline'
                  className='bg-green-50 text-green-600 border-green-200 flex items-center'
                >
                  <CheckCircle2 className='h-3 w-3 mr-1' />
                  {project.completedWorkflows}
                </Badge>
                <Badge
                  variant='outline'
                  className='bg-blue-50 text-blue-600 border-blue-200 flex items-center'
                >
                  <Loader2 className='h-3 w-3 mr-1 animate-spin' />
                  {project.inProgressWorkflows}
                </Badge>
                <Badge
                  variant='outline'
                  className='bg-red-50 text-red-600 border-red-200 flex items-center'
                >
                  <AlertCircle className='h-3 w-3 mr-1' />
                  {project.failedWorkflows}
                </Badge>
              </div>
            </div>
            <Progress
              value={
                (project.completedWorkflows / project.totalWorkflows) * 100
              }
              className='h-2'
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center'>
              <Clock className='h-4 w-4 mr-2' />
              最后更新
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{project.update_time}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
