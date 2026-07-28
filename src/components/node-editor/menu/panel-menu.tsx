'use client'

import { ChevronRightIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type React from 'react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
} from 'react'
import { CodeMenu } from '@/components/node-editor/menu/code-menu'
import { DbMenu } from '@/components/node-editor/menu/db-menu'
import { ToolMenu } from '@/components/node-editor/menu/tool-menu'
import { menuData } from '@/components/node-editor/node-registry'
import { cn } from '@/lib/utils'
import type { CodeInfo } from '@/types/code'

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
  onSelectCode: (code: CodeInfo) => void
}

type MenuState = {
  isAnalysisMenuOpen: boolean
  isCodeMenuOpen: boolean
  isDBMenuOpen: boolean
  activeMenu: string | null
  activeSubItem: string | null
  adjustedPosition: { x: number; y: number }
}
type MenuAction =
  | { type: 'OPEN_ANALYSIS' }
  | { type: 'OPEN_CODE' }
  | { type: 'OPEN_DB' }
  | { type: 'SET_ANALYSIS_OPEN'; open: boolean }
  | { type: 'SET_CODE_OPEN'; open: boolean }
  | { type: 'SET_DB_OPEN'; open: boolean }
  | { type: 'SET_ACTIVE_MENU'; key: string | null }
  | { type: 'SET_ACTIVE_SUB'; key: string | null }
  | { type: 'SET_POSITION'; x: number; y: number }
  | { type: 'RESET_ACTIVE' }

const INITIAL_MENU_STATE: MenuState = {
  isAnalysisMenuOpen: false,
  isCodeMenuOpen: false,
  isDBMenuOpen: false,
  activeMenu: null,
  activeSubItem: null,
  adjustedPosition: { x: 0, y: 0 },
}

function menuReducer(state: MenuState, action: MenuAction): MenuState {
  switch (action.type) {
    case 'OPEN_ANALYSIS':
      return { ...state, isAnalysisMenuOpen: true }
    case 'OPEN_CODE':
      return { ...state, isCodeMenuOpen: true }
    case 'OPEN_DB':
      return { ...state, isDBMenuOpen: true }
    case 'SET_ANALYSIS_OPEN':
      return { ...state, isAnalysisMenuOpen: action.open }
    case 'SET_CODE_OPEN':
      return { ...state, isCodeMenuOpen: action.open }
    case 'SET_DB_OPEN':
      return { ...state, isDBMenuOpen: action.open }
    case 'SET_ACTIVE_MENU':
      return { ...state, activeMenu: action.key }
    case 'SET_ACTIVE_SUB':
      return { ...state, activeSubItem: action.key }
    case 'SET_POSITION':
      return { ...state, adjustedPosition: { x: action.x, y: action.y } }
    case 'RESET_ACTIVE':
      return { ...state, activeMenu: null, activeSubItem: null }
  }
}

export const PanelMenu: React.FC<PanelMenuProps> = ({
  isOpen,
  position,
  onClose,
  onSelectTool,
  onSelectCode,
}) => {
  const t = useTranslations('editor.menu')
  const [
    {
      isAnalysisMenuOpen,
      isCodeMenuOpen,
      isDBMenuOpen,
      activeMenu,
      activeSubItem,
      adjustedPosition,
    },
    dispatch,
  ] = useReducer(menuReducer, INITIAL_MENU_STATE)
  const menuRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const subCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimerRef.current = setTimeout(
      () => dispatch({ type: 'SET_ACTIVE_MENU', key: null }),
      150,
    )
  }, [cancelClose])

  const cancelSubClose = useCallback(() => {
    if (subCloseTimerRef.current) {
      clearTimeout(subCloseTimerRef.current)
      subCloseTimerRef.current = null
    }
  }, [])

  const scheduleSubClose = useCallback(() => {
    cancelSubClose()
    subCloseTimerRef.current = setTimeout(
      () => dispatch({ type: 'SET_ACTIVE_SUB', key: null }),
      150,
    )
  }, [cancelSubClose])

  // Fix position after mount so menuRef has real dimensions
  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current) return
    const { width, height } = menuRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    dispatch({
      type: 'SET_POSITION',
      x: position.x + width > vw ? vw - width - 10 : position.x,
      y: position.y + height > vh ? vh - height - 10 : position.y,
    })
  }, [isOpen, position])

  // Click-outside to close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onCloseRef.current()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  // Reset submenu state when parent closes
  useEffect(() => {
    if (!isOpen) dispatch({ type: 'RESET_ACTIVE' })
  }, [isOpen])

  const handleItemClick = (key: string, itemType?: string) => {
    const group = menuData[key]
    if (itemType) {
      if (itemType === 'resource_db') {
        dispatch({ type: 'OPEN_DB' })
        onClose()
      } else if (itemType === '__existing_code__') {
        dispatch({ type: 'OPEN_CODE' })
        onClose()
      } else if (itemType !== '__genome_submenu__') {
        onSelectTool(itemType)
        onClose()
      }
    } else {
      if (group.submenuType === 'tool-modal') {
        dispatch({ type: 'OPEN_ANALYSIS' })
        onClose()
      }
    }
  }

  if (!isOpen && !isAnalysisMenuOpen && !isCodeMenuOpen && !isDBMenuOpen) {
    return null
  }

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
                      dispatch({ type: 'SET_ACTIVE_MENU', key })
                      dispatch({ type: 'SET_ACTIVE_SUB', key: null })
                    }}
                    onFocus={() => dispatch({ type: 'SET_ACTIVE_MENU', key })}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center justify-between transition-colors',
                      activeMenu === key && 'bg-accent/50',
                    )}
                  >
                    <span className='flex items-center'>
                      <GroupIcon className='size-4 mr-2' />
                      {t(group.labelKey)}
                    </span>
                    {hasInlineSubmenu && (
                      <ChevronRightIcon className='size-4' />
                    )}
                  </button>

                  {hasInlineSubmenu && activeMenu === key && (
                    <div
                      role='menu'
                      tabIndex={-1}
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
                                dispatch({
                                  type: 'SET_ACTIVE_SUB',
                                  key: hasSubItems ? item.type : null,
                                })
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
                                <ItemIcon className='size-4 mr-2' />
                                {t(item.labelKey)}
                              </span>
                              {hasSubItems && (
                                <ChevronRightIcon className='size-4' />
                              )}
                            </button>

                            {hasSubItems && activeSubItem === item.type && (
                              <div
                                role='menu'
                                tabIndex={-1}
                                className='absolute left-full top-0 bg-popover text-popover-foreground border rounded-lg shadow-lg py-1 min-w-[200px] z-[110] animate-in fade-in slide-in-from-left-1'
                                onMouseEnter={cancelSubClose}
                                onMouseLeave={scheduleSubClose}
                              >
                                {item.subItems?.map((sub) => {
                                  const SubIcon = sub.Icon
                                  return (
                                    <button
                                      key={sub.type}
                                      type='button'
                                      onClick={() =>
                                        handleItemClick(key, sub.type)
                                      }
                                      className='w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center transition-colors'
                                    >
                                      <SubIcon className='size-4 mr-2' />
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
        onClose={() => dispatch({ type: 'SET_ANALYSIS_OPEN', open: false })}
        onSelectTool={onSelectTool}
      />

      {isCodeMenuOpen && (
        <CodeMenu
          onClose={() => dispatch({ type: 'SET_CODE_OPEN', open: false })}
          onSelectCode={onSelectCode}
        />
      )}

      <DbMenu
        isOpen={isDBMenuOpen}
        onOpenChange={(open) => dispatch({ type: 'SET_DB_OPEN', open })}
        onSelectDb={onSelectTool}
      />
    </>
  )
}
