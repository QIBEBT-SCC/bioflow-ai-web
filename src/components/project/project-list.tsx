import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ClockIcon, PlayIcon, StarIcon, UserIcon } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useProjects,
  useRecentProjects,
  useStarProject,
  useUnstarProject,
} from '@/hooks/use-project'
import { colorClassMap } from '@/types/color'
import type { ProjectPublic } from '@/types/project'

function formatDateTime(dateStr?: string) {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
  } catch {
    return '-'
  }
}

function ProjectTable({ projects }: { projects: ProjectPublic[] }) {
  const starProject = useStarProject()
  const unstarProject = useUnstarProject()

  const handleStar = (project: ProjectPublic) => {
    if (project.starred) {
      unstarProject.mutate(String(project.id))
    } else {
      starProject.mutate(String(project.id))
    }
  }

  const isPending = starProject.isPending || unstarProject.isPending
  const pendingId = starProject.isPending
    ? starProject.variables
    : unstarProject.variables

  return (
    <div className='rounded-md border'>
      <div className='relative w-full overflow-auto'>
        <Table>
          <TableHeader className='bg-muted/50'>
            <TableRow>
              <TableHead className='h-12 px-4'>项目名称</TableHead>
              <TableHead className='h-12 px-4'>描述</TableHead>
              <TableHead className='h-12 px-4'>标签</TableHead>
              <TableHead className='h-12 text-right'>
                <div className='flex items-center justify-end'>
                  <UserIcon className='size-3 mr-1' />
                  创建人
                </div>
              </TableHead>
              <TableHead className='h-12 text-right'>
                <div className='flex items-center justify-end'>
                  <ClockIcon className='size-3 mr-1' />
                  上次更新
                </div>
              </TableHead>
              <TableHead className='h-12 text-right'>
                <div className='flex items-center justify-end'>
                  <ClockIcon className='size-3 mr-1' />
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
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className={
                        project.starred
                          ? 'text-amber-400'
                          : 'text-muted-foreground'
                      }
                      onClick={() => handleStar(project)}
                      disabled={isPending && pendingId === String(project.id)}
                    >
                      <StarIcon className='size-4' />
                      <span className='sr-only'>收藏</span>
                    </Button>
                    <Link
                      href={`/project/${project.id}`}
                      className='font-medium hover:underline'
                    >
                      {project.name}
                    </Link>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='line-clamp-1'>{project.description}</div>
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell className='text-right'>
                  {project.owner.username}
                </TableCell>
                <TableCell className='text-right'>
                  {formatDateTime(project.update_time)}
                </TableCell>
                <TableCell className='text-right'>
                  {formatDateTime(project.create_time)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function AllProjectTable() {
  const { data: projects = [], isLoading } = useProjects()

  if (isLoading) return <div>加载中...</div>

  return <ProjectTable projects={projects} />
}

export function StarredProjectTable() {
  const { data: projects = [], isLoading } = useProjects(1, 20, 'starred')

  if (isLoading) return <div>加载中...</div>

  return <ProjectTable projects={projects} />
}

export function MyProjectTable() {
  const { data: projects = [], isLoading } = useProjects(1, 20, 'mine')

  if (isLoading) return <div>加载中...</div>

  return <ProjectTable projects={projects} />
}

export function RecentProjectCard() {
  const { data: recentProjects = [] } = useRecentProjects(1)
  const recentProject = recentProjects[0]

  return !recentProject ? (
    <Card className='border rounded-lg gap-0 py-0'>
      <CardContent className='flex flex-col items-center justify-center py-8 text-center'>
        <h3 className='text-lg font-medium mb-2'>没有最近运行的项目</h3>
        <p className='text-muted-foreground'>
          您最近运行过的项目将显示在这里。
        </p>
      </CardContent>
    </Card>
  ) : (
    <Card className='border rounded-lg gap-0 py-0'>
      <Link
        href={`/project/${recentProject.id}`}
        className='block p-4 hover:bg-slate-50 transition-colors'
      >
        <div className='font-medium mb-2'>{recentProject.name}</div>
        <div className='flex items-center text-xs text-muted-foreground'>
          <ClockIcon className='size-3 mr-1' /> 最后更新:{' '}
          {formatDateTime(recentProject.update_time)}
          <span className='mx-2'>•</span>
          <span className='flex items-center'>
            <PlayIcon className='size-3 mr-1' /> -- 条数据
          </span>
        </div>
      </Link>
    </Card>
  )
}
