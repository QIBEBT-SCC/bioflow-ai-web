'use client'

import { useTranslations } from 'next-intl'
import type React from 'react'
import { useState } from 'react'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Skeleton } from '@/components/ui/skeleton'
import { useSearchTools } from '@/hooks/use-tool'
import type { SimpleToolInfo } from '@/types/tool'

interface ToolMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelectTool: (toolType: string, toolUid: string) => void
}

const ToolSkeleton = () => (
  <div className='p-3'>
    <Skeleton className='h-4 w-3/4 mb-2' />
    <Skeleton className='h-3 w-full' />
  </div>
)

export const ToolMenu: React.FC<ToolMenuProps> = ({
  isOpen,
  onClose,
  onSelectTool,
}) => {
  const t = useTranslations('editor.menu')
  const [query, setQuery] = useState('')

  const trimmedQuery = query.trim()
  const hasQuery = trimmedQuery !== ''
  const { data: searchPage, isLoading } = useSearchTools(trimmedQuery, 0, 20)
  const searchResults = searchPage?.data ?? []
  const searchTotal = searchPage?.total ?? 0

  const handleToolSelect = (tool: SimpleToolInfo) => {
    onSelectTool('tool', String(tool.uid))
    setQuery('')
    onClose()
  }

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={t('select_tool')}
      description={t('search_tools')}
      className='top-[8vh] sm:max-w-2xl'
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder={t('search_tools')}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className='max-h-[60vh]'>
          <CommandEmpty>
            {hasQuery ? t('no_tools_found') : t('enter_tool_keywords')}
          </CommandEmpty>

          {hasQuery &&
            (isLoading ? (
              <CommandGroup heading={t('searching')}>
                {['ts1', 'ts2', 'ts3'].map((id) => (
                  <ToolSkeleton key={id} />
                ))}
              </CommandGroup>
            ) : (
              searchResults.length > 0 && (
                <CommandGroup
                  heading={t('search_results_count', { count: searchTotal })}
                >
                  {searchResults.map((tool) => (
                    <CommandItem
                      key={tool.uid}
                      value={String(tool.uid)}
                      onSelect={() => handleToolSelect(tool)}
                      className='cursor-pointer'
                    >
                      <div className='flex flex-col w-full min-w-0'>
                        <span className='font-medium'>{tool.name}</span>
                        {tool.description && (
                          <span className='text-xs text-muted-foreground line-clamp-2'>
                            {tool.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
