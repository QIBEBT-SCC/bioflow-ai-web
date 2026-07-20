'use client'

import { format } from 'date-fns'
import { enUS, zhCN } from 'date-fns/locale'
import {
  ClockIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlayIcon,
  StarIcon,
  Trash2Icon,
  UserIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ImagePagination } from '@/components/image/image-pagination'
import { EditProjectDialog } from '@/components/project/edit-project-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useDeleteProject,
  useProjects,
  useRecentProjects,
  useStarProject,
  useUnstarProject,
} from '@/hooks/use-project'
import { colorClassMap } from '@/types/color'
import type { ProjectPublic } from '@/types/project'

export type ProjectSort = 'recent' | 'nameAsc' | 'nameDesc'
export type ProjectViewMode = 'list' | 'grid'

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

function ProjectTable({
  projects,
  search,
  sort,
  viewMode,
}: {
  projects: ProjectPublic[]
  search: string
  sort: ProjectSort
  viewMode: ProjectViewMode
}) {
  const locale = useLocale()
  const t = useTranslations('Project.list.table')
  const tActions = useTranslations('Project.actions')
  const starProject = useStarProject()
  const unstarProject = useUnstarProject()
  const deleteProject = useDeleteProject()
  const [editingProject, setEditingProject] = useState<ProjectPublic | null>(
    null,
  )
  const [deletingProject, setDeletingProject] = useState<ProjectPublic | null>(
    null,
  )

  const visibleProjects = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const filtered = keyword
      ? projects.filter((project) =>
          [
            project.name,
            project.description,
            ...project.tags.map((tag) => tag.name),
          ]
            .join(' ')
            .toLowerCase()
            .includes(keyword),
        )
      : projects

    return [...filtered].sort((a, b) => {
      if (sort === 'nameAsc') return a.name.localeCompare(b.name)
      if (sort === 'nameDesc') return b.name.localeCompare(a.name)
      return (
        new Date(b.update_time).getTime() - new Date(a.update_time).getTime()
      )
    })
  }, [projects, search, sort])

  const handleStar = (project: ProjectPublic) => {
    if (project.starred) {
      unstarProject.mutate(String(project.id))
    } else {
      starProject.mutate(String(project.id))
    }
  }

  const handleDelete = async () => {
    if (!deletingProject) return
    try {
      await deleteProject.mutateAsync(String(deletingProject.id))
      toast.success(tActions('deleteSuccess'))
      setDeletingProject(null)
    } catch {
      toast.error(tActions('deleteFailed'))
    }
  }

  const isStarPending = starProject.isPending || unstarProject.isPending
  const pendingId = starProject.isPending
    ? starProject.variables
    : unstarProject.variables

  return (
    <>
      <div
        className={
          viewMode === 'grid'
            ? 'grid gap-3 sm:grid-cols-2 2xl:grid-cols-3'
            : 'hidden'
        }
      >
        {visibleProjects.length === 0 ? (
          <Card className='gap-0 py-0'>
            <CardContent className='py-10 text-center text-muted-foreground'>
              {tActions('empty')}
            </CardContent>
          </Card>
        ) : (
          visibleProjects.map((project) => (
            <Card key={project.id} className='gap-0 py-0'>
              <CardContent className='space-y-3 p-4'>
                <div className='flex items-start gap-2'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className={
                      project.starred
                        ? 'text-amber-400'
                        : 'text-muted-foreground'
                    }
                    onClick={() => handleStar(project)}
                    disabled={isStarPending && pendingId === String(project.id)}
                  >
                    <StarIcon
                      className='size-4'
                      fill={project.starred ? 'currentColor' : 'none'}
                    />
                    <span className='sr-only'>{t('favorite')}</span>
                  </Button>
                  <div className='min-w-0 flex-1'>
                    <Link
                      href={`/project/${project.id}`}
                      className='block truncate font-medium hover:underline'
                    >
                      {project.name}
                    </Link>
                    <p className='mt-1 line-clamp-2 text-sm text-muted-foreground'>
                      {project.description || '-'}
                    </p>
                  </div>
                  <ProjectActions
                    project={project}
                    onEdit={setEditingProject}
                    onDelete={setDeletingProject}
                    t={tActions}
                  />
                </div>
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
                <div className='flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                  <span>{project.owner.username}</span>
                  <span>{formatDateTime(project.update_time, locale)}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div
        className={
          viewMode === 'list' ? 'rounded-lg border bg-card shadow-sm' : 'hidden'
        }
      >
        <Table className='min-w-[1000px]'>
          <TableHeader className='bg-muted/50'>
            <TableRow>
              <TableHead className='h-12 px-4'>{t('projectName')}</TableHead>
              <TableHead className='h-12 px-4'>{t('description')}</TableHead>
              <TableHead className='h-12 px-4'>{t('tags')}</TableHead>
              <TableHead className='h-12 text-right'>
                <div className='flex items-center justify-end'>
                  <UserIcon className='mr-1 size-3' />
                  {t('owner')}
                </div>
              </TableHead>
              <TableHead className='h-12 text-right'>
                <div className='flex items-center justify-end'>
                  <ClockIcon className='mr-1 size-3' />
                  {t('lastUpdated')}
                </div>
              </TableHead>
              <TableHead className='h-12 w-12'>
                <span className='sr-only'>{tActions('label')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleProjects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='h-32 text-center text-muted-foreground'
                >
                  {tActions('empty')}
                </TableCell>
              </TableRow>
            ) : (
              visibleProjects.map((project) => (
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
                        disabled={
                          isStarPending && pendingId === String(project.id)
                        }
                      >
                        <StarIcon
                          className='size-4'
                          fill={project.starred ? 'currentColor' : 'none'}
                        />
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
                  <TableCell className='max-w-72'>
                    <div className='line-clamp-1 text-muted-foreground'>
                      {project.description || '-'}
                    </div>
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
                  <TableCell className='whitespace-nowrap text-right text-muted-foreground'>
                    {formatDateTime(project.update_time, locale)}
                  </TableCell>
                  <TableCell>
                    <ProjectActions
                      project={project}
                      onEdit={setEditingProject}
                      onDelete={setDeletingProject}
                      t={tActions}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingProject && (
        <EditProjectDialog
          key={editingProject.id}
          project={editingProject}
          open
          onOpenChange={(open) => !open && setEditingProject(null)}
        />
      )}
      <AlertDialog
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tActions('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tActions('deleteDescription', {
                name: deletingProject?.name ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tActions('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteProject.isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteProject.isPending
                ? tActions('deleting')
                : tActions('confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function ProjectActions({
  project,
  onEdit,
  onDelete,
  t,
}: {
  project: ProjectPublic
  onEdit: (project: ProjectPublic) => void
  onDelete: (project: ProjectPublic) => void
  t: ReturnType<typeof useTranslations>
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' aria-label={t('label')}>
          <MoreHorizontalIcon className='size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onSelect={() => onEdit(project)}>
          <PencilIcon className='mr-2 size-4' />
          {t('edit')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className='text-destructive focus:text-destructive'
          onSelect={() => onDelete(project)}
        >
          <Trash2Icon className='mr-2 size-4' />
          {t('delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PaginatedProjectTable({
  filter,
  search = '',
  sort = 'recent',
  viewMode = 'list',
}: {
  filter: 'all' | 'starred' | 'my'
  search?: string
  sort?: ProjectSort
  viewMode?: ProjectViewMode
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
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

  if (isLoading)
    return (
      <div className='py-10 text-center text-muted-foreground'>
        {t('loading')}
      </div>
    )

  return (
    <div className='space-y-4'>
      <ProjectTable
        projects={projects}
        search={search}
        sort={sort}
        viewMode={viewMode}
      />
      <ImagePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}

export function AllProjectTable(props: {
  search?: string
  sort?: ProjectSort
  viewMode?: ProjectViewMode
}) {
  return <PaginatedProjectTable filter='all' {...props} />
}

export function StarredProjectTable(props: {
  search?: string
  sort?: ProjectSort
  viewMode?: ProjectViewMode
}) {
  return <PaginatedProjectTable filter='starred' {...props} />
}

export function MyProjectTable(props: {
  search?: string
  sort?: ProjectSort
  viewMode?: ProjectViewMode
}) {
  return <PaginatedProjectTable filter='my' {...props} />
}

export function RecentProjectCard() {
  const locale = useLocale()
  const t = useTranslations('Project.list.recent')
  const { data: recentProjects = [] } = useRecentProjects(1)
  const recentProject = recentProjects[0]

  return !recentProject ? (
    <Card className='gap-0 rounded-lg border py-0'>
      <CardContent className='flex flex-col items-center justify-center py-8 text-center'>
        <h3 className='mb-2 text-lg font-medium'>{t('emptyTitle')}</h3>
        <p className='text-muted-foreground'>{t('emptyDescription')}</p>
      </CardContent>
    </Card>
  ) : (
    <Card className='gap-0 rounded-lg border py-0'>
      <Link
        href={`/project/${recentProject.id}`}
        className='block p-4 transition-colors hover:bg-slate-50'
      >
        <div className='mb-2 font-medium'>{recentProject.name}</div>
        <div className='flex items-center text-xs text-muted-foreground'>
          <ClockIcon className='mr-1 size-3' /> {t('lastUpdated')}{' '}
          {formatDateTime(recentProject.update_time, locale)}
          <span className='mx-2'>•</span>
          <span className='flex items-center'>
            <PlayIcon className='mr-1 size-3' /> {t('dataCount')}
          </span>
        </div>
      </Link>
    </Card>
  )
}
