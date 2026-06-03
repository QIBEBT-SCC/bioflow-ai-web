'use client'

import { Hammer } from 'lucide-react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('resource')
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
            <Hammer className='size-5' />
            {t('genome.build_index_title')}
          </DialogTitle>
          <DialogDescription asChild>
            <div>
              {t.rich('genome.build_index_desc', {
                name: genome.name,
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </div>
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
                    {t(tool.descKey as Parameters<typeof t>[0])}
                  </div>
                  <div className='text-xs mt-0.5'>
                    {status === 'ready' && (
                      <span className='text-emerald-600 dark:text-emerald-400'>
                        ✓ {t('genome.status_ready')}
                      </span>
                    )}
                    {status === 'building' && (
                      <span className='text-amber-600 dark:text-amber-400'>
                        ⟳ {t('genome.status_building')}
                      </span>
                    )}
                    {status === 'not_built' && (
                      <span className='text-muted-foreground'>
                        {t('genome.status_not_built')}
                      </span>
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
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selected.length === 0 || buildMutation.isPending}
          >
            <Hammer className='size-4 mr-1.5' />
            {buildMutation.isPending
              ? t('genome.submitting')
              : t('genome.submit_build', { count: selected.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
