import { format } from 'date-fns'
import { enUS, zhCN } from 'date-fns/locale'
import { ClockIcon, PlayIcon, StarIcon, UserIcon } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { ImagePagination } from '@/components/image/image-pagination'
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

function formatDateTime(dateStr: string | undefined, locale: string) {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'yyyy-MM-dd HH:mm:ss', {
      locale: locale === 'en' ? enUS : zhCN,
    })
  } catch {
    return '-'
  }
}

function ProjectTable({ projects }: { projects: ProjectPublic[] }) {
  const locale = useLocale()
  const t = useTranslations('Project.list.table')
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
              <TableHead className='h-12 px-4'>{t('projectName')}</TableHead>
              <TableHead className='h-12 px-4'>{t('description')}</TableHead>
              <TableHead className='h-12 px-4'>{t('tags')}</TableHead>
              <TableHead className='h-12 text-right'>
                <div className='flex items-center justify-end'>
                  <UserIcon className='size-3 mr-1' />
                  {t('owner')}
                </div>
              </TableHead>
              <TableHead className='h-12 text-right'>
                <div className='flex items-center justify-end'>
                  <ClockIcon className='size-3 mr-1' />
                  {t('lastUpdated')}
                </div>
              </TableHead>
              <TableHead className='h-12 text-right'>
                <div className='flex items-center justify-end'>
                  <ClockIcon className='size-3 mr-1' />
                  {t('created')}
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
                      <span className='sr-only'>{t('favorite')}</span>
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
                  {formatDateTime(project.update_time, locale)}
                </TableCell>
                <TableCell className='text-right'>
                  {formatDateTime(project.create_time, locale)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function PaginatedProjectTable({
  filter,
}: {
  filter: 'all' | 'starred' | 'my'
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const offset = (currentPage - 1) * itemsPerPage
  const { data: projectPage, isLoading } = useProjects(
    offset,
    itemsPerPage,
    filter,
  )
  const projects = projectPage?.data ?? []
  const totalCount = projectPage?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))

  const t = useTranslations('Project.list')

  if (isLoading) return <div>{t('loading')}</div>

  return (
    <div className='space-y-4'>
      <ProjectTable projects={projects} />
      {totalPages > 1 && (
        <ImagePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}

export function AllProjectTable() {
  return <PaginatedProjectTable filter='all' />
}

export function StarredProjectTable() {
  return <PaginatedProjectTable filter='starred' />
}

export function MyProjectTable() {
  return <PaginatedProjectTable filter='my' />
}

export function RecentProjectCard() {
  const locale = useLocale()
  const t = useTranslations('Project.list.recent')
  const { data: recentProjects = [] } = useRecentProjects(1)
  const recentProject = recentProjects[0]

  return !recentProject ? (
    <Card className='border rounded-lg gap-0 py-0'>
      <CardContent className='flex flex-col items-center justify-center py-8 text-center'>
        <h3 className='text-lg font-medium mb-2'>{t('emptyTitle')}</h3>
        <p className='text-muted-foreground'>{t('emptyDescription')}</p>
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
          <ClockIcon className='size-3 mr-1' /> {t('lastUpdated')}{' '}
          {formatDateTime(recentProject.update_time, locale)}
          <span className='mx-2'>•</span>
          <span className='flex items-center'>
            <PlayIcon className='size-3 mr-1' /> {t('dataCount')}
          </span>
        </div>
      </Link>
    </Card>
  )
}
