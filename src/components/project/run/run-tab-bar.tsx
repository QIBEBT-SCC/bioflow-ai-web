import { FileText, Workflow, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export const CANVAS_TAB_ID = '__canvas__'

export type FileType = 'text' | 'json' | 'html' | 'image' | 'pdf' | 'unknown'

export interface FileTab {
  id: string
  path: string
  name: string
  fileType: FileType
  content?: string // text / html
  blobUrl?: string // image / pdf
  loading?: boolean
  error?: string
}

interface RunTabBarProps {
  activeTabId: string
  openTabs: FileTab[]
  onTabSelect: (id: string) => void
  onTabClose: (id: string) => void
}

export function RunTabBar({
  activeTabId,
  openTabs,
  onTabSelect,
  onTabClose,
}: RunTabBarProps) {
  const t = useTranslations('Project.runDetail.tabs')
  const isCanvasActive = activeTabId === CANVAS_TAB_ID

  return (
    <div className='flex h-9 shrink-0 items-end overflow-x-auto border-b bg-muted/30 px-2 gap-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
      {/* 工作流 tab（不可关闭） */}
      <button
        type='button'
        onClick={() => onTabSelect(CANVAS_TAB_ID)}
        className={cn(
          'flex h-8 items-center gap-1.5 rounded-t-md px-3 text-xs transition-colors shrink-0',
          isCanvasActive
            ? 'border border-b-background bg-background -mb-px'
            : 'text-muted-foreground hover:bg-muted/60',
        )}
      >
        <Workflow className='size-3.5' />
        <span>{t('workflow')}</span>
      </button>

      {/* 文件选项卡 */}
      {openTabs.map((tab) => {
        const isActive = activeTabId === tab.id
        return (
          <div
            key={tab.id}
            className={cn(
              'group flex h-8 items-center gap-1 rounded-t-md px-2.5 text-xs transition-colors shrink-0 max-w-[180px]',
              isActive
                ? 'border border-b-background bg-background -mb-px'
                : 'text-muted-foreground hover:bg-muted/60',
            )}
          >
            <button
              type='button'
              onClick={() => onTabSelect(tab.id)}
              className='flex min-w-0 items-center gap-1.5'
            >
              <FileText className='size-3.5 shrink-0' />
              <span className='max-w-[120px] truncate'>{tab.name}</span>
            </button>
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation()
                onTabClose(tab.id)
              }}
              className={cn(
                'ml-0.5 shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted',
                isActive && 'opacity-60 hover:opacity-100',
              )}
            >
              <X className='size-3' />
            </button>
          </div>
        )
      })}
    </div>
  )
}
