'use client'

import {
  CaseSensitiveIcon,
  ChevronRightIcon,
  CodeIcon,
  DatabaseIcon,
  DnaIcon,
  FileInputIcon,
  PenToolIcon,
  StickyNoteIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type React from 'react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { DbMenu } from '@/components/node-editor/menu/db-menu'
import { ToolMenu } from '@/components/node-editor/menu/tool-menu'
import { cn } from '@/lib/utils'

type SubMenuType = 'inline' | 'tool-modal' | 'db-modal'

interface MenuItem {
  type: string
  labelKey: string
  Icon: React.ElementType
  subItems?: MenuItem[]
}

interface MenuGroup {
  labelKey: string
  Icon: React.ElementType
  submenuType: SubMenuType
  items: MenuItem[]
}

const menuData: Record<string, MenuGroup> = {
  analysis: {
    labelKey: 'analysis_tools',
    Icon: PenToolIcon,
    submenuType: 'tool-modal',
    items: [],
  },
  io: {
    labelKey: 'io',
    Icon: FileInputIcon,
    submenuType: 'inline',
    items: [
      { type: 'value_string', labelKey: 'text_input', Icon: CaseSensitiveIcon },
      { type: 'resource_file', labelKey: 'file_input', Icon: FileInputIcon },
      { type: 'resource_sequence', labelKey: 'sequence_input', Icon: DnaIcon },
      { type: 'resource_db', labelKey: 'database', Icon: DatabaseIcon },
      {
        type: '__genome_submenu__',
        labelKey: 'reference_genome',
        Icon: DatabaseIcon,
        subItems: [
          { type: 'resource_ncbi_genome', labelKey: 'ncbi_genome', Icon: DatabaseIcon },
          { type: 'resource_GRCh38', labelKey: 'grch38', Icon: DatabaseIcon },
          { type: 'resource_GRCm39', labelKey: 'grcm39', Icon: DatabaseIcon },
        ],
      },
    ],
  },
  programming: {
    labelKey: 'programming',
    Icon: CodeIcon,
    submenuType: 'inline',
    items: [
      { type: 'code_R', labelKey: 'r_code', Icon: CodeIcon },
      { type: 'code_python', labelKey: 'python_code', Icon: CodeIcon },
    ],
  },
  other: {
    labelKey: 'other',
    Icon: StickyNoteIcon,
    submenuType: 'inline',
    items: [{ type: 'note', labelKey: 'note', Icon: StickyNoteIcon }],
  },
}

interface Position {
  x: number
  y: number
}

interface PanelMenuProps {
  isOpen: boolean
  position: Position
  onClose: () => void
  onSelectTool: (
    toolType: string,
    toolUid?: string,
    resourceName?: string,
  ) => void
}

export const PanelMenu: React.FC<PanelMenuProps> = ({
  isOpen,
  position,
  onClose,
  onSelectTool,
}) => {
  const t = useTranslations('editor.menu')
  const [isAnalysisMenuOpen, setIsAnalysisMenuOpen] = useState(false)
  const [isDBMenuOpen, setIsDBMenuOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [activeSubItem, setActiveSubItem] = useState<string | null>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)
  const menuRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const subCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimerRef.current = setTimeout(() => setActiveMenu(null), 150)
  }, [cancelClose])

  const cancelSubClose = useCallback(() => {
    if (subCloseTimerRef.current) {
      clearTimeout(subCloseTimerRef.current)
      subCloseTimerRef.current = null
    }
  }, [])

  const scheduleSubClose = useCallback(() => {
    cancelSubClose()
    subCloseTimerRef.current = setTimeout(() => setActiveSubItem(null), 150)
  }, [cancelSubClose])

  // Fix position after mount so menuRef has real dimensions
  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current) return
    const { width, height } = menuRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    setAdjustedPosition({
      x: position.x + width > vw ? vw - width - 10 : position.x,
      y: position.y + height > vh ? vh - height - 10 : position.y,
    })
  }, [isOpen, position])

  // Click-outside to close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, onClose])

  // Reset submenu state when parent closes
  useEffect(() => {
    if (!isOpen) {
      setActiveMenu(null)
      setActiveSubItem(null)
    }
  }, [isOpen])

  const handleItemClick = (key: string, itemType?: string) => {
    const group = menuData[key]
    if (itemType) {
      if (itemType === 'resource_db') {
        setIsDBMenuOpen(true)
        onClose()
      } else if (itemType !== '__genome_submenu__') {
        onSelectTool(itemType)
        onClose()
      }
    } else {
      if (group.submenuType === 'tool-modal') {
        setIsAnalysisMenuOpen(true)
        onClose()
      }
    }
  }

  if (!isOpen && !isAnalysisMenuOpen && !isDBMenuOpen) return null

  return (
    <>
      {isOpen && (
        <div
          ref={menuRef}
          className='fixed z-50 bg-popover text-popover-foreground rounded-lg shadow-lg border overflow-visible min-w-[200px] animate-in fade-in zoom-in-95'
          style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
          role='menu'
          tabIndex={-1}
          onMouseLeave={scheduleClose}
          onMouseEnter={cancelClose}
        >
          <div className='py-1'>
            {Object.entries(menuData).map(([key, group]) => {
              const GroupIcon = group.Icon
              const hasInlineSubmenu =
                group.submenuType === 'inline' && group.items.length > 0
              return (
                <div key={key} className='relative'>
                  <button
                    type='button'
                    onClick={() => handleItemClick(key)}
                    onMouseEnter={() => {
                      setActiveMenu(key)
                      setActiveSubItem(null)
                    }}
                    onFocus={() => setActiveMenu(key)}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center justify-between transition-colors',
                      activeMenu === key && 'bg-accent/50',
                    )}
                  >
                    <span className='flex items-center'>
                      <GroupIcon className='h-4 w-4 mr-2' />
                      {t(group.labelKey)}
                    </span>
                    {hasInlineSubmenu && (
                      <ChevronRightIcon className='h-4 w-4' />
                    )}
                  </button>

                  {hasInlineSubmenu && activeMenu === key && (
                    <div
                      role='menu'
                      className='absolute left-full top-0 bg-popover text-popover-foreground border rounded-lg shadow-lg py-1 min-w-[200px] z-[100] animate-in fade-in slide-in-from-left-1'
                      onMouseEnter={cancelClose}
                      onMouseLeave={scheduleClose}
                    >
                      {group.items.map((item) => {
                        const ItemIcon = item.Icon
                        const hasSubItems = !!item.subItems?.length
                        return (
                          <div key={item.type} className='relative'>
                            <button
                              type='button'
                              onClick={() => handleItemClick(key, item.type)}
                              onMouseEnter={() => {
                                cancelSubClose()
                                setActiveSubItem(hasSubItems ? item.type : null)
                              }}
                              onMouseLeave={() => {
                                if (hasSubItems) scheduleSubClose()
                              }}
                              className={cn(
                                'w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center justify-between transition-colors',
                                activeSubItem === item.type && 'bg-accent/50',
                              )}
                            >
                              <span className='flex items-center'>
                                <ItemIcon className='h-4 w-4 mr-2' />
                                {t(item.labelKey)}
                              </span>
                              {hasSubItems && <ChevronRightIcon className='h-4 w-4' />}
                            </button>

                            {hasSubItems && activeSubItem === item.type && (
                              <div
                                role='menu'
                                className='absolute left-full top-0 bg-popover text-popover-foreground border rounded-lg shadow-lg py-1 min-w-[200px] z-[110] animate-in fade-in slide-in-from-left-1'
                                onMouseEnter={cancelSubClose}
                                onMouseLeave={scheduleSubClose}
                              >
                                {item.subItems!.map((sub) => {
                                  const SubIcon = sub.Icon
                                  return (
                                    <button
                                      key={sub.type}
                                      type='button'
                                      onClick={() => handleItemClick(key, sub.type)}
                                      className='w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center transition-colors'
                                    >
                                      <SubIcon className='h-4 w-4 mr-2' />
                                      {t(sub.labelKey)}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <ToolMenu
        isOpen={isAnalysisMenuOpen}
        onClose={() => setIsAnalysisMenuOpen(false)}
        onSelectTool={onSelectTool}
      />

      <DbMenu
        isOpen={isDBMenuOpen}
        onOpenChange={setIsDBMenuOpen}
        onSelectDb={onSelectTool}
      />
    </>
  )
}
