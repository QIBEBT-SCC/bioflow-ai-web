import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  FlaskConical,
  Loader2,
  Star,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { ProjectListBackLink } from '@/components/project/project-list-navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  useProject,
  useStarProject,
  useUnstarProject,
} from '@/hooks/use-project'
import { useProjectRunStats } from '@/hooks/use-project-workflow'
import { useSampleCount } from '@/hooks/use-sample'
import { colorClassMap } from '@/types/color'

export function ProjectDetailCard({
  projectListHref,
}: {
  projectListHref: string
}) {
  const locale = useLocale()
  const t = useTranslations('Project.detail.card')
  const params = useParams()
  const projectId = params.id as string
  const { data: project, isLoading } = useProject(projectId)
  const starProject = useStarProject()
  const unstarProject = useUnstarProject()
  const { data: sampleCount } = useSampleCount(projectId)
  const { data: runStats } = useProjectRunStats(projectId)

  if (isLoading) return null
  if (!project) return null

  const totalRuns = runStats?.total ?? 0
  const successRuns = runStats?.success ?? 0
  const runningRuns = runStats?.running ?? 0
  const waitingRuns = runStats?.waiting ?? 0
  const errorRuns = runStats?.error ?? 0
  const successRate = totalRuns > 0 ? (successRuns / totalRuns) * 100 : 0
  const isStarPending = starProject.isPending || unstarProject.isPending

  const handleStar = () => {
    if (project.starred) {
      unstarProject.mutate(projectId)
    } else {
      starProject.mutate(projectId)
    }
  }

  return (
    <div>
      {/* 返回和项目标题 */}
      <ProjectListBackLink href={projectListHref} />
      <div className='flex flex-col sm:flex-row gap-4 justify-between items-start mb-3'>
        <div>
          <div className='flex items-start gap-2'>
            <h1 className='text-2xl font-semibold'>{project.name}</h1>
            <div className='flex flex-wrap gap-1 mt-1.5'>
              {project.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  className={`${colorClassMap[tag.color]} border-0`}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
            <Button
              variant='ghost'
              size='icon'
              className={
                project.starred ? 'text-amber-400' : 'text-muted-foreground'
              }
              onClick={handleStar}
              disabled={isStarPending}
              aria-pressed={project.starred}
            >
              <Star
                className='size-5'
                fill={project.starred ? 'currentColor' : 'none'}
              />
              <span className='sr-only'>{t('favorite')}</span>
            </Button>
          </div>
          <p className='text-muted-foreground mt-1'>{project.description}</p>
        </div>
      </div>

      {/* 项目信息卡片 */}
      <div className='grid gap-3 md:grid-cols-3'>
        <Card className='gap-2 py-4'>
          <CardHeader className='px-5 pb-0'>
            <CardTitle className='text-sm font-medium flex items-center'>
              <Database className='size-4 mr-2' />
              {t('sampleCount')}
            </CardTitle>
          </CardHeader>
          <CardContent className='px-5'>
            <p className='text-xl font-bold'>{sampleCount}</p>
          </CardContent>
        </Card>
        <Card className='gap-2 py-4'>
          <CardHeader className='px-5 pb-0'>
            <CardTitle className='text-sm font-medium flex items-center'>
              <FlaskConical className='size-4 mr-2' />
              {t('workflowStatus')}
            </CardTitle>
          </CardHeader>
          <CardContent className='px-5'>
            <div className='mb-1 flex items-center justify-between'>
              <p className='text-xl font-bold'>{`${successRuns}/${totalRuns}`}</p>
              <div className='flex items-center justify-end gap-2 flex-wrap'>
                <Badge
                  variant='outline'
                  className='bg-green-50 text-green-600 border-green-200 flex items-center'
                >
                  <CheckCircle2 className='size-3 mr-1' />
                  {successRuns}
                </Badge>
                <Badge
                  variant='outline'
                  className='bg-blue-50 text-blue-600 border-blue-200 flex items-center'
                >
                  <Loader2 className='size-3 mr-1 animate-spin' />
                  {runningRuns}
                </Badge>
                <Badge
                  variant='outline'
                  className='bg-amber-50 text-amber-600 border-amber-200 flex items-center'
                >
                  <Clock className='size-3 mr-1' />
                  {waitingRuns}
                </Badge>
                <Badge
                  variant='outline'
                  className='bg-red-50 text-red-600 border-red-200 flex items-center'
                >
                  <AlertCircle className='size-3 mr-1' />
                  {errorRuns}
                </Badge>
              </div>
            </div>
            <Progress value={successRate} className='h-1.5' />
          </CardContent>
        </Card>

        <Card className='gap-2 py-4'>
          <CardHeader className='px-5 pb-0'>
            <CardTitle className='text-sm font-medium flex items-center'>
              <Clock className='size-4 mr-2' />
              {t('lastUpdated')}
            </CardTitle>
          </CardHeader>
          <CardContent className='px-5'>
            <p className='text-xl font-bold' suppressHydrationWarning>
              {new Date(project.update_time).toLocaleString(locale)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
