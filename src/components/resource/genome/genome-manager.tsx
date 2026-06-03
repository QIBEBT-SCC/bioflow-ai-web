'use client'

import { Download, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { GenomeDetail } from '@/components/resource/genome/genome-detail'
import { GenomeDownloadDialog } from '@/components/resource/genome/genome-download-dialog'
import { GenomeList } from '@/components/resource/genome/genome-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function GenomeManager() {
  const t = useTranslations('resource')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
          <Input
            placeholder={t('genome.search_placeholder')}
            className='pl-9'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsDownloadOpen(true)}>
          <Download className='size-4 mr-2' />
          {t('genome.download_genome')}
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-5'>
        <div className='xl:col-span-3 rounded-lg border bg-card p-4'>
          <GenomeList
            searchQuery={searchQuery}
            onSelectGenome={(id) => setSelectedId(id)}
            selectedId={selectedId}
          />
        </div>

        <div className='xl:col-span-2 rounded-lg border bg-card p-4 min-h-100'>
          {selectedId !== null ? (
            <GenomeDetail
              genomeId={selectedId}
              onDelete={() => setSelectedId(null)}
            />
          ) : (
            <div className='flex h-full min-h-100 flex-col items-center justify-center gap-2 text-center text-muted-foreground'>
              <Search className='size-8 opacity-30' />
              <p className='text-sm'>{t('genome.select_hint')}</p>
            </div>
          )}
        </div>
      </div>

      <GenomeDownloadDialog
        open={isDownloadOpen}
        onOpenChange={setIsDownloadOpen}
      />
    </div>
  )
}
