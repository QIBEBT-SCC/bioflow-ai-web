'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRunWorkflow } from '@/hooks/use-project-workflow'
import { useSamples } from '@/hooks/use-sample'
import { ExecutionScope } from '@/types/workflow'

interface RunWorkflowDialogProps {
  projectId: string
  workflowUid: string
  workflowName: string
  executionScope: ExecutionScope
  defaultAutoSummary: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RunWorkflowDialog({
  projectId,
  workflowUid,
  workflowName,
  executionScope,
  defaultAutoSummary,
  open,
  onOpenChange,
}: RunWorkflowDialogProps) {
  const t = useTranslations('Project.workflow.runDialog')
  const [selectedSamples, setSelectedSamples] = useState<Set<string>>(new Set())
  const [runNamePrefix, setRunNamePrefix] = useState('')
  const [autoSummary, setAutoSummary] = useState(defaultAutoSummary)

  const isProjectLevel = executionScope === ExecutionScope.PROJECT_LEVEL

  const { data: samples = [], isLoading } = useSamples(projectId, 0, 100)
  const runWorkflowMutation = useRunWorkflow()

  // 切换样本选择
  const toggleSample = (sampleUid: string) => {
    setSelectedSamples((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sampleUid)) {
        newSet.delete(sampleUid)
      } else {
        newSet.add(sampleUid)
      }
      return newSet
    })
  }

  // 全选/取消全选
  const toggleAll = () => {
    if (selectedSamples.size === samples.length) {
      setSelectedSamples(new Set())
    } else {
      setSelectedSamples(new Set(samples.map((s) => s.uid)))
    }
  }

  // 运行工作流
  const handleRun = async () => {
    if (!isProjectLevel && selectedSamples.size === 0) {
      toast.error(t('selectAtLeastOneSample'))
      return
    }

    try {
      const result = await runWorkflowMutation.mutateAsync({
        projectId,
        workflowUid,
        data: {
          sample_uids: isProjectLevel ? undefined : Array.from(selectedSamples),
          run_name_prefix: runNamePrefix || undefined,
          auto_summary: autoSummary,
        },
      })

      toast.success(
        isProjectLevel
          ? t('projectRunStarted')
          : t('sampleRunStarted', { count: result.count }),
      )

      // 重置状态
      setSelectedSamples(new Set())
      setRunNamePrefix('')
      setAutoSummary(defaultAutoSummary)
      onOpenChange(false)
    } catch (error) {
      if (error instanceof Error && error.message.includes('409')) {
        toast.error(t('someSamplesRunning'))
      } else if (error instanceof Error) {
        toast.error(t('runFailedWithMessage', { message: error.message }))
      } else {
        toast.error(t('runFailed'))
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('title', { name: workflowName })}</DialogTitle>
          <DialogDescription>
            {isProjectLevel
              ? t('projectLevelDescription')
              : t('sampleLevelDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* 样本选择 - 仅样本级工作流显示 */}
          {!isProjectLevel && (
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label>{t('selectSamples')}</Label>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={toggleAll}
                  disabled={samples.length === 0}
                >
                  {selectedSamples.size === samples.length
                    ? t('deselectAll')
                    : t('selectAll')}
                </Button>
              </div>

              <ScrollArea className='h-62.5 rounded-md border p-4'>
                {isLoading ? (
                  <div className='flex items-center justify-center py-12'>
                    <Loader2 className='size-8 animate-spin text-muted-foreground' />
                  </div>
                ) : samples.length === 0 ? (
                  <div className='text-center py-12 text-muted-foreground'>
                    {t('emptySamples')}
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {samples.map((sample) => (
                      <button
                        key={sample.uid}
                        type='button'
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-left w-full ${
                          selectedSamples.has(sample.uid)
                            ? 'bg-primary/5 border-primary'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleSample(sample.uid)}
                      >
                        <div className='flex items-center h-5'>
                          <input
                            type='checkbox'
                            aria-label={t('selectSampleAria', {
                              name: sample.sample_name,
                            })}
                            checked={selectedSamples.has(sample.uid)}
                            onChange={() => toggleSample(sample.uid)}
                            className='size-4 rounded border-gray-300'
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2'>
                            <h4 className='font-medium text-sm'>
                              {sample.sample_name}
                            </h4>
                            <Badge variant='outline' className='text-xs'>
                              {t('fileCount', { count: sample.file_count })}
                            </Badge>
                          </div>
                          {Object.keys(sample.meta_data || {}).length > 0 && (
                            <div className='flex flex-wrap gap-1 mt-1'>
                              {Object.entries(sample.meta_data || {}).map(
                                ([key, value]) => (
                                  <Badge
                                    key={key}
                                    variant='secondary'
                                    className='text-xs'
                                  >
                                    {key}: {String(value)}
                                  </Badge>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* 运行名称前缀 */}
          <div className='space-y-2'>
            <Label htmlFor='run-name-prefix'>
              {t('runNamePrefix')}{' '}
              <span className='text-muted-foreground'>{t('optional')}</span>
            </Label>
            <Input
              id='run-name-prefix'
              placeholder={t('runNamePrefixPlaceholder')}
              value={runNamePrefix}
              onChange={(e) => setRunNamePrefix(e.target.value)}
            />
            <p className='text-xs text-muted-foreground'>
              {t('runNamePrefixDescription')}
            </p>
          </div>

          <div className='flex items-center gap-3 rounded-lg border p-3'>
            <Checkbox
              id='auto-summary'
              checked={autoSummary}
              onCheckedChange={(checked) => setAutoSummary(checked === true)}
            />
            <Label
              htmlFor='auto-summary'
              className='cursor-pointer text-sm font-medium'
            >
              {t('autoSummary')}
            </Label>
          </div>

          {/* 运行实例数量提示 */}
          {isProjectLevel ? (
            <div className='rounded-lg bg-muted p-3'>
              <p className='text-sm'>
                {t('willCreate')}{' '}
                <span className='font-semibold text-primary'>1</span>{' '}
                {t('projectInstanceSuffix')}
              </p>
            </div>
          ) : (
            selectedSamples.size > 0 && (
              <div className='rounded-lg bg-muted p-3'>
                <p className='text-sm'>
                  {t('willCreate')}{' '}
                  <span className='font-semibold text-primary'>
                    {selectedSamples.size}
                  </span>{' '}
                  {t('instanceCountSuffix')}
                </p>
              </div>
            )
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleRun}
            disabled={
              (!isProjectLevel && selectedSamples.size === 0) ||
              runWorkflowMutation.isPending
            }
          >
            {runWorkflowMutation.isPending ? (
              <>
                <Loader2 className='size-4 mr-2 animate-spin' />
                {t('running')}
              </>
            ) : (
              t('start')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
