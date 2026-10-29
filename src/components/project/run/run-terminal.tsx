import { ChevronDownIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LogViewer } from '@/components/workflow/log-viewer'

interface RunTerminalProps {
  logContent: string
  isStreaming: boolean
  isOpen: boolean
  onToggle: () => void
  height: number
  onResizeStart: (e: React.MouseEvent) => void
}

export function RunTerminal({
  logContent,
  isStreaming,
  isOpen,
  onToggle,
  height,
  onResizeStart,
}: RunTerminalProps) {
  const t = useTranslations('Project.runDetail.terminal')

  return (
    <div className='dark shrink-0 border-t'>
      {/* 拖拽调整把手 */}
      {isOpen && (
        <button
          type='button'
          aria-label={t('resizeHeight')}
          onMouseDown={onResizeStart}
          className='block h-1 w-full cursor-row-resize border-none bg-border p-0 transition-colors hover:bg-primary'
          title={t('resizeHeight')}
        />
      )}
      {/* 终端标题栏：点击展开/收起 */}
      <button
        type='button'
        onClick={onToggle}
        className='flex w-full items-center justify-between px-3 py-1 bg-muted hover:bg-accent transition-colors group'
        title={isOpen ? t('collapse') : t('expand')}
      >
        <span className='text-xs text-muted-foreground font-mono flex items-center gap-1.5'>
          {t('title')}
        </span>
        <ChevronDownIcon
          className={`size-3 text-muted-foreground transition-transform duration-200 ${isOpen ? '' : 'rotate-180'}`}
        />
      </button>
      <div
        className={`overflow-hidden ${isOpen ? '' : 'h-0'}`}
        style={isOpen ? { height } : undefined}
      >
        <LogViewer
          content={logContent}
          streaming={isStreaming}
          autoScroll
          className='rounded-none border-0'
          contentClassName='max-h-none flex-1'
          style={{ height }}
        />
      </div>
    </div>
  )
}
