'use client'

import { ArrowLeftIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockTitle,
} from '@/components/ai-elements/code-block'
import { CodeTypeBadge } from '@/components/code/code-type-badge'
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useCode, useDeleteCode } from '@/hooks/use-code'
import { codeLanguage } from '@/lib/code'

export default function CodeDetailPageClient() {
  const params = useParams()
  const uid = params.uid as string
  const t = useTranslations('code.Detail')
  const { push } = useRouter()
  const { data: code, isLoading, isError } = useCode(uid)
  const deleteMutation = useDeleteCode()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const confirmDelete = () => {
    deleteMutation.mutate(uid, {
      onSuccess: () => push('/code'),
    })
  }

  return (
    <SidebarInset className='h-screen overflow-hidden'>
      <header className='flex h-12 shrink-0 items-center gap-2 border-b px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2! h-4!' />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href='/code'>{t('breadcrumb')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{code?.name ?? t('loading')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className='flex-1 overflow-y-auto'>
        <div className='container mx-auto max-w-5xl py-6'>
          {isLoading && (
            <div className='space-y-4'>
              <Skeleton className='h-10 w-72' />
              <Skeleton className='h-32 w-full' />
              <Skeleton className='h-96 w-full' />
            </div>
          )}

          {isError && (
            <Empty className='border'>
              <EmptyHeader>
                <EmptyTitle>{t('notFound')}</EmptyTitle>
                <EmptyDescription>{t('notFoundDescription')}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {code && (
            <div className='space-y-6'>
              <div>
                <Link
                  href='/code'
                  className='mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
                >
                  <ArrowLeftIcon className='size-4' />
                  {t('back')}
                </Link>
                <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-start'>
                  <div>
                    <div className='flex items-center gap-3'>
                      <h1 className='text-2xl font-semibold'>{code.name}</h1>
                      <CodeTypeBadge nodeType={code.node_type} />
                    </div>
                    <p className='mt-2 max-w-3xl text-muted-foreground'>
                      {code.description}
                    </p>
                  </div>
                  <div className='flex gap-2'>
                    <Button variant='outline' asChild>
                      <Link href={`/code/${code.uid}/edit`}>
                        <PencilIcon className='size-4' />
                        {t('edit')}
                      </Link>
                    </Button>
                    <Button
                      variant='destructive'
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2Icon className='size-4' />
                      {t('delete')}
                    </Button>
                  </div>
                </div>
              </div>

              <div className='rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200'>
                {t('snapshotNotice')}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{t('source')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={code.code}
                    language={codeLanguage(code.node_type)}
                    showLineNumbers
                  >
                    <CodeBlockHeader>
                      <CodeBlockTitle>
                        <CodeBlockFilename>
                          {code.node_type === 'code_python'
                            ? 'script.py'
                            : code.node_type === 'code_R'
                              ? 'script.R'
                              : 'script.sh'}
                        </CodeBlockFilename>
                      </CodeBlockTitle>
                      <CodeBlockActions>
                        <CodeBlockCopyButton />
                      </CodeBlockActions>
                    </CodeBlockHeader>
                  </CodeBlock>
                </CardContent>
              </Card>

              {code.node_type !== 'code_bash' && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {code.node_type === 'code_python'
                        ? t('dependencies')
                        : t('rDependencies')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {code.dependencies.length ? (
                      <div className='flex flex-wrap gap-2'>
                        {code.dependencies.map((dependency) => (
                          <Badge
                            key={dependency}
                            variant='secondary'
                            className='font-mono'
                          >
                            {dependency}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className='text-sm text-muted-foreground'>
                        {code.node_type === 'code_python'
                          ? t('noDependencies')
                          : t('noRDependencies')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDescription', { name: code?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('deleting') : t('confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarInset>
  )
}
