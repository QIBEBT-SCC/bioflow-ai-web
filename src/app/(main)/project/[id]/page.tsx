'use client'

import {
  DownloadIcon,
  FileBarChart,
  FileText,
  FlaskConical,
  MoreHorizontal,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ProjectDetailCard } from '@/components/project/project-detail-card'
import { ProjectWorkflowList } from '@/components/project-workflow/project-workflow-list'
import { SampleList } from '@/components/sample/sample-list'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProject } from '@/hooks/use-project'

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const { data: project } = useProject(projectId)

  // 在实际应用中，这里会根据 params.id 从数据库获取项目信息
  const tempProject = {
    id: projectId,
    name: 'tensorflow_models',
    description: 'TensorFlow 模型集合，包含图像分类、目标检测和分割模型',
    lastUpdated: '1 天前',
    totalWorkflows: 8,
    completedWorkflows: 5,
    inProgressWorkflows: 2,
    failedWorkflows: 1,
    sampleCount: 1250,
    starred: true,
    tags: [
      { id: 'ml', name: '机器学习', color: 'red' },
      { id: 'cv', name: '计算机视觉', color: 'blue' },
    ],
    workflows: [
      {
        id: 'wf1',
        name: '图像分类训练',
        status: 'completed',
        progress: 100,
        startTime: '2023-05-01 09:30',
        endTime: '2023-05-01 14:45',
        duration: '5 小时 15 分钟',
        samples: 450,
        accuracy: '94.2%',
      },
      {
        id: 'wf2',
        name: '目标检测评估',
        status: 'completed',
        progress: 100,
        startTime: '2023-05-02 10:15',
        endTime: '2023-05-02 12:30',
        duration: '2 小时 15 分钟',
        samples: 200,
        accuracy: '88.7%',
      },
      {
        id: 'wf3',
        name: '模型优化',
        status: 'in_progress',
        progress: 65,
        startTime: '2023-05-03 14:00',
        endTime: null,
        duration: '进行中',
        samples: 300,
        accuracy: '进行中',
      },
      {
        id: 'wf4',
        name: '数据增强测试',
        status: 'failed',
        progress: 32,
        startTime: '2023-05-04 08:45',
        endTime: '2023-05-04 09:20',
        duration: '35 分钟 (失败)',
        samples: 150,
        accuracy: '失败',
      },
      {
        id: 'wf5',
        name: '迁移学习实验',
        status: 'completed',
        progress: 100,
        startTime: '2023-05-05 11:30',
        endTime: '2023-05-05 16:45',
        duration: '5 小时 15 分钟',
        samples: 250,
        accuracy: '91.5%',
      },
      {
        id: 'wf6',
        name: '特征提取',
        status: 'completed',
        progress: 100,
        startTime: '2023-05-06 09:00',
        endTime: '2023-05-06 11:30',
        duration: '2 小时 30 分钟',
        samples: 300,
        accuracy: '93.8%',
      },
      {
        id: 'wf7',
        name: '模型部署测试',
        status: 'completed',
        progress: 100,
        startTime: '2023-05-07 13:15',
        endTime: '2023-05-07 15:00',
        duration: '1 小时 45 分钟',
        samples: 100,
        accuracy: '96.2%',
      },
      {
        id: 'wf8',
        name: '超参数调优',
        status: 'in_progress',
        progress: 45,
        startTime: '2023-05-08 10:00',
        endTime: null,
        duration: '进行中',
        samples: 200,
        accuracy: '进行中',
      },
    ],
    reports: [
      {
        id: 'rep1',
        name: '模型性能分析报告',
        createdAt: '2023-05-05',
        author: '张三',
      },
      {
        id: 'rep2',
        name: '数据集质量评估',
        createdAt: '2023-05-03',
        author: '李四',
      },
      {
        id: 'rep3',
        name: '模型对比实验结果',
        createdAt: '2023-05-01',
        author: '王五',
      },
    ],
  }

  if (!project) {
    return (
      <SidebarInset>
        <header className='flex flex-col shrink-0 border-b'>
          <div className='flex items-center gap-2 px-4 h-12 bg-background'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='!mr-2 !h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbLink asChild>
                    <Link href='/project'>Projects</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className='hidden md:block' />
                <BreadcrumbItem>
                  <BreadcrumbPage>--</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div></div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center gap-2 px-4 h-12 bg-background'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='!mr-2 !h-4' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbLink asChild>
                  <Link href='/project'>Projects</Link>
                  {/*Projects*/}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className='hidden md:block' />
              <BreadcrumbItem>
                <BreadcrumbPage>{project.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className='container mx-auto px-4 py-6 space-y-6'>
        {/* 返回和项目标题 */}
        <ProjectDetailCard />

        {/* 项目内容标签页 */}
        <Tabs defaultValue='files' className='w-full'>
          <TabsList className='grid grid-cols-3 md:w-auto md:inline-flex'>
            <TabsTrigger value='files' className='flex items-center'>
              <FileText className='h-4 w-4 mr-2' />
              文件
            </TabsTrigger>
            <TabsTrigger value='workflows' className='flex items-center'>
              <FlaskConical className='h-4 w-4 mr-2' />
              工作流
            </TabsTrigger>
            <TabsTrigger value='reports' className='flex items-center'>
              <FileBarChart className='h-4 w-4 mr-2' />
              报告
            </TabsTrigger>
          </TabsList>

          {/* 工作流标签页内容 */}
          <TabsContent value='workflows' className='mt-6'>
            <ProjectWorkflowList projectId={projectId} />
          </TabsContent>

          {/* 报告标签页内容 */}
          <TabsContent value='reports' className='mt-6'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-lg font-medium'>分析报告</h2>
              <Button size='sm'>
                <DownloadIcon className='h-4 w-4 mr-2' />
                下载报告
              </Button>
            </div>

            <div className='rounded-md border'>
              <div className='relative w-full overflow-auto'>
                <table className='w-full caption-bottom text-sm'>
                  <thead className='bg-muted/50'>
                    <tr className='border-b'>
                      <th className='h-12 px-4 text-left align-middle font-medium'>
                        报告名称
                      </th>
                      <th className='h-12 px-4 text-left align-middle font-medium'>
                        创建日期
                      </th>
                      <th className='h-12 px-4 text-left align-middle font-medium'>
                        创建者
                      </th>
                      <th className='h-12 px-4 text-right align-middle font-medium'>
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tempProject.reports.map((report) => (
                      <tr
                        key={report.id}
                        className='border-b hover:bg-muted/50 transition-colors'
                      >
                        <td className='p-4 font-medium'>
                          <Link
                            href={`/projects/${tempProject.id}/reports/${report.id}`}
                            className='hover:underline'
                          >
                            {report.name}
                          </Link>
                        </td>
                        <td className='p-4 text-muted-foreground'>
                          {report.createdAt}
                        </td>
                        <td className='p-4 text-muted-foreground'>
                          {report.author}
                        </td>
                        <td className='p-4 text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='icon'>
                                <MoreHorizontal className='h-4 w-4' />
                                <span className='sr-only'>更多选项</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem>查看</DropdownMenuItem>
                              <DropdownMenuItem>编辑</DropdownMenuItem>
                              <DropdownMenuItem>导出 PDF</DropdownMenuItem>
                              <DropdownMenuItem>分享</DropdownMenuItem>
                              <DropdownMenuItem className='text-destructive'>
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* 文件标签页内容 */}
          <TabsContent value='files' className='mt-6'>
            <SampleList projectId={Number(projectId)} />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  )
}
