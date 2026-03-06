'use client'

import { Download, Search } from 'lucide-react'
import { useState } from 'react'
import { GenomeDetail } from '@/components/resource/genome/genome-detail'
import { GenomeDownloadDialog } from '@/components/resource/genome/genome-download-dialog'
import { GenomeList } from '@/components/resource/genome/genome-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function GenomeManager() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)

  return (
    <div className='space-y-4'>
      {/* 工具栏 */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='搜索物种名或别名...'
            className='pl-9'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsDownloadOpen(true)}>
          <Download className='h-4 w-4 mr-2' />
          下载基因组
        </Button>
      </div>

      {/* 主体：列表 + 详情 */}
      <div className='grid grid-cols-1 gap-6 xl:grid-cols-5'>
        {/* 列表区域 */}
        <div className='xl:col-span-3 rounded-lg border bg-card p-4'>
          <GenomeList
            searchQuery={searchQuery}
            onSelectGenome={(id) => setSelectedId(id)}
            selectedId={selectedId}
          />
        </div>

        {/* 详情区域 */}
        <div className='xl:col-span-2 rounded-lg border bg-card p-4 min-h-[400px]'>
          {selectedId !== null ? (
            <GenomeDetail
              genomeId={selectedId}
              onDelete={() => setSelectedId(null)}
            />
          ) : (
            <div className='flex h-full min-h-[400px] flex-col items-center justify-center gap-2 text-center text-muted-foreground'>
              <Search className='h-8 w-8 opacity-30' />
              <p className='text-sm'>点击左侧列表中的基因组查看详情</p>
            </div>
          )}
        </div>
      </div>

      {/* 下载对话框 */}
      <GenomeDownloadDialog
        open={isDownloadOpen}
        onOpenChange={setIsDownloadOpen}
      />
    </div>
  )
}
