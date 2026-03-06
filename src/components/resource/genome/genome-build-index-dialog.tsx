'use client'

import { Hammer } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { useBuildGenomeIndex } from '@/hooks/use-genome'
import type { ReferenceGenomePublic } from '@/types/genome'
import { INDEX_TOOLS } from '@/types/genome'

interface GenomeBuildIndexDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  genome: ReferenceGenomePublic
}

export function GenomeBuildIndexDialog({
  open,
  onOpenChange,
  genome,
}: GenomeBuildIndexDialogProps) {
  const [selected, setSelected] = useState<string[]>([])
  const buildMutation = useBuildGenomeIndex()

  const toggle = (field: string) => {
    setSelected((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    )
  }

  const handleSubmit = () => {
    if (selected.length === 0) return
    buildMutation.mutate(
      { id: genome.id, data: { required_index: selected } },
      {
        onSuccess: () => {
          onOpenChange(false)
          setSelected([])
        },
      },
    )
  }

  const handleOpenChange = (v: boolean) => {
    if (!buildMutation.isPending) {
      onOpenChange(v)
      if (!v) setSelected([])
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Hammer className='h-5 w-5' />
            构建比对索引
          </DialogTitle>
          <DialogDescription>
            为 <strong>{genome.name}</strong>{' '}
            选择需要构建的索引。已就绪的索引不可再次构建，构建中的索引跳过。
          </DialogDescription>
        </DialogHeader>

        <div className='py-2 space-y-3'>
          {INDEX_TOOLS.map((tool) => {
            const status = genome.index_status[tool.key]
            const isDisabled = status !== 'not_built'
            const isChecked = selected.includes(tool.field)

            return (
              <div
                key={tool.key}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  isDisabled
                    ? 'opacity-50 bg-muted/30'
                    : isChecked
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/40'
                }`}
              >
                <Checkbox
                  id={tool.field}
                  checked={isChecked}
                  disabled={isDisabled || buildMutation.isPending}
                  onCheckedChange={() => toggle(tool.field)}
                  className='mt-0.5'
                />
                <Label
                  htmlFor={tool.field}
                  className={`flex-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className='font-medium text-sm'>{tool.label}</div>
                  <div className='text-xs text-muted-foreground'>
                    {tool.description}
                  </div>
                  <div className='text-xs mt-0.5'>
                    {status === 'ready' && (
                      <span className='text-emerald-600 dark:text-emerald-400'>
                        ✓ 已就绪
                      </span>
                    )}
                    {status === 'building' && (
                      <span className='text-amber-600 dark:text-amber-400'>
                        ⟳ 构建中
                      </span>
                    )}
                    {status === 'not_built' && (
                      <span className='text-muted-foreground'>未构建</span>
                    )}
                  </div>
                </Label>
              </div>
            )
          })}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => handleOpenChange(false)}
            disabled={buildMutation.isPending}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selected.length === 0 || buildMutation.isPending}
          >
            <Hammer className='h-4 w-4 mr-1.5' />
            {buildMutation.isPending
              ? '提交中...'
              : `提交构建（${selected.length} 个）`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
