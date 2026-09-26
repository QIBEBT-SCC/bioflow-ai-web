'use client'

import { InfoIcon, PencilIcon, Trash2Icon } from 'lucide-react'
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
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
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
    <PageShell
      breadcrumbs={[
        { label: t('breadcrumb'), href: '/code' },
        { label: code?.name ?? t('loading') },
      ]}
    >
      <PageContainer size='narrow'>
        {isLoading && (
          <div className='space-y-4'>
            <Skeleton className='h-10 w-72' />
            <Skeleton className='h-32 w-full' />
            <Skeleton className='h-96 w-full' />
          </div>
        )}

        {isError && (
          <Empty className='border border-dashed'>
            <EmptyHeader>
              <EmptyTitle>{t('notFound')}</EmptyTitle>
              <EmptyDescription>{t('notFoundDescription')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {code && (
          <div className='space-y-6'>
            <PageHeader
              className='mb-0'
              title={code.name}
              titleAddon={<CodeTypeBadge nodeType={code.node_type} />}
              description={code.description}
              actions={
                <>
                  <Button variant='outline' asChild>
                    <Link href={`/code/${code.uid}/edit`}>
                      <PencilIcon className='size-4' />
                      {t('edit')}
                    </Link>
                  </Button>
                  <Button
                    variant='outline'
                    className='text-destructive hover:bg-destructive/10 hover:text-destructive'
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2Icon className='size-4' />
                    {t('delete')}
                  </Button>
                </>
              }
            />

            <Alert variant='warning'>
              <InfoIcon />
              <AlertDescription className='text-foreground'>
                {t('snapshotNotice')}
              </AlertDescription>
            </Alert>

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
      </PageContainer>

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
    </PageShell>
  )
}
