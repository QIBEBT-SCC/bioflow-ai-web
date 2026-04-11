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
    label: '等待中',
    variant: 'secondary' as const,
    icon: ClockIcon,
  },
  [Status.RUNNING]: {
    label: '运行中',
    variant: 'default' as const,
    icon: Loader2Icon,
  },
  [Status.ERROR]: {
    label: '失败',
    variant: 'destructive' as const,
    icon: XCircleIcon,
  },
  [Status.SUCCESS]: {
    label: '成功',
    variant: 'outline' as const,
    icon: CheckCircle2Icon,
  },
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
  onToggle: () => void
}

export function RunLeftPanel({
  run,
  runFiles,
  selectedFile,
  onSelectFile,
  isOpen,
  onToggle,
}: RunLeftPanelProps) {
  const [statsOpen, setStatsOpen] = useState(true)

  const Icon = statusConfig[run?.status ?? Status.WAITING].icon

  return (
    <div className='flex shrink-0'>
      {/* 面板内容 */}
      <div
        className={`flex flex-col overflow-y-auto bg-background transition-all duration-200 ${isOpen ? 'w-72 opacity-100' : 'w-0 opacity-0'} overflow-hidden`}
      >
        {/* 可折叠区块：运行统计 */}
        <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
          <CollapsibleTrigger className='flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 border-b'>
            <div className='flex items-center gap-2'>
              <BarChart3Icon className='h-4 w-4 text-muted-foreground' />
              运行统计
            </div>
            <ChevronDownIcon
              className={`h-4 w-4 text-muted-foreground transition-transform ${statsOpen ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className='px-4 py-3 space-y-2 border-b bg-muted/20'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>运行状态</span>
                {run ? (
                  <Badge variant={statusConfig[run.status].variant}>
                    <Icon
                      className={`h-3 w-3 ${run.status === Status.RUNNING ? 'animate-spin' : ''}`}
                    />
                    {statusConfig[run.status].label}
                  </Badge>
                ) : (
                  <span className='font-medium'>--</span>
                )}
              </div>
              {[
                {
                  label: '总任务数',
                  value: run?.task_statistics?.total ?? '--',
                },
                {
                  label: '成功任务',
                  value: run?.task_statistics?.success ?? '--',
                },
                {
                  label: '失败任务',
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
            <FileTextIcon className='h-4 w-4 text-muted-foreground' />
            输出文件
          </div>
          <div className='p-2'>
            <FileTree
              defaultExpanded={new Set(['results', 'logs', 'reports'])}
              selectedPath={selectedFile}
              // biome-ignore lint/suspicious/noExplicitAny: FileTree.onSelect conflicts with HTMLAttributes.onSelect
              onSelect={((path: string) => onSelectFile(path)) as any}
              className='border-0 rounded-none'
            >
              {(runFiles ?? []).map(renderOutputNode)}
            </FileTree>
          </div>
        </div>
      </div>

      {/* VSCode 式折叠把手 */}
      <button
        type='button'
        onClick={onToggle}
        className='w-4 shrink-0 border-r flex items-center justify-center hover:bg-muted/60 transition-colors bg-background group relative'
        title={isOpen ? '收起面板' : '展开面板'}
      >
        <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
          {isOpen ? (
            <ChevronLeftIcon className='h-3 w-3 text-muted-foreground' />
          ) : (
            <ChevronRightIcon className='h-3 w-3 text-muted-foreground' />
          )}
        </div>
      </button>
    </div>
  )
}
