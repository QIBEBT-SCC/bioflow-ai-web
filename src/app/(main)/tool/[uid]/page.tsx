'use client'

import {
  ArrowLeft,
  Code,
  Copy,
  ExternalLink,
  FileText,
  HardDrive,
  Info,
  Layers,
  Terminal,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
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

  // 复制命令到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success('已复制到剪贴板')
      })
      .catch((err) => {
        console.error('复制失败:', err)
        toast.error('复制失败')
      })
  }

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

      <div className='flex-1 overflow-y-auto'>
        <div className='container mx-auto py-6 max-w-4xl'>
          <div className='mb-6'>
            <Link
              href='/tool'
              className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2'
            >
              <ArrowLeft className='h-4 w-4 mr-1' />
              返回工具列表
            </Link>
          </div>

          {/* 工具标题和基本信息 */}
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4'>
            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-3xl font-bold'>{tool.name}</h1>
                <Badge className='ml-2'>{tool.image.image.tag}</Badge>
              </div>
              <p className='text-muted-foreground mt-1'>
                {tool.image.image.namespace}
              </p>
            </div>
            <div className='flex gap-2'>
              <Button asChild variant='outline' size='sm'>
                <a
                  href={tool.image.homepage}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <FileText className='h-4 w-4 mr-2' />
                  查看文档
                </a>
              </Button>
              <Button asChild variant='outline' size='sm'>
                <a
                  href={`https://hub.docker.com/r/${tool.image.image.namespace}`}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <ExternalLink className='h-4 w-4 mr-2' />
                  Docker Hub
                </a>
              </Button>
            </div>
          </div>

          {/* 工具描述 */}
          <Card className='pt-0 gap-0 mb-6'>
            <CardContent className='pt-6'>
              <p>{tool.description}</p>
            </CardContent>
          </Card>

          {/* 主要内容区域 */}
          <Tabs defaultValue='overview' className='w-full'>
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='overview'>
                <Info className='h-4 w-4 mr-2' />
                概览
              </TabsTrigger>
              <TabsTrigger value='params'>
                <Layers className='h-4 w-4 mr-2' />
                参数
                <Badge variant='outline' className='ml-2'>
                  {tool.dynamic_params.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value='outputs'>
                <FileText className='h-4 w-4 mr-2' />
                输出
                <Badge variant='outline' className='ml-2'>
                  {tool.file_mounts.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value='command'>
                <Terminal className='h-4 w-4 mr-2' />
                命令
              </TabsTrigger>
            </TabsList>

            {/* 概览选项卡 */}
            <TabsContent value='overview'>
              <Card>
                <CardHeader>
                  <CardTitle>工具概览</CardTitle>
                  <CardDescription>Docker 容器和基本配置信息</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {/* Docker 镜像信息 */}
                  <div className='space-y-2'>
                    <h3 className='text-sm font-medium text-muted-foreground'>
                      Docker 镜像
                    </h3>
                    <div className='flex items-center bg-muted/30 p-3 rounded-md'>
                      <HardDrive className='h-5 w-5 mr-3 text-muted-foreground' />
                      <span className='font-medium'>
                        {tool.image.image.registry}/{tool.image.image.namespace}
                        /{tool.image.image.repository}:{tool.image.image.tag}
                      </span>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 ml-2'
                        onClick={() =>
                          copyToClipboard(
                            `${tool.image.image.registry}/${tool.image.image.namespace}/${tool.image.image.repository}:${tool.image.image.tag}`,
                          )
                        }
                      >
                        <Copy className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>

                  {/* 命令模板 */}
                  <div className='space-y-2'>
                    <h3 className='text-sm font-medium text-muted-foreground'>
                      命令模板
                    </h3>
                    <div className='flex items-center bg-muted/30 p-3 rounded-md'>
                      <Code className='h-5 w-5 mr-3 text-muted-foreground' />
                      <code className='text-sm overflow-x-auto max-w-full'>
                        {tool.command_template}
                      </code>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 ml-2 flex-shrink-0'
                        onClick={() => copyToClipboard(tool.command_template)}
                      >
                        <Copy className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>

                  {/* 帮助命令 */}
                  <div className='space-y-2'>
                    <h3 className='text-sm font-medium text-muted-foreground'>
                      帮助命令
                    </h3>
                    <div className='flex items-center bg-muted/30 p-3 rounded-md'>
                      <Terminal className='h-5 w-5 mr-3 text-muted-foreground' />
                      <code className='text-sm'>
                        {tool.help_doc.help_command}
                      </code>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 ml-2'
                        onClick={() =>
                          copyToClipboard(tool.help_doc.help_command)
                        }
                      >
                        <Copy className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>

                  {/* 配置选项 */}
                  <div className='space-y-2'>
                    <h3 className='text-sm font-medium text-muted-foreground'>
                      配置选项
                    </h3>
                    <div className='bg-muted/30 p-3 rounded-md'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='flex items-center'>
                          <Badge
                            variant={tool.mkdir_output ? 'default' : 'outline'}
                            className='mr-3'
                          >
                            {tool.mkdir_output ? '是' : '否'}
                          </Badge>
                          <span>创建输出目录</span>
                        </div>
                        <div className='flex items-center'>
                          <Badge
                            variant={tool.use_temp_dir ? 'default' : 'outline'}
                            className='mr-3'
                          >
                            {tool.use_temp_dir ? '是' : '否'}
                          </Badge>
                          <span>使用临时目录</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 参数选项卡 */}
            <TabsContent value='params'>
              <Card>
                <CardHeader>
                  <CardTitle>参数配置</CardTitle>
                  <CardDescription>
                    工具所需的必要参数和可选参数
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div>
                    <h3 className='text-lg font-medium mb-4'>动态参数</h3>
                    <div className='grid grid-cols-1 gap-4'>
                      {tool.dynamic_params.map((param, index) => (
                        <div
                          key={`param-${index}-${param.command}`}
                          className={`p-4 rounded-lg border ${param.is_position ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-green-500'}`}
                        >
                          <div className='gap-4'>
                            <div>
                              <p className='text-sm text-muted-foreground mb-1'>
                                {param.description}
                              </p>
                              <code className='bg-muted px-2 py-1 rounded text-sm block overflow-x-auto'>
                                {param.command}
                              </code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className='text-lg font-medium mb-4'>固定参数</h3>
                    {tool.static_params ? (
                      <div className='bg-muted p-4 rounded-lg'>
                        <code className='text-sm block overflow-x-auto whitespace-pre-wrap'>
                          {tool.static_params}
                        </code>
                      </div>
                    ) : (
                      <p className='text-muted-foreground'>无固定参数</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 输出文件选项卡 */}
            <TabsContent value='outputs'>
              <Card>
                <CardHeader>
                  <CardTitle>文件挂载</CardTitle>
                  <CardDescription>工具生成的输入输出文件配置</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 gap-4'>
                    {tool.file_mounts.map((file, index) => (
                      <div
                        key={`file-${index}-${file.name}`}
                        className={`p-4 rounded-lg border border-l-4 ${file.file_type === 'INPUT' ? 'border-l-blue-500' : 'border-l-green-500'}`}
                      >
                        <h4 className='font-medium mb-3'>{file.name}</h4>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div>
                            <p className='text-sm text-muted-foreground mb-1'>
                              文件路径
                            </p>
                            <code className='bg-muted px-2 py-1 rounded text-sm block overflow-x-auto'>
                              {file.file_path}
                            </code>
                          </div>
                          <div>
                            <p className='text-sm text-muted-foreground mb-1'>
                              挂载路径
                            </p>
                            <code className='bg-muted px-2 py-1 rounded text-sm block overflow-x-auto'>
                              {file.mount_path}
                            </code>
                          </div>
                        </div>

                        <div className='mt-3'>
                          <p className='text-sm text-muted-foreground mb-1'>
                            {file.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 命令选项卡 */}
            <TabsContent value='command'>
              <Card>
                <CardHeader>
                  <CardTitle>命令示例</CardTitle>
                  <CardDescription>根据配置生成的命令示例</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='bg-black text-white p-4 rounded-lg font-mono text-sm overflow-x-auto'>
                      <pre className='whitespace-pre-wrap'>
                        {tool.complete_command}
                      </pre>
                    </div>
                    <div className='flex justify-end'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => copyToClipboard(tool.complete_command)}
                      >
                        <Copy className='h-4 w-4 mr-2' />
                        复制命令
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SidebarInset>
  )
}
