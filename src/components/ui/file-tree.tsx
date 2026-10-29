'use client'

import { ChevronRightIcon, FileIcon, FolderIcon } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import { createContext, use, useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface FileTreeContextType {
  expandedPaths: Set<string>
  togglePath: (path: string) => void
  selectedPath?: string
  onSelect?: (path: string) => void
}

const FileTreeContext = createContext<FileTreeContextType>({
  expandedPaths: new Set(),
  togglePath: () => {},
})

export type FileTreeProps = Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> & {
  expanded?: Set<string>
  defaultExpanded?: Set<string>
  selectedPath?: string
  onSelect?: (path: string) => void
  onExpandedChange?: (expanded: Set<string>) => void
}

export const FileTree = ({
  expanded: controlledExpanded,
  defaultExpanded,
  selectedPath,
  onSelect,
  onExpandedChange,
  className,
  children,
  ...props
}: FileTreeProps) => {
  const [internalExpanded, setInternalExpanded] = useState(
    () => defaultExpanded ?? new Set<string>(),
  )
  const expandedPaths = controlledExpanded ?? internalExpanded

  const togglePath = useCallback(
    (path: string) => {
      const next = new Set(expandedPaths)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      setInternalExpanded(next)
      onExpandedChange?.(next)
    },
    [expandedPaths, onExpandedChange],
  )

  const contextValue = useMemo(
    () => ({ expandedPaths, onSelect, selectedPath, togglePath }),
    [expandedPaths, onSelect, selectedPath, togglePath],
  )

  return (
    <FileTreeContext value={contextValue}>
      <TooltipProvider delayDuration={500}>
        <div className={cn('flex flex-col text-sm', className)} {...props}>
          {children}
        </div>
      </TooltipProvider>
    </FileTreeContext>
  )
}

export type FileTreeIconProps = HTMLAttributes<HTMLSpanElement>

export const FileTreeIcon = ({
  className,
  children,
  ...props
}: FileTreeIconProps) => (
  <span
    className={cn('flex shrink-0 text-muted-foreground', className)}
    {...props}
  >
    {children}
  </span>
)

export type FileTreeNameProps = HTMLAttributes<HTMLSpanElement>

export const FileTreeName = ({
  className,
  children,
  ...props
}: FileTreeNameProps) => (
  <span className={cn('min-w-0 truncate', className)} {...props}>
    {children}
  </span>
)

const rowClassName = 'h-7 w-full min-w-0 justify-start gap-1.5 px-2 font-normal'

export type FileTreeFolderProps = HTMLAttributes<HTMLDivElement> & {
  path: string
  name: string
}

export const FileTreeFolder = ({
  path,
  name,
  className,
  children,
  ...props
}: FileTreeFolderProps) => {
  const { expandedPaths, togglePath } = use(FileTreeContext)

  return (
    <Collapsible
      open={expandedPaths.has(path)}
      onOpenChange={() => togglePath(path)}
      className={cn('group/folder', className)}
      {...props}
    >
      <CollapsibleTrigger asChild>
        <Button variant='ghost' size='sm' className={rowClassName}>
          <ChevronRightIcon className='text-muted-foreground transition-transform group-data-[state=open]/folder:rotate-90' />
          <FileTreeIcon>
            <FolderIcon />
          </FileTreeIcon>
          <FileTreeName>{name}</FileTreeName>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className='ml-3.5 flex flex-col border-l pl-1.5'>{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export type FileTreeFileProps = HTMLAttributes<HTMLDivElement> & {
  path: string
  name: string
  icon?: ReactNode
}

export const FileTreeFile = ({
  path,
  name,
  icon,
  className,
  children,
  ...props
}: FileTreeFileProps) => {
  const { selectedPath, onSelect } = use(FileTreeContext)
  const isSelected = selectedPath === path

  return (
    <div className={cn('flex min-w-0 items-center', className)} {...props}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            aria-current={isSelected ? 'true' : undefined}
            className={cn(
              rowClassName,
              'flex-1',
              isSelected && 'bg-accent text-accent-foreground',
            )}
            onClick={() => onSelect?.(path)}
          >
            {/* Spacer for the folder chevron */}
            <span className='size-4 shrink-0' />
            <FileTreeIcon>{icon ?? <FileIcon />}</FileTreeIcon>
            <FileTreeName>{name}</FileTreeName>
          </Button>
        </TooltipTrigger>
        <TooltipContent side='right'>{name}</TooltipContent>
      </Tooltip>
      {children}
    </div>
  )
}

export type FileTreeActionsProps = HTMLAttributes<HTMLDivElement>

export const FileTreeActions = ({
  className,
  children,
  ...props
}: FileTreeActionsProps) => (
  <div
    className={cn('ml-auto flex shrink-0 items-center gap-1', className)}
    {...props}
  >
    {children}
  </div>
)
