'use client'

import {
  BookOpen,
  Container,
  ExternalLink,
  FileInput,
  FileOutput,
  Network,
  Pencil,
  SlidersHorizontal,
  TerminalIcon,
  WrenchIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { type ReactNode, useState } from 'react'
import {
  Snippet,
  SnippetAddon,
  SnippetInput,
  SnippetText,
} from '@/components/ai-elements/snippet'
import {
  Terminal,
  TerminalContent,
  TerminalHeader,
  TerminalTitle,
} from '@/components/ai-elements/terminal'
import {
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import { SectionCard } from '@/components/layout/section-card'
import { ToolTagBadge } from '@/components/tool/tool-tag-badge'
import { ToolUsageSheet } from '@/components/tool/tool-usage-sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTool, useToolUsage } from '@/hooks/use-tool'
import type { FileMount, ToolInfo } from '@/types/tool'

type DetailT = ReturnType<typeof useTranslations<'tool.Detail'>>

function ToolCommandCard({ command, t }: { command: string; t: DetailT }) {
  return (
    <SectionCard
      icon={<TerminalIcon />}
      title={t('commandTitle')}
      description={t('commandDescription')}
    >
      <Snippet className='bg-muted py-5 font-mono text-sm' code={command}>
        <SnippetAddon className='pl-1'>
          <SnippetText>$</SnippetText>
        </SnippetAddon>
        <SnippetInput />
        <SnippetAddon align='inline-end' className='pr-2'>
          <CopyButton code={command} />
        </SnippetAddon>
      </Snippet>
    </SectionCard>
  )
}

function MutedBox({ children }: { children: ReactNode }) {
  return (
    <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
      {children}
    </div>
  )
}

function StaticParam({ label, value }: { label: string; value: string }) {
  return (
    <div className='space-y-1.5'>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='rounded-lg border bg-muted/40 p-3'>
        <code className='font-mono text-sm break-all'>{value}</code>
      </div>
    </div>
  )
}

function ToolParametersCard({ tool, t }: { tool: ToolInfo; t: DetailT }) {
  return (
    <SectionCard
      icon={<SlidersHorizontal />}
      title={t('paramsTitle')}
      description={t('paramsDescription')}
    >
      <div className='space-y-6'>
        <div className='space-y-3'>
          <h4 className='text-sm font-medium'>{t('dynamicParams')}</h4>
          {tool.dynamic_params.length === 0 ? (
            <MutedBox>{t('noDynamicParams')}</MutedBox>
          ) : (
            <div className='divide-y rounded-lg border'>
              {tool.dynamic_params.map((param) => (
                <div key={param.command} className='space-y-1.5 p-3'>
                  <code className='rounded bg-muted px-1.5 py-0.5 font-mono text-sm'>
                    {param.command}
                  </code>
                  {param.description && (
                    <p className='text-sm text-muted-foreground'>
                      {param.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <Separator />
        <div className='space-y-3'>
          <h4 className='text-sm font-medium'>{t('staticParams')}</h4>
          {tool.immutable_static_params && (
            <StaticParam
              label={t('immutableStatic')}
              value={tool.immutable_static_params}
            />
          )}
          {tool.modifiable_static_params && (
            <StaticParam
              label={t('modifiableStatic')}
              value={tool.modifiable_static_params}
            />
          )}
          {!tool.immutable_static_params && !tool.modifiable_static_params && (
            <MutedBox>{t('noStaticParams')}</MutedBox>
          )}
        </div>
      </div>
    </SectionCard>
  )
}

function FileMountItem({ file, t }: { file: FileMount; t: DetailT }) {
  return (
    <div className='space-y-2 p-4'>
      <div className='flex items-center justify-between gap-2'>
        <h4 className='text-sm font-medium'>{file.name}</h4>
        <div className='flex gap-1.5'>
          {file.is_log && <Badge variant='secondary'>LOG</Badge>}
          {file.is_report && <Badge variant='secondary'>REPORT</Badge>}
        </div>
      </div>
      {file.description && (
        <p className='text-sm text-muted-foreground'>{file.description}</p>
      )}
      <dl className='grid gap-2 pt-1 text-xs sm:grid-cols-2'>
        <div className='flex min-w-0 items-center gap-2'>
          <dt className='shrink-0 text-muted-foreground'>{t('filePath')}</dt>
          <dd className='min-w-0 truncate rounded bg-muted px-1.5 py-0.5 font-mono'>
            {file.file_path}
          </dd>
        </div>
        <div className='flex min-w-0 items-center gap-2'>
          <dt className='shrink-0 text-muted-foreground'>{t('mountPath')}</dt>
          <dd className='min-w-0 truncate rounded bg-muted px-1.5 py-0.5 font-mono'>
            {file.mount_path}
          </dd>
        </div>
      </dl>
    </div>
  )
}

function FileMountList({ files, t }: { files: FileMount[]; t: DetailT }) {
  if (files.length === 0) return <MutedBox>{t('noFiles')}</MutedBox>
  return (
    <div className='divide-y rounded-lg border'>
      {files.map((file) => (
        <FileMountItem key={file.name} file={file} t={t} />
      ))}
    </div>
  )
}

function FileMountsCard({
  inputFiles,
  outputFiles,
  t,
}: {
  inputFiles: FileMount[]
  outputFiles: FileMount[]
  t: DetailT
}) {
  return (
    <SectionCard
      icon={<FileInput />}
      title={t('fileMountsTitle')}
      description={t('fileMountsDescription')}
    >
      <Tabs defaultValue='input'>
        <TabsList>
          <TabsTrigger value='input'>
            <FileInput className='size-4' />
            {t('inputFiles', { count: inputFiles.length })}
          </TabsTrigger>
          <TabsTrigger value='output'>
            <FileOutput className='size-4' />
            {t('outputFiles', { count: outputFiles.length })}
          </TabsTrigger>
        </TabsList>
        <TabsContent value='input' className='mt-3'>
          <FileMountList files={inputFiles} t={t} />
        </TabsContent>
        <TabsContent value='output' className='mt-3'>
          <FileMountList files={outputFiles} t={t} />
        </TabsContent>
      </Tabs>
    </SectionCard>
  )
}

function ToolDocumentationCard({ tool, t }: { tool: ToolInfo; t: DetailT }) {
  return (
    <SectionCard icon={<BookOpen />} title={t('docsTitle')}>
      <div className='space-y-4'>
        <div className='space-y-2'>
          <h4 className='text-sm font-medium'>{t('helpCommand')}</h4>
          <Snippet
            className='bg-muted py-2 font-mono text-sm'
            code={tool.help_doc.help_command}
          >
            <SnippetAddon className='pl-1'>
              <SnippetText>$</SnippetText>
            </SnippetAddon>
            <SnippetInput />
            <SnippetAddon align='inline-end' className='pr-2'>
              <CopyButton code={tool.help_doc.help_command} />
            </SnippetAddon>
          </Snippet>
        </div>
        <div className='space-y-2'>
          <h4 className='text-sm font-medium'>{t('commandOutput')}</h4>
          <Terminal output={tool.help_doc.content} autoScroll={false}>
            <TerminalHeader>
              <TerminalTitle>{tool.help_doc.help_command}</TerminalTitle>
            </TerminalHeader>
            <TerminalContent />
          </Terminal>
        </div>
      </div>
    </SectionCard>
  )
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='flex justify-between gap-4 text-sm'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='text-right font-medium'>{children}</dd>
    </div>
  )
}

function ToolInfoSidebar({
  tool,
  dockerImage,
  t,
}: {
  tool: ToolInfo
  dockerImage: string
  t: DetailT
}) {
  return (
    <aside className='space-y-6 lg:sticky lg:top-0 lg:self-start'>
      <SectionCard icon={<Container />} title={t('infoTitle')}>
        <div className='space-y-4'>
          {tool.image.description && (
            <div className='space-y-1.5'>
              <h4 className='text-sm font-medium'>{t('about')}</h4>
              <p className='text-sm leading-relaxed text-muted-foreground'>
                {tool.image.description}
              </p>
            </div>
          )}
          <dl className='space-y-2'>
            <InfoRow label={t('version')}>
              <span className='font-mono'>{tool.image.version}</span>
            </InfoRow>
            <InfoRow label={t('toolType')}>{tool.tool_type}</InfoRow>
          </dl>
          {tool.tags && tool.tags.length > 0 && (
            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>{t('tags')}</h4>
              <div className='flex flex-wrap gap-1.5'>
                {tool.tags.map((tag) => (
                  <ToolTagBadge key={tag.id} name={tag.name} />
                ))}
              </div>
            </div>
          )}
          <div className='space-y-2'>
            <h4 className='text-sm font-medium'>{t('dockerImage')}</h4>
            <Snippet className='bg-muted py-2 text-xs!' code={dockerImage}>
              <SnippetInput />
              <SnippetAddon align='inline-end' className='pr-2'>
                <CopyButton code={dockerImage} />
              </SnippetAddon>
            </Snippet>
          </div>
          {(tool.image.homepage || tool.image.paper_link) && (
            <div className='grid gap-2 border-t pt-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2'>
              {tool.image.homepage && (
                <Button variant='outline' size='sm' asChild>
                  <a
                    href={tool.image.homepage}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <ExternalLink className='size-4' />
                    {t('homepage')}
                  </a>
                </Button>
              )}
              {tool.image.paper_link && (
                <Button variant='outline' size='sm' asChild>
                  <a
                    href={tool.image.paper_link}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <ExternalLink className='size-4' />
                    {t('publication')}
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </SectionCard>
    </aside>
  )
}

export default function ToolDetailPage() {
  const t = useTranslations('tool.Detail')
  const params = useParams()
  const toolUid = params.uid as string
  const { data: tool, isLoading } = useTool(toolUid)
  const [usageOpen, setUsageOpen] = useState(false)
  const { data: usage } = useToolUsage(toolUid, 0, 0, 10)

  const inputFiles =
    tool?.file_mounts.filter((f) => f.file_type === 'INPUT') || []
  const outputFiles =
    tool?.file_mounts.filter((f) => f.file_type === 'OUTPUT') || []
  const dockerImage = `${tool?.image.image.registry || ''}/${tool?.image.image.namespace || ''}/${tool?.image.image.repository || ''}:${tool?.image.image.tag || ''}`

  return (
    <PageShell
      breadcrumbs={[
        { label: t('breadcrumb'), href: '/tool' },
        { label: tool?.name ?? t('loading') },
      ]}
    >
      <PageContainer>
        {isLoading && (
          <div className='space-y-6'>
            <Skeleton className='h-10 w-72' />
            <div className='grid gap-6 lg:grid-cols-3'>
              <Skeleton className='h-96 rounded-xl lg:col-span-2' />
              <Skeleton className='h-96 rounded-xl' />
            </div>
          </div>
        )}

        {!isLoading && !tool && (
          <Empty className='border border-dashed'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <WrenchIcon />
              </EmptyMedia>
              <EmptyTitle>{t('notFoundTitle')}</EmptyTitle>
              <EmptyDescription>{t('notFoundDescription')}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant='outline' asChild>
                <Link href='/tool'>{t('backToList')}</Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {tool && (
          <>
            <PageHeader
              title={tool.name}
              titleAddon={
                <Badge variant='secondary' className='font-mono'>
                  {tool.image.version}
                </Badge>
              }
              description={tool.description}
              actions={
                <>
                  <Button variant='outline' onClick={() => setUsageOpen(true)}>
                    <Network className='size-4' />
                    {t('usage')}
                    {usage && (
                      <Badge variant='secondary' className='tabular-nums'>
                        {usage.workflow_total + usage.run_total}
                      </Badge>
                    )}
                  </Button>
                  <Button asChild>
                    <Link href={`/tool/${tool.uid}/edit`}>
                      <Pencil className='size-4' />
                      {t('edit')}
                    </Link>
                  </Button>
                </>
              }
            />

            <div className='grid gap-6 lg:grid-cols-3'>
              <div className='min-w-0 space-y-6 lg:col-span-2'>
                <ToolCommandCard command={tool.complete_command} t={t} />
                <ToolParametersCard tool={tool} t={t} />
                <FileMountsCard
                  inputFiles={inputFiles}
                  outputFiles={outputFiles}
                  t={t}
                />
                <ToolDocumentationCard tool={tool} t={t} />
              </div>
              <ToolInfoSidebar tool={tool} dockerImage={dockerImage} t={t} />
            </div>

            <ToolUsageSheet
              tool={{ uid: tool.uid, name: tool.name }}
              open={usageOpen}
              onOpenChange={setUsageOpen}
            />
          </>
        )}
      </PageContainer>
    </PageShell>
  )
}
