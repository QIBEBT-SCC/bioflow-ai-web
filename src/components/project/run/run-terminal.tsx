import { ChevronDownIcon } from 'lucide-react'
import { Terminal, TerminalContent } from '@/components/ai-elements/terminal'

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
  return (
    <div className='shrink-0 border-t'>
      {/* 拖拽调整把手 */}
      {isOpen && (
        <hr
          aria-orientation='horizontal'
          aria-label='拖拽调整终端高度'
          tabIndex={0}
          onMouseDown={onResizeStart}
          className='h-1 w-full cursor-row-resize border-none bg-zinc-800 hover:bg-blue-500 transition-colors'
          title='拖拽调整终端高度'
        />
      )}
      {/* 终端标题栏：点击展开/收起 */}
      <button
        type='button'
        onClick={onToggle}
        className='flex w-full items-center justify-between px-3 py-1 bg-zinc-900 hover:bg-zinc-800 transition-colors group'
        title={isOpen ? '收起终端' : '展开终端'}
      >
        <span className='text-xs text-zinc-400 font-mono flex items-center gap-1.5'>
          终端
        </span>
        <ChevronDownIcon
          className={`h-3 w-3 text-zinc-500 transition-transform duration-200 ${isOpen ? '' : 'rotate-180'}`}
        />
      </button>
      <div
        className={`overflow-hidden ${isOpen ? '' : 'h-0'}`}
        style={isOpen ? { height } : undefined}
      >
        <Terminal
          output={logContent}
          isStreaming={isStreaming}
          className='rounded-none border-0'
          style={{ height }}
        >
          <TerminalContent className='max-h-full' />
        </Terminal>
      </div>
    </div>
  )
}
