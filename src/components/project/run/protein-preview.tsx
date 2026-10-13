'use client'

import { Maximize } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useReducer, useRef } from 'react'
import { getRunStructureFormat } from '@/components/project/run/file-type'
import { getRunFileViewUrl } from '@/components/project/run/file-view-url'
import {
  IconTooltipButton,
  PreviewError,
  PreviewFooter,
  PreviewHint,
  PreviewLoading,
  PreviewProgress,
  PreviewStat,
  PreviewSwitch,
  PreviewToolbar,
} from '@/components/project/run/preview-chrome'
import {
  loadProteinText,
  type ProteinErrorCode,
  ProteinPreviewError,
} from '@/components/project/run/protein-data'
import {
  DEFAULT_PROTEIN_OPTIONS,
  type ProteinOptions,
  ProteinScene,
  type ProteinStats,
} from '@/components/project/run/protein-scene'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type ProteinViewState = {
  stats: ProteinStats | null
  options: ProteinOptions
  busy: boolean
  error: ProteinErrorCode | null
  hover: string
  selected: string
}

function updateProteinView(
  state: ProteinViewState,
  updates: Partial<ProteinViewState>,
): ProteinViewState {
  return { ...state, ...updates }
}

export function ProteinPreview({
  runUid,
  generation,
  path,
  active,
}: {
  runUid: string
  generation: number
  path: string
  active: boolean
}) {
  const t = useTranslations('Project.runDetail.proteinPreview')
  const id = useId()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<ProteinScene | null>(null)
  const requestRef = useRef<AbortController | null>(null)
  const activeRef = useRef(active)
  activeRef.current = active
  const [view, updateView] = useReducer(updateProteinView, {
    stats: null,
    options: DEFAULT_PROTEIN_OPTIONS,
    busy: true,
    error: null,
    hover: '',
    selected: '',
  })
  const { stats, options, busy, error, hover, selected } = view
  const url = getRunFileViewUrl(runUid, generation, path)

  useEffect(() => {
    sceneRef.current?.setActive(active)
  }, [active])

  useEffect(() => {
    if (!canvasRef.current || !hostRef.current) return
    const canvas = canvasRef.current
    const host = hostRef.current
    const controller = new AbortController()
    const scene = new ProteinScene()
    sceneRef.current = scene
    requestRef.current = controller
    let closed = false
    const observer = new ResizeObserver(() => scene.resize())
    observer.observe(host)
    const timeout = window.setTimeout(
      () => controller.abort(new ProteinPreviewError('timeout')),
      30_000,
    )
    controller.signal.addEventListener('abort', () => scene.dispose(), {
      once: true,
    })

    async function initialize() {
      updateView({
        busy: true,
        stats: null,
        error: null,
        hover: '',
        selected: '',
      })
      try {
        await scene.init(
          canvas,
          host,
          (label) => {
            if (!closed) updateView({ hover: label })
          },
          (label) => {
            if (!closed) updateView({ selected: label })
          },
        )
        controller.signal.throwIfAborted()
        scene.setActive(activeRef.current)
        const format = getRunStructureFormat(path)
        if (!format) throw new ProteinPreviewError('invalid')
        const text = await loadProteinText(
          url,
          path.toLowerCase().endsWith('.gz'),
          controller.signal,
        )
        await scene.load(text, format, controller.signal)
        const result = await scene.render(
          DEFAULT_PROTEIN_OPTIONS,
          controller.signal,
        )
        if (!closed) {
          updateView({ stats: result, options: DEFAULT_PROTEIN_OPTIONS })
        }
      } catch (caught) {
        if (!closed) {
          const reason = controller.signal.aborted
            ? controller.signal.reason
            : caught
          updateView({
            error:
              reason instanceof ProteinPreviewError
                ? reason.code
                : 'loadFailed',
          })
          scene.dispose()
        }
      } finally {
        window.clearTimeout(timeout)
        if (!closed) updateView({ busy: false })
      }
    }
    void initialize()
    return () => {
      closed = true
      window.clearTimeout(timeout)
      observer.disconnect()
      controller.abort()
      scene.dispose()
      if (sceneRef.current === scene) sceneRef.current = null
    }
  }, [path, url])

  async function changeOptions(updates: Partial<ProteinOptions>) {
    const scene = sceneRef.current
    const controller = requestRef.current
    if (!scene || !controller || controller.signal.aborted || busy) return
    const next = { ...options, ...updates }
    updateView({ busy: true, hover: '', selected: '' })
    try {
      const result = await scene.render(next, controller.signal)
      if (sceneRef.current === scene && !controller.signal.aborted) {
        updateView({ stats: result, options: next })
      }
    } catch (caught) {
      if (sceneRef.current === scene && !controller.signal.aborted) {
        updateView({
          error:
            caught instanceof ProteinPreviewError ? caught.code : 'loadFailed',
        })
      }
    } finally {
      if (sceneRef.current === scene && !controller.signal.aborted)
        updateView({ busy: false })
    }
  }

  const disabled = busy || !stats || !!error
  const modelIndices = Array.from(
    { length: stats?.modelCount ?? 0 },
    (_, index) => String(index),
  )
  return (
    <div className='flex size-full min-h-0 flex-col'>
      <PreviewToolbar>
        {stats && stats.modelCount > 1 && (
          <Select
            value={String(options.modelIndex)}
            disabled={disabled}
            onValueChange={(value) =>
              void changeOptions({ modelIndex: Number(value), chain: '' })
            }
          >
            <SelectTrigger size='sm' className='w-32' aria-label={t('model')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {modelIndices.map((modelIndex) => (
                <SelectItem key={modelIndex} value={modelIndex}>
                  {t('modelNumber', { index: Number(modelIndex) + 1 })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select
          value={options.chain ? `chain:${options.chain}` : 'all'}
          disabled={disabled}
          onValueChange={(value) =>
            void changeOptions({ chain: value === 'all' ? '' : value.slice(6) })
          }
        >
          <SelectTrigger size='sm' className='w-36' aria-label={t('chain')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t('allChains')}</SelectItem>
            {stats?.chains.map((chain) => (
              <SelectItem key={chain.id} value={`chain:${chain.id}`}>
                {t('chainLabel', { chain: chain.label })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={options.representation}
          disabled={disabled}
          onValueChange={(value) =>
            void changeOptions({
              representation: value as ProteinOptions['representation'],
            })
          }
        >
          <SelectTrigger
            size='sm'
            className='w-32'
            aria-label={t('representation')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='cartoon'>{t('cartoon')}</SelectItem>
            <SelectItem value='ball-and-stick'>{t('ballAndStick')}</SelectItem>
          </SelectContent>
        </Select>
        <PreviewSwitch
          id={`${id}-ligands`}
          label={t('ligands')}
          checked={options.ligands}
          disabled={disabled}
          onCheckedChange={(ligands) => void changeOptions({ ligands })}
        />
        <PreviewSwitch
          id={`${id}-water`}
          label={t('water')}
          checked={options.water}
          disabled={disabled}
          onCheckedChange={(water) => void changeOptions({ water })}
        />
        <IconTooltipButton
          label={t('resetCamera')}
          disabled={disabled}
          onClick={() => sceneRef.current?.resetCamera()}
        >
          <Maximize />
        </IconTooltipButton>
        <PreviewHint>{t('hint')}</PreviewHint>
      </PreviewToolbar>
      <div
        ref={hostRef}
        className='relative min-h-0 flex-1 overflow-hidden bg-background'
      >
        <canvas
          ref={canvasRef}
          className='absolute inset-0 size-full'
          aria-label={t('viewport')}
        />
        {busy && !stats && (
          <div className='absolute inset-0 bg-background'>
            <PreviewLoading label={t('loading')} />
          </div>
        )}
        <PreviewProgress active={busy && !!stats} />
        {error && (
          <div className='absolute inset-0 bg-background'>
            <PreviewError title={t('failed')} message={t(`errors.${error}`)} />
          </div>
        )}
        {!error && (hover || selected) && (
          <div className='pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-sm'>
            <span className='font-mono'>{hover || selected}</span>
          </div>
        )}
      </div>
      <PreviewFooter>
        <div className='flex flex-wrap gap-4'>
          {stats && (
            <>
              <PreviewStat
                label={t('atoms')}
                value={stats.atomCount.toLocaleString()}
              />
              <PreviewStat
                label={t('residues')}
                value={stats.residueCount.toLocaleString()}
              />
              <PreviewStat label={t('chains')} value={stats.chains.length} />
            </>
          )}
        </div>
        <span>{t('controls')}</span>
      </PreviewFooter>
    </div>
  )
}
