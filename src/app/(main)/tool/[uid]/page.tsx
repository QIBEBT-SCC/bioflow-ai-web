'use client'

import {
  BookOpen,
  Container,
  ExternalLink,
  FileInput,
  FileOutput,
  Pencil,
  TerminalIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Snippet,
  SnippetAddon,
  SnippetInput,
  SnippetText,
} from '@/components/ai-elements/snippet'
import { CopyButton } from '@/components/ui/copy-button'
import {
  Terminal,
  TerminalContent,
  TerminalHeader,
  TerminalTitle,
} from '@/components/ai-elements/terminal'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTool } from '@/hooks/use-tool'

export default function ToolDetailPage() {
  const params = useParams()
  const toolUid = params.uid as string
  const { data: tool, isLoading } = useTool(toolUid)

  const inputFiles =
    tool?.file_mounts.filter((f) => f.file_type === 'INPUT') || []
  const outputFiles =
    tool?.file_mounts.filter((f) => f.file_type === 'OUTPUT') || []
  const dockerImage = `${tool?.image.image.registry || ''}/${tool?.image.image.namespace || ''}/${tool?.image.image.repository || ''}:${tool?.image.image.tag || ''}`

  if (isLoading) {
    return (
      <SidebarInset className='h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2'></div>
          <p className='text-muted-foreground'>加载中...</p>
        </div>
      </SidebarInset>
    )
  }

  if (!tool) {
    return (
      <SidebarInset className='h-screen flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-muted-foreground'>工具未找到</p>
          <Link href='/tool'>
            <Button variant='outline' className='mt-4'>
              返回工具列表
            </Button>
          </Link>
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset className='h-screen flex flex-col'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center gap-2 px-4 h-12 bg-background'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='!mr-2 !h-4' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbLink asChild>
                  <Link href='/tool'>工具</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className='hidden md:block' />
              <BreadcrumbItem>
                <BreadcrumbPage>{tool.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className='flex-1 overflow-y-auto'>
        <div className='container mx-auto px-6 py-8'>
          {/* 工具标题和基本信息 */}
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4'>
            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-3xl font-bold'>{tool.name}</h1>
                <Badge className='ml-2'>{tool.image.version}</Badge>
              </div>
              <p className='text-muted-foreground mt-1'>{tool.description}</p>
            </div>
            <Link href={`/tool/${tool.uid}/edit`}>
              <Button variant='outline' className='gap-2'>
                <Pencil className='h-4 w-4' />
                编辑工具
              </Button>
            </Link>
          </div>

          <div className='grid gap-6 lg:grid-cols-3'>
            {/* Left Column - Main Content */}
            <div className='lg:col-span-2 space-y-6'>
              {/* Command Section */}
              <Card>
                <CardHeader>
                  <div className='flex items-center gap-2'>
                    <TerminalIcon className='h-5 w-5 text-primary' />
                    <CardTitle>Command Template</CardTitle>
                  </div>
                  <CardDescription>
                    Complete command with all parameters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='relative'>
                    <Snippet
                      className='py-5 bg-muted text-sm font-mono'
                      code={tool.complete_command}
                    >
                      <SnippetAddon className='pl-1'>
                        <SnippetText>$</SnippetText>
                      </SnippetAddon>
                      <SnippetInput />
                      <SnippetAddon align='inline-end' className='pr-2'>
                        <CopyButton code={tool.complete_command} />
                      </SnippetAddon>
                    </Snippet>
                  </div>
                </CardContent>
              </Card>

              {/* Parameters Tabs */}
              <Card>
                <CardHeader>
                  <CardTitle>Parameters</CardTitle>
                  <CardDescription>
                    Configure tool execution parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='space-y-3'>
                    <h4 className='text-sm font-semibold'>
                      Dynamic Parameters
                    </h4>
                    <div className='space-y-3'>
                      {tool.dynamic_params.map((param, index) => (
                        <div
                          key={`param-${index}-${param.command}`}
                          className='border border-border rounded-lg p-4 space-y-2'
                        >
                          <code className='text-sm font-mono bg-muted px-2 py-1 rounded'>
                            {param.command}
                          </code>
                          <p className='text-sm text-muted-foreground'>
                            {param.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className='space-y-3'>
                    <h4 className='text-sm font-semibold'>Static Parameters</h4>
                    {tool.immutable_static_params && (
                      <div className='space-y-2'>
                        <div className='text-xs text-muted-foreground'>
                          不可变静态参数:
                        </div>
                        <div className='border border-border rounded-lg p-4'>
                          <code className='text-sm font-mono'>
                            {tool.immutable_static_params}
                          </code>
                        </div>
                      </div>
                    )}
                    {tool.modifiable_static_params && (
                      <div className='space-y-2'>
                        <div className='text-xs text-muted-foreground'>
                          可修改静态参数:
                        </div>
                        <div className='border border-border rounded-lg p-4'>
                          <code className='text-sm font-mono'>
                            {tool.modifiable_static_params}
                          </code>
                        </div>
                      </div>
                    )}
                    {!tool.immutable_static_params &&
                      !tool.modifiable_static_params && (
                        <div className='border border-border rounded-lg p-4 text-sm text-muted-foreground'>
                          暂无静态参数
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>

              {/* File Mounts */}
              <Card>
                <CardHeader>
                  <CardTitle>File Mounts</CardTitle>
                  <CardDescription>
                    Input and output file specifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue='input' className='w-full'>
                    <TabsList className='grid w-full grid-cols-2'>
                      <TabsTrigger value='input' className='gap-2'>
                        <FileInput className='h-4 w-4' />
                        Input Files ({inputFiles.length})
                      </TabsTrigger>
                      <TabsTrigger value='output' className='gap-2'>
                        <FileOutput className='h-4 w-4' />
                        Output Files ({outputFiles.length})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value='input' className='space-y-3 mt-4'>
                      {inputFiles.map((file, index) => (
                        <div
                          key={`file-${index}-${file.name}`}
                          className='border border-border rounded-lg p-4 space-y-2'
                        >
                          <h4 className='font-semibold text-sm'>{file.name}</h4>
                          <p className='text-sm text-muted-foreground'>
                            {file.description}
                          </p>
                          <Separator className='my-2' />
                          <div className='grid grid-cols-2 gap-2 text-xs'>
                            <div>
                              <span className='text-muted-foreground'>
                                File Path:
                              </span>
                              <code className='ml-2 bg-muted px-1 py-0.5 rounded'>
                                {file.file_path}
                              </code>
                            </div>
                            <div>
                              <span className='text-muted-foreground'>
                                Mount Path:
                              </span>
                              <code className='ml-2 bg-muted px-1 py-0.5 rounded'>
                                {file.mount_path}
                              </code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value='output' className='space-y-3 mt-4'>
                      {outputFiles.map((file, index) => (
                        <div
                          key={`file-${index}-${file.name}`}
                          className='border border-border rounded-lg p-4 space-y-2'
                        >
                          <div className='flex items-center justify-between'>
                            <h4 className='font-semibold text-sm'>
                              {file.name}
                            </h4>
                            <div className='flex gap-2'>
                              {file.is_log && (
                                <Badge variant='secondary' className='text-xs'>
                                  LOG
                                </Badge>
                              )}
                              {file.is_report && (
                                <Badge variant='secondary' className='text-xs'>
                                  REPORT
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className='text-sm text-muted-foreground'>
                            {file.description}
                          </p>
                          <Separator className='my-2' />
                          <div className='grid grid-cols-2 gap-2 text-xs'>
                            <div>
                              <span className='text-muted-foreground'>
                                File Path:
                              </span>
                              <code className='ml-2 bg-muted px-1 py-0.5 rounded'>
                                {file.file_path}
                              </code>
                            </div>
                            <div>
                              <span className='text-muted-foreground'>
                                Mount Path:
                              </span>
                              <code className='ml-2 bg-muted px-1 py-0.5 rounded'>
                                {file.mount_path}
                              </code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Help Documentation */}
              <Card>
                <CardHeader>
                  <div className='flex items-center gap-2'>
                    <BookOpen className='h-5 w-5 text-primary' />
                    <CardTitle>Documentation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div>
                      <h4 className='text-sm font-semibold mb-2'>
                        Help Command
                      </h4>
                      <Snippet
                        className='py-2 bg-muted text-sm font-mono'
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
                    <Separator />
                    <div>
                      <h4 className='text-sm font-semibold mb-2'>
                        Command Output
                      </h4>
                      <Terminal
                        output={tool.help_doc.content}
                        autoScroll={false}
                      >
                        <TerminalHeader>
                          <TerminalTitle>
                            {tool.help_doc.help_command}
                          </TerminalTitle>
                        </TerminalHeader>
                        <TerminalContent />
                      </Terminal>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Sidebar */}
            <div className='space-y-6'>
              {/* Tool Information */}
              <Card>
                <CardHeader>
                  <div className='flex items-center gap-2'>
                    <Container className='h-5 w-5 text-primary' />
                    <CardTitle>Tool Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <h4 className='text-sm font-semibold mb-2'>About</h4>
                    <p className='text-sm text-muted-foreground leading-relaxed'>
                      {tool.image.description}
                    </p>
                  </div>
                  <Separator />
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Version:</span>
                      <span className='font-semibold'>
                        {tool.image.version}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Tool Type:</span>
                      <span>{tool.tool_type}</span>
                    </div>
                  </div>
                  {tool.tags && tool.tags.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className='text-sm font-semibold mb-2'>标签</h4>
                        <div className='flex flex-wrap gap-1.5'>
                          {tool.tags.map((tag) => {
                            const getTagStyle = (tagName: string) => {
                              switch (tagName) {
                                case 'AI Checked':
                                  return 'bg-green-50 text-green-600 border-green-200'
                                case 'AI Unchecked':
                                  return 'bg-yellow-50 text-yellow-600 border-yellow-200'
                                default:
                                  return 'bg-blue-50 text-blue-600 border-blue-200'
                              }
                            }
                            return (
                              <Badge
                                key={tag.id}
                                variant='outline'
                                className={`${getTagStyle(tag.name)} text-xs`}
                              >
                                {tag.name}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div>
                    <h4 className='text-sm font-semibold mb-2'>Docker Image</h4>
                    <div className='relative'>
                      <Snippet
                        className='!text-xs bg-muted py-2'
                        code={dockerImage}
                      >
                        <SnippetInput />
                        <SnippetAddon align='inline-end' className='pr-2'>
                          <CopyButton code={dockerImage} />
                        </SnippetAddon>
                      </Snippet>
                    </div>
                  </div>
                  <Separator />
                  <div className='space-y-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full gap-2 bg-transparent'
                      asChild
                    >
                      <a
                        href={tool.image.homepage}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <ExternalLink className='h-4 w-4' />
                        Homepage
                      </a>
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full gap-2 bg-transparent'
                      asChild
                    >
                      <a
                        href={tool.image.paper_link}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <ExternalLink className='h-4 w-4' />
                        Publication
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </SidebarInset>
  )
}
