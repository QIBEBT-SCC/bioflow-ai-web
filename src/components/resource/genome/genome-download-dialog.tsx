'use client'

import { CheckCircle2, Download, FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDownloadGenome } from '@/hooks/use-genome'
import type { GenomeDownloadResponse } from '@/types/genome'
import { INDEX_TOOLS } from '@/types/genome'

interface GenomeDownloadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GenomeDownloadDialog({
  open,
  onOpenChange,
}: GenomeDownloadDialogProps) {
  const [tab, setTab] = useState<'name' | 'taxid'>('name')
  const [speciesName, setSpeciesName] = useState('')
  const [ncbiTaxId, setNcbiTaxId] = useState('')
  const [selectedIndexes, setSelectedIndexes] = useState<string[]>([])
  const [result, setResult] = useState<GenomeDownloadResponse | null>(null)

  const downloadMutation = useDownloadGenome()

  const toggleIndex = (field: string) => {
    setSelectedIndexes((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    )
  }

  const handleSubmit = () => {
    const data =
      tab === 'name'
        ? { species_name: speciesName.trim(), required_index: selectedIndexes }
        : { ncbi_tax_id: Number(ncbiTaxId), required_index: selectedIndexes }

    downloadMutation.mutate(data, {
      onSuccess: (resp) => {
        setResult(resp)
      },
    })
  }

  const handleClose = () => {
    onOpenChange(false)
    // 延迟重置，避免关闭动画闪烁
    setTimeout(() => {
      setSpeciesName('')
      setNcbiTaxId('')
      setSelectedIndexes([])
      setResult(null)
    }, 300)
  }

  const isValid =
    tab === 'name'
      ? speciesName.trim().length > 0
      : /^\d+$/.test(ncbiTaxId.trim())

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!downloadMutation.isPending) {
          v ? onOpenChange(v) : handleClose()
        }
      }}
    >
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Download className='h-5 w-5' />
            下载参考基因组
          </DialogTitle>
          <DialogDescription>
            从 NCBI RefSeq
            下载参考基因组（FASTA、GFF、GTF），可同时触发比对索引构建。
          </DialogDescription>
        </DialogHeader>

        {result ? (
          /* 成功结果展示 */
          <div className='py-4 space-y-4'>
            <div className='flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20'>
              <CheckCircle2 className='h-5 w-5 text-emerald-500 shrink-0 mt-0.5' />
              <div>
                <div className='font-medium text-sm text-emerald-700 dark:text-emerald-400'>
                  {result.task_id ? '下载任务已提交' : '基因组已存在'}
                </div>
                <div className='text-xs text-muted-foreground mt-1'>
                  {result.message}
                </div>
              </div>
            </div>
            <dl className='grid grid-cols-2 gap-3 text-sm'>
              <div>
                <dt className='text-xs text-muted-foreground'>物种名</dt>
                <dd className='font-medium mt-0.5'>{result.species_name}</dd>
              </div>
              <div>
                <dt className='text-xs text-muted-foreground'>Accession</dt>
                <dd className='mt-0.5'>
                  <code className='text-xs bg-muted px-1.5 py-0.5 rounded'>
                    {result.ncbi_accession}
                  </code>
                </dd>
              </div>
              <div>
                <dt className='text-xs text-muted-foreground'>NCBI Tax ID</dt>
                <dd className='font-medium mt-0.5'>{result.ncbi_tax_id}</dd>
              </div>
              <div>
                <dt className='text-xs text-muted-foreground'>任务 ID</dt>
                <dd className='mt-0.5'>
                  {result.task_id ? (
                    <code className='text-xs bg-muted px-1 py-0.5 rounded break-all'>
                      {result.task_id}
                    </code>
                  ) : (
                    <span className='text-muted-foreground text-xs'>
                      —（无需下载）
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          /* 输入表单 */
          <div className='py-2 space-y-5'>
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as 'name' | 'taxid')}
            >
              <TabsList className='w-full'>
                <TabsTrigger value='name' className='flex-1'>
                  物种名称
                </TabsTrigger>
                <TabsTrigger value='taxid' className='flex-1'>
                  NCBI Tax ID
                </TabsTrigger>
              </TabsList>
              <TabsContent value='name' className='mt-3'>
                <div className='space-y-1.5'>
                  <Label htmlFor='species-name'>物种名称</Label>
                  <div className='relative'>
                    <FlaskConical className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                      id='species-name'
                      className='pl-9'
                      placeholder='如：Homo sapiens、zebrafish、mouse'
                      value={speciesName}
                      onChange={(e) => setSpeciesName(e.target.value)}
                      disabled={downloadMutation.isPending}
                    />
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    支持学名或常用名，NCBI 自动识别最佳基因组版本
                  </p>
                </div>
              </TabsContent>
              <TabsContent value='taxid' className='mt-3'>
                <div className='space-y-1.5'>
                  <Label htmlFor='tax-id'>NCBI Tax ID</Label>
                  <Input
                    id='tax-id'
                    type='number'
                    placeholder='如：9606（人类）、10090（小鼠）'
                    value={ncbiTaxId}
                    onChange={(e) => setNcbiTaxId(e.target.value)}
                    disabled={downloadMutation.isPending}
                  />
                  <p className='text-xs text-muted-foreground'>
                    使用精确的 Tax ID 可避免歧义，推荐用于批量操作
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* 索引选择 */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>
                同时构建索引（可选）
              </Label>
              <div className='grid grid-cols-1 gap-2'>
                {INDEX_TOOLS.map((tool) => (
                  <label
                    key={tool.key}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      selectedIndexes.includes(tool.field)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <Checkbox
                      checked={selectedIndexes.includes(tool.field)}
                      onCheckedChange={() => toggleIndex(tool.field)}
                      disabled={downloadMutation.isPending}
                    />
                    <div className='flex-1'>
                      <div className='text-sm font-medium'>{tool.label}</div>
                      <div className='text-xs text-muted-foreground'>
                        {tool.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={handleClose}>关闭</Button>
          ) : (
            <>
              <Button
                variant='outline'
                onClick={handleClose}
                disabled={downloadMutation.isPending}
              >
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid || downloadMutation.isPending}
              >
                <Download className='h-4 w-4 mr-1.5' />
                {downloadMutation.isPending ? '查询 NCBI 中...' : '开始下载'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
