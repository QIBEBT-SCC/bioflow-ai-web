'use client'

import { CheckCircle2, Download, FlaskConical } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useReducer } from 'react'
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

type DlState = {
  tab: 'name' | 'taxid'
  speciesName: string
  ncbiTaxId: string
  selectedIndexes: string[]
  result: GenomeDownloadResponse | null
}
type DlAction =
  | { type: 'SET_TAB'; value: 'name' | 'taxid' }
  | { type: 'SET_SPECIES'; value: string }
  | { type: 'SET_TAXID'; value: string }
  | { type: 'TOGGLE_INDEX'; field: string }
  | { type: 'SET_RESULT'; value: GenomeDownloadResponse }
  | { type: 'RESET' }

const INITIAL_DL: DlState = {
  tab: 'name',
  speciesName: '',
  ncbiTaxId: '',
  selectedIndexes: [],
  result: null,
}

function dlReducer(state: DlState, action: DlAction): DlState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, tab: action.value }
    case 'SET_SPECIES':
      return { ...state, speciesName: action.value }
    case 'SET_TAXID':
      return { ...state, ncbiTaxId: action.value }
    case 'TOGGLE_INDEX':
      return {
        ...state,
        selectedIndexes: state.selectedIndexes.includes(action.field)
          ? state.selectedIndexes.filter((f) => f !== action.field)
          : [...state.selectedIndexes, action.field],
      }
    case 'SET_RESULT':
      return { ...state, result: action.value }
    case 'RESET':
      return INITIAL_DL
  }
}

export function GenomeDownloadDialog({
  open,
  onOpenChange,
}: GenomeDownloadDialogProps) {
  const t = useTranslations('resource')
  const [{ tab, speciesName, ncbiTaxId, selectedIndexes, result }, dispatch] =
    useReducer(dlReducer, INITIAL_DL)

  const downloadMutation = useDownloadGenome()

  const toggleIndex = (field: string) => {
    dispatch({ type: 'TOGGLE_INDEX', field })
  }

  const handleSubmit = () => {
    const data =
      tab === 'name'
        ? { species_name: speciesName.trim(), required_index: selectedIndexes }
        : { ncbi_tax_id: Number(ncbiTaxId), required_index: selectedIndexes }

    downloadMutation.mutate(data, {
      onSuccess: (resp) => {
        dispatch({ type: 'SET_RESULT', value: resp })
      },
    })
  }

  const handleClose = () => {
    onOpenChange(false)
    // 延迟重置，避免关闭动画闪烁
    setTimeout(() => {
      dispatch({ type: 'RESET' })
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
      <DialogContent className='sm:max-w-130'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Download className='size-5' />
            {t('genome.download_title')}
          </DialogTitle>
          <DialogDescription>{t('genome.download_desc')}</DialogDescription>
        </DialogHeader>

        {result ? (
          /* 成功结果展示 */
          <div className='py-4 space-y-4'>
            <div className='flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20'>
              <CheckCircle2 className='size-5 text-emerald-500 shrink-0 mt-0.5' />
              <div>
                <div className='font-medium text-sm text-emerald-700 dark:text-emerald-400'>
                  {result.task_id
                    ? t('genome.task_submitted')
                    : t('genome.genome_exists')}
                </div>
                <div className='text-xs text-muted-foreground mt-1'>
                  {result.message}
                </div>
              </div>
            </div>
            <dl className='grid grid-cols-2 gap-3 text-sm'>
              <div>
                <dt className='text-xs text-muted-foreground'>
                  {t('genome.col_species_name')}
                </dt>
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
                <dt className='text-xs text-muted-foreground'>
                  {t('genome.col_task_id')}
                </dt>
                <dd className='mt-0.5'>
                  {result.task_id ? (
                    <code className='text-xs bg-muted px-1 py-0.5 rounded break-all'>
                      {result.task_id}
                    </code>
                  ) : (
                    <span className='text-muted-foreground text-xs'>
                      {t('genome.no_task_needed')}
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
              onValueChange={(v) =>
                dispatch({ type: 'SET_TAB', value: v as 'name' | 'taxid' })
              }
            >
              <TabsList className='w-full'>
                <TabsTrigger value='name' className='flex-1'>
                  {t('genome.species_name_tab')}
                </TabsTrigger>
                <TabsTrigger value='taxid' className='flex-1'>
                  NCBI Tax ID
                </TabsTrigger>
              </TabsList>
              <TabsContent value='name' className='mt-3'>
                <div className='space-y-1.5'>
                  <Label htmlFor='species-name'>
                    {t('genome.species_name_label')}
                  </Label>
                  <div className='relative'>
                    <FlaskConical className='absolute left-3 top-2.5 size-4 text-muted-foreground' />
                    <Input
                      id='species-name'
                      className='pl-9'
                      placeholder={t('genome.species_name_placeholder')}
                      value={speciesName}
                      onChange={(e) =>
                        dispatch({ type: 'SET_SPECIES', value: e.target.value })
                      }
                      disabled={downloadMutation.isPending}
                    />
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {t('genome.species_name_hint')}
                  </p>
                </div>
              </TabsContent>
              <TabsContent value='taxid' className='mt-3'>
                <div className='space-y-1.5'>
                  <Label htmlFor='tax-id'>NCBI Tax ID</Label>
                  <Input
                    id='tax-id'
                    type='number'
                    placeholder={t('genome.taxid_placeholder')}
                    value={ncbiTaxId}
                    onChange={(e) =>
                      dispatch({ type: 'SET_TAXID', value: e.target.value })
                    }
                    disabled={downloadMutation.isPending}
                  />
                  <p className='text-xs text-muted-foreground'>
                    {t('genome.taxid_hint')}
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className='space-y-2'>
              <Label className='text-sm font-medium'>
                {t('genome.build_index_optional')}
              </Label>
              <div className='grid grid-cols-1 gap-2'>
                {INDEX_TOOLS.map((tool) => (
                  <label
                    key={tool.key}
                    htmlFor={`index-${tool.field}`}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      selectedIndexes.includes(tool.field)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <Checkbox
                      id={`index-${tool.field}`}
                      checked={selectedIndexes.includes(tool.field)}
                      onCheckedChange={() => toggleIndex(tool.field)}
                      disabled={downloadMutation.isPending}
                    />
                    <div className='flex-1'>
                      <div className='text-sm font-medium'>{tool.label}</div>
                      <div className='text-xs text-muted-foreground'>
                        {t(tool.descKey as Parameters<typeof t>[0])}
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
            <Button onClick={handleClose}>{t('cancel')}</Button>
          ) : (
            <>
              <Button
                variant='outline'
                onClick={handleClose}
                disabled={downloadMutation.isPending}
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid || downloadMutation.isPending}
              >
                <Download className='size-4 mr-1.5' />
                {downloadMutation.isPending
                  ? t('genome.querying_ncbi')
                  : t('genome.start_download')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
