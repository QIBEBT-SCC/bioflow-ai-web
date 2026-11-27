import {
  BarChart3Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileJsonIcon,
  FileTextIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { memo, useCallback, useMemo, useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  FileTree,
  FileTreeFile,
  FileTreeFolder,
} from '@/components/ui/file-tree'
import { RunStatusBadge } from '@/components/workflow/run-status'
import {
  getWorkflowRunDisplayStatus,
  RUN_STATUS_APPEARANCE,
} from '@/lib/status'
import type { RunFileNode } from '@/types/run'
import type { WorkflowRunV2 } from '@/types/workflow-v2'

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
  run: WorkflowRunV2 | null
  runFiles?: RunFileNode[]
  selectedFile?: string
  onSelectFile: (path: string) => void
  onRefreshFiles: () => void
  filesRefreshing: boolean
  isOpen: boolean
  width: number
  onToggle: () => void
  onResizeStart: (e: React.MouseEvent) => void
}

const DEFAULT_EXPANDED_PATHS = new Set(['results', 'logs', 'reports'])

export const RunLeftPanel = memo(function RunLeftPanel({
  run,
  runFiles,
  selectedFile,
  onSelectFile,
  onRefreshFiles,
  filesRefreshing,
  isOpen,
  width,
  onToggle,
  onResizeStart,
}: RunLeftPanelProps) {
  const t = useTranslations('Project.runDetail.leftPanel')
  const tRunStatus = useTranslations('workflowMonitor.status')
  const [statsOpen, setStatsOpen] = useState(true)
  const filePaths = useMemo(() => collectFilePaths(runFiles ?? []), [runFiles])
  const handleSelect = useCallback(
    (path: string) => {
      if (filePaths.has(path)) onSelectFile(path)
    },
    [filePaths, onSelectFile],
  )
  const treeNodes = useMemo(
    () => (runFiles ?? []).map(renderOutputNode),
    [runFiles],
  )

  const displayStatus = run ? getWorkflowRunDisplayStatus(run) : null

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
                {displayStatus ? (
                  <RunStatusBadge
                    status={displayStatus}
                    label={tRunStatus(
                      RUN_STATUS_APPEARANCE[displayStatus].labelKey,
                    )}
                  />
                ) : (
                  <span className='font-medium'>--</span>
                )}
              </div>
              {[
                {
                  label: t('totalTasks'),
                  value: run?.node_statistics.total ?? '--',
                },
                {
                  label: t('runningTasks'),
                  value: run?.node_statistics.running ?? '--',
                },
                {
                  label: t('successTasks'),
                  value: run?.node_statistics.succeeded ?? '--',
                },
                {
                  label: t('failedTasks'),
                  value: run?.node_statistics.failed ?? '--',
                },
                {
                  label: t('blockedTasks'),
                  value: run?.node_statistics.blocked ?? '--',
                },
                {
                  label: t('readyQueued'),
                  value: run
                    ? `${run.node_statistics.ready} / ${run.node_statistics.queued}`
                    : '--',
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
            <button
              type='button'
              onClick={onRefreshFiles}
              disabled={filesRefreshing}
              aria-label={t('refreshFiles')}
              title={t('refreshFiles')}
              className='ml-auto rounded p-1 hover:bg-muted disabled:opacity-50'
            >
              <RefreshCwIcon
                className={`size-4 ${filesRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
          <div className='p-2'>
            <FileTree
              defaultExpanded={DEFAULT_EXPANDED_PATHS}
              selectedPath={selectedFile}
              onSelect={handleSelect}
            >
              {treeNodes}
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
})
