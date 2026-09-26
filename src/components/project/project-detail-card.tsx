import { Clock, Database, FlaskConical, PencilIcon, Star } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/page-shell'
import { StatTile } from '@/components/layout/stat-tile'
import { EditProjectDialog } from '@/components/project/edit-project-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  type RunStatus,
  RunStatusBadge,
} from '@/components/workflow/run-status'
import {
  useProject,
  useStarProject,
  useUnstarProject,
} from '@/hooks/use-project'
import { useProjectRunStats } from '@/hooks/use-project-workflow'
import { useSampleCount } from '@/hooks/use-sample'
import { cn } from '@/lib/utils'
import { colorClassMap } from '@/types/color'

export function ProjectDetailCard() {
  const locale = useLocale()
  const t = useTranslations('Project.detail.card')
  const tActions = useTranslations('Project.actions')
  const params = useParams()
  const projectId = params.id as string
  const [isEditing, setIsEditing] = useState(false)
  const { data: project, isLoading } = useProject(projectId)
  const starProject = useStarProject()
  const unstarProject = useUnstarProject()
  const { data: sampleCount } = useSampleCount(projectId)
  const { data: runStats } = useProjectRunStats(projectId)

  if (isLoading) return null
  if (!project) return null

  const totalRuns = runStats?.total ?? 0
  const successRuns = runStats?.succeeded ?? 0
  const runningRuns = runStats?.running ?? 0
  const waitingRuns = runStats?.pending ?? 0
  const errorRuns = runStats?.failed ?? 0
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
    <>
      <PageHeader
        className='mb-4'
        title={project.name}
        titleAddon={
          project.tags.length > 0 && (
            <div className='flex flex-wrap gap-1'>
              {project.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  className={`${colorClassMap[tag.color]} border-0`}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )
        }
        description={project.description}
        actions={
          <>
            <Button
              variant='outline'
              size='icon'
              className={cn(project.starred && 'text-warning')}
              onClick={handleStar}
              disabled={isStarPending}
              aria-pressed={project.starred}
            >
              <Star
                className='size-4'
                fill={project.starred ? 'currentColor' : 'none'}
              />
              <span className='sr-only'>{t('favorite')}</span>
            </Button>
            <Button variant='outline' onClick={() => setIsEditing(true)}>
              <PencilIcon className='size-4' />
              {tActions('edit')}
            </Button>
          </>
        }
      />

      <div className='grid gap-3 md:grid-cols-3'>
        <StatTile icon={<Database />} label={t('sampleCount')}>
          <p className='text-2xl font-semibold tabular-nums'>
            {sampleCount ?? 0}
          </p>
        </StatTile>
        <StatTile icon={<FlaskConical />} label={t('workflowStatus')}>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <p className='text-2xl font-semibold tabular-nums'>
              {`${successRuns}/${totalRuns}`}
            </p>
            <div className='flex flex-wrap items-center gap-1.5'>
              <RunCount status='succeeded' value={successRuns} />
              <RunCount status='running' value={runningRuns} />
              <RunCount status='pending' value={waitingRuns} />
              <RunCount status='failed' value={errorRuns} />
            </div>
          </div>
          <Progress value={successRate} className='mt-2 h-1.5' />
        </StatTile>
        <StatTile icon={<Clock />} label={t('lastUpdated')}>
          <p
            className='text-lg font-semibold tabular-nums'
            suppressHydrationWarning
          >
            {new Date(project.update_time).toLocaleString(locale)}
          </p>
        </StatTile>
      </div>

      {isEditing && (
        <EditProjectDialog
          project={project}
          open={isEditing}
          onOpenChange={setIsEditing}
        />
      )}
    </>
  )
}

function RunCount({ status, value }: { status: RunStatus; value: number }) {
  return (
    <RunStatusBadge
      status={status}
      label={<span className='tabular-nums'>{value}</span>}
    />
  )
}
