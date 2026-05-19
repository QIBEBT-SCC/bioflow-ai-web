'use client'

import {
  ChevronDown,
  Download,
  Filter,
  FolderPlus,
  Grid,
  List,
  Plus,
  Search,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { ToolGroupSidebar } from '@/components/tool/tool-group-sidebar'
import { ToolList } from '@/components/tool/tool-list'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

export default function ToolsPage() {
  const t = useTranslations('tool.Page')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)

  return (
    <SidebarInset>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center gap-2 px-4 h-12 bg-background'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='!mr-2 !h-4' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbPage>{t('title')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className='flex-1 overflow-y-auto'>
        <div className='container mx-auto py-6'>
          {/* 顶部操作栏 */}
          <div className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6'>
            <h1 className='text-2xl font-bold'>{t('management')}</h1>
            <div className='flex gap-2 w-full sm:w-auto'>
              <div className='relative flex-1 sm:flex-initial'>
                <Search className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
                <Input
                  type='search'
                  placeholder={t('searchPlaceholder')}
                  className='pl-8 w-full sm:w-[250px]'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline'>
                    <Plus className='size-4 mr-2' />
                    {t('add')}
                    <ChevronDown className='size-4 ml-2' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <Link href='/tool/add'>
                    <DropdownMenuItem>
                      <Plus className='size-4 mr-2' />
                      {t('addTool')}
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem>
                    <FolderPlus className='size-4 mr-2' />
                    {t('createGroup')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Download className='size-4 mr-2' />
                    {t('importTool')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className='flex flex-col md:flex-row gap-6'>
            {/* 侧边栏 - 分组筛选 */}
            <ToolGroupSidebar
              selectedGroupId={selectedGroupId}
              onSelectGroup={setSelectedGroupId}
            />

            {/* 主内容区 */}
            <main className='flex-1 space-y-6'>
              {/* 视图切换和筛选 */}
              <div className='flex justify-between items-center'>
                <h2 className='text-lg font-medium'>
                  {selectedGroupId === null ? t('allTools') : t('groupTools')}
                </h2>
                <div className='flex items-center gap-2'>
                  <Button variant='outline' size='sm'>
                    <Filter className='size-4 mr-2' />
                    {t('filter')}
                  </Button>
                  <div className='border rounded-md flex'>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size='sm'
                      className='rounded-r-none'
                      onClick={() => setViewMode('list')}
                    >
                      <List className='size-4' />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size='sm'
                      className='rounded-l-none'
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className='size-4' />
                    </Button>
                  </div>
                </div>
              </div>

              {/* 工具列表 */}
              <ToolList
                viewMode={viewMode}
                searchQuery={searchQuery}
                selectedGroupId={selectedGroupId}
              />
            </main>
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}
