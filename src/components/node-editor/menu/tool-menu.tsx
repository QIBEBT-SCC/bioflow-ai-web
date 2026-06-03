'use client'

import { SearchIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useSearchTools } from '@/hooks/use-tool'
import type { SimpleToolInfo } from '@/types/tool'

interface ToolMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelectTool: (toolType: string, toolUid: string) => void
}

const ToolSkeleton = () => (
  <div className='p-3 border rounded-lg animate-pulse'>
    <Skeleton className='h-5 w-3/4 mb-2' />
    <Skeleton className='h-4 w-full mb-1' />
    <Skeleton className='h-4 w-2/3' />
  </div>
)

export const ToolMenu: React.FC<ToolMenuProps> = ({
  isOpen,
  onClose,
  onSelectTool,
}) => {
  const t = useTranslations('editor.menu')
  const [searchQuery, setSearchQuery] = useState('')
  const isSearchMode = searchQuery.trim() !== ''

  const { data: searchPage, isLoading: searchLoading } = useSearchTools(
    searchQuery.trim(),
    0,
    20,
  )
  const searchResults = searchPage?.data ?? []

  const handleToolSelect = (tool: SimpleToolInfo) => {
    onSelectTool('tool', String(tool.uid))
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[8vh] animate-in fade-in'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in zoom-in-95'>
        <div className='p-4 border-b flex justify-between items-center shrink-0'>
          <h2 className='text-xl font-semibold'>{t('select_tool')}</h2>
          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='rounded-full'
          >
            <XIcon className='size-5' />
          </Button>
        </div>

        <div className='p-4 border-b shrink-0'>
          <div className='relative'>
            <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-5' />
            <Input
              type='text'
              placeholder={t('search_tools')}
              className='pl-10 pr-10'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant='ghost'
                size='icon'
                className='absolute right-1 top-1/2 transform -translate-y-1/2 size-8'
                onClick={() => setSearchQuery('')}
              >
                <XIcon className='size-4' />
              </Button>
            )}
          </div>
        </div>

        <div className='min-h-0 max-h-[calc(85vh-137px)] overflow-y-auto p-4'>
          {isSearchMode ? (
            <div>
              <h3 className='text-lg font-medium mb-4'>
                {t('search_results_for', { query: searchQuery })}
              </h3>
              {searchLoading ? (
                <div className='space-y-3'>
                  {['ts1', 'ts2', 'ts3'].map((id) => (
                    <ToolSkeleton key={id} />
                  ))}
                </div>
              ) : searchResults.length > 0 ? (
                <div className='grid gap-3'>
                  {searchResults.map((tool) => (
                    <button
                      type='button'
                      key={tool.uid}
                      className='p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-left w-full'
                      onClick={() => handleToolSelect(tool)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleToolSelect(tool)
                        }
                      }}
                    >
                      <div className='font-medium mb-1'>{tool.name}</div>
                      <div className='text-sm text-gray-600 mb-2'>
                        {tool.description}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8 text-gray-500'>
                  {t('no_tools_found')}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className='text-lg font-medium mb-4'>{t('search_prompt')}</h3>
              <div className='grid gap-3 animate-in fade-in-50'>
                <ToolSkeleton />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
