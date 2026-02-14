'use client'

import { ChevronDownIcon, FilterIcon, SearchIcon } from 'lucide-react'
import { NewProjectDialog } from '@/components/project/new-project-dialog'
import {
  AllProjectTable,
  MyProjectTable,
  StarredProjectTable,
} from '@/components/project/project-list'
import { TagList } from '@/components/project/tag-list'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ProjectsPage() {
  return (
    <SidebarInset>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center gap-2 px-4 h-12 bg-background'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='!mr-2 !h-4' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbPage>Projects</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className='container px-4 mx-auto py-6'>
        <div className='flex flex-col md:flex-row gap-6'>
          {/* 侧边栏 - 标签筛选 */}
          <TagList />

          {/* 主内容区 */}
          <main className='flex-1 space-y-6'>
            {/* 顶部操作栏 */}
            <div className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center'>
              <h1 className='text-2xl font-bold'>项目</h1>
              <div className='flex gap-2 w-full sm:w-auto'>
                <div className='relative flex-1 sm:flex-initial'>
                  <SearchIcon className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                    type='search'
                    placeholder='搜索项目...'
                    className='pl-8 w-full sm:w-[250px]'
                  />
                </div>
                <NewProjectDialog />
              </div>
            </div>

            {/* 筛选选项和项目列表 */}
            <div className='space-y-6'>
              <div className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center'>
                <Tabs defaultValue='all' className='w-full'>
                  <div className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center w-full'>
                    <TabsList>
                      <TabsTrigger value='all'>全部项目</TabsTrigger>
                      <TabsTrigger value='starred'>已收藏</TabsTrigger>
                      <TabsTrigger value='my'>我创建的</TabsTrigger>
                    </TabsList>

                    <div className='flex items-center gap-2'>
                      <Button variant='outline' size='sm'>
                        <FilterIcon className='h-4 w-4 mr-2' />
                        筛选
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='outline' size='sm'>
                            最近更新
                            <ChevronDownIcon className='ml-2 h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem>最近更新</DropdownMenuItem>
                          <DropdownMenuItem>名称 (A-Z)</DropdownMenuItem>
                          <DropdownMenuItem>名称 (Z-A)</DropdownMenuItem>
                          <DropdownMenuItem>最多运行</DropdownMenuItem>
                          <DropdownMenuItem>最少运行</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* 项目列表 - 全部 */}
                  <TabsContent value='all' className='mt-6'>
                    <AllProjectTable />
                  </TabsContent>

                  {/* 项目列表 - 已收藏 */}
                  <TabsContent value='starred' className='mt-6'>
                    <StarredProjectTable />
                  </TabsContent>

                  {/* 项目列表 - 我的 */}
                  <TabsContent value='my' className='mt-6'>
                    <MyProjectTable />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarInset>
  )
}
