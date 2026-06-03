import {
  BarChart3Icon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  FileJsonIcon,
  FileTextIcon,
  Loader2Icon,
  XCircleIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { useState } from 'react'
import {
  FileTree,
  FileTreeFile,
  FileTreeFolder,
} from '@/components/ai-elements/file-tree'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { type RunFileNode, type RunPublic, Status } from '@/types/run'

const statusConfig = {
  [Status.WAITING]: {
    labelKey: 'waiting',
    variant: 'secondary' as const,
    icon: ClockIcon,
  },
  [Status.RUNNING]: {
    labelKey: 'running',
    variant: 'default' as const,
    icon: Loader2Icon,
  },
  [Status.ERROR]: {
    labelKey: 'failed',
    variant: 'destructive' as const,
    icon: XCircleIcon,
  },
  [Status.SUCCESS]: {
    labelKey: 'success',
    variant: 'outline' as const,
    icon: CheckCircle2Icon,
  },
} as const

function collectFilePaths(
  nodes: RunFileNode[],
  result = new Set<string>(),
): Set<string> {
  for (const node of nodes) {
    if (node.type === 'file') {
      result.add(node.path)
    } else {
      collectFilePaths(node.children, result)
    }
  }
  return result
}

function renderOutputNode(node: RunFileNode) {
  if (node.type === 'folder') {
    return (
      <FileTreeFolder key={node.path} path={node.path} name={node.name}>
        {node.children.map(renderOutputNode)}
      </FileTreeFolder>
    )
  }
  return (
    <FileTreeFile
      key={node.path}
      path={node.path}
      name={node.name}
      icon={
        node.iconType === 'json' ? (
          <FileJsonIcon className='size-4 text-yellow-500' />
        ) : undefined
      }
    />
  )
}

interface RunLeftPanelProps {
  run: RunPublic | null
  runFiles?: RunFileNode[]
  selectedFile?: string
  onSelectFile: (path: string) => void
  isOpen: boolean
  width: number
  onToggle: () => void
  onResizeStart: (e: React.MouseEvent) => void
}

export function RunLeftPanel({
  run,
  runFiles,
  selectedFile,
  onSelectFile,
  isOpen,
  width,
  onToggle,
  onResizeStart,
}: RunLeftPanelProps) {
  const t = useTranslations('Project.runDetail.leftPanel')
  const tStatus = useTranslations('Project.workflow.status')
  const [statsOpen, setStatsOpen] = useState(true)
  const filePaths = collectFilePaths(runFiles ?? [])

  const Icon = statusConfig[run?.status ?? Status.WAITING].icon

  return (
    <div className='flex shrink-0'>
      {/* 面板内容 */}
      <div
        className={`flex flex-col overflow-y-auto bg-background overflow-hidden ${isOpen ? 'opacity-100' : 'w-0 opacity-0'}`}
        style={isOpen ? { width } : undefined}
      >
        {/* 可折叠区块：运行统计 */}
        <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
          <CollapsibleTrigger className='flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 border-b'>
            <div className='flex items-center gap-2'>
              <BarChart3Icon className='size-4 text-muted-foreground' />
              {t('statistics')}
            </div>
            <ChevronDownIcon
              className={`size-4 text-muted-foreground transition-transform ${statsOpen ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className='px-4 py-3 space-y-2 border-b bg-muted/20'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>{t('status')}</span>
                {run ? (
                  <Badge variant={statusConfig[run.status].variant}>
                    <Icon
                      className={`size-3 ${run.status === Status.RUNNING ? 'animate-spin' : ''}`}
                    />
                    {tStatus(statusConfig[run.status].labelKey)}
                  </Badge>
                ) : (
                  <span className='font-medium'>--</span>
                )}
              </div>
              {[
                {
                  label: t('totalTasks'),
                  value: run?.task_statistics?.total ?? '--',
                },
                {
                  label: t('successTasks'),
                  value: run?.task_statistics?.success ?? '--',
                },
                {
                  label: t('failedTasks'),
                  value: run?.task_statistics?.error ?? '--',
                },
              ].map(({ label, value }) => (
                <div key={label} className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>{label}</span>
                  <span className='font-medium'>{value}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* 输出文件树 */}
        <div className='flex-1 overflow-y-auto'>
          <div className='px-4 py-3 text-sm font-medium border-b flex items-center gap-2 sticky top-0 bg-background'>
            <FileTextIcon className='size-4 text-muted-foreground' />
            {t('outputFiles')}
          </div>
          <div className='p-2'>
            <FileTree
              defaultExpanded={new Set(['results', 'logs', 'reports'])}
              selectedPath={selectedFile}
              onSelect={
                ((path: unknown) => {
                  if (typeof path === 'string' && filePaths.has(path))
                    onSelectFile(path)
                }) as never
              }
              className='border-0 rounded-none'
            >
              {(runFiles ?? []).map(renderOutputNode)}
            </FileTree>
          </div>
        </div>
      </div>

      {/* VSCode 式折叠把手 / 拖拽调宽把手 */}
      <button
        type='button'
        onClick={onToggle}
        onMouseDown={onResizeStart}
        className='w-4 shrink-0 border-r flex items-center justify-center hover:bg-muted/60 transition-colors bg-background group relative cursor-col-resize'
        title={isOpen ? t('resizeOrCollapse') : t('expandPanel')}
      >
        <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
          {isOpen ? (
            <ChevronLeftIcon className='size-3 text-muted-foreground' />
          ) : (
            <ChevronRightIcon className='size-3 text-muted-foreground' />
          )}
        </div>
      </button>
    </div>
  )
}
