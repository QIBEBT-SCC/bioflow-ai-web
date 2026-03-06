'use client'

import { DnaIcon } from 'lucide-react'
import { GenomeManager } from '@/components/resource/genome/genome-manager'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

export default function ResourcePage() {
  return (
    <SidebarInset className='h-screen flex flex-col'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center gap-2 px-4 h-12 bg-background'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='!mr-2 !h-4' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbPage>Resource</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbPage>Genome</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <main className='flex-1 overflow-y-auto'>
        <div className='container mx-auto px-6 py-8 max-w-7xl space-y-8'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-2'>
              <DnaIcon className='h-8 w-8 text-primary' />
              <h1 className='text-4xl font-bold text-balance'>
                参考基因组管理
              </h1>
            </div>
            <p className='text-muted-foreground'>
              管理本地已下载的参考基因组，查看比对索引状态，从 NCBI RefSeq
              下载新基因组并构建 Bowtie2 / BWA / HISAT2 / STAR / Minimap2
              等比对索引。
            </p>
          </div>

          {/* 主体 */}
          <GenomeManager />
        </div>
      </main>
    </SidebarInset>
  )
}
