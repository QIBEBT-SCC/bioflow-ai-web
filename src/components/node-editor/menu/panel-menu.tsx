"use client"

import {
    CaseSensitiveIcon,
    ChevronRightIcon,
    CodeIcon,
    DatabaseIcon, DnaIcon,
    FileInputIcon,
    PenToolIcon,
    StickyNoteIcon,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { DbMenu } from '@/components/node-editor/menu/db-menu'
import { ToolMenu } from '@/components/node-editor/menu/tool-menu'
import { cn } from '@/lib/utils'

// 菜单数据结构（简化版，只包含已迁移的节点）
const menuData = {
  analysis: {
    name: '分析工具',
    icon: <PenToolIcon className='h-4 w-4 mr-2' />,
    items: [], // 这个会打开分层菜单
  },
  io: {
    name: '输入输出',
    icon: <FileInputIcon className='h-4 w-4 mr-2' />,
    items: [
      {
        type: 'value_string',
        label: '文本输入',
        icon: <CaseSensitiveIcon className='h-4 w-4 mr-2' />,
      },
      {
        type: 'resource_file',
        label: '文件输入',
        icon: <FileInputIcon className='h-4 w-4 mr-2' />,
      },
      {
        type: 'resource_sequence',
        label: '序列输入',
        icon: <DnaIcon className='h-4 w-4 mr-2' />,
      },
      {
        type: 'resource_db',
        label: '数据库',
        icon: <DatabaseIcon className='h-4 w-4 mr-2' />,
      },
      {
        type: 'resource_genome',
        label: '参考基因组',
        icon: <DatabaseIcon className='h-4 w-4 mr-2' />,
      },
    ],
  },
  programming: {
    name: '编程',
    icon: <CodeIcon className='h-4 w-4 mr-2' />,
    items: [
      {
        type: 'code_R',
        label: 'R code',
        icon: <CodeIcon className='h-4 w-4 mr-2' />,
      },
      {
        type: 'code_python',
        label: 'Python code',
        icon: <CodeIcon className='h-4 w-4 mr-2' />,
      },
    ],
  },
  other: {
    name: '其它',
    icon: <StickyNoteIcon className='h-4 w-4 mr-2' />,
    items: [
      {
        type: 'note',
        label: '笔记',
        icon: <StickyNoteIcon className='h-4 w-4 mr-2' />,
      },
    ],
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
  onSelectTool: (toolType: string, toolUid?: string, resourceName?: string) => void
}

export const PanelMenu: React.FC<PanelMenuProps> = ({
  isOpen,
  position,
  onClose,
  onSelectTool,
}) => {
  const [isAnalysisMenuOpen, setIsAnalysisMenuOpen] = useState(false)
  const [isDBMenuOpen, setIsDBMenuOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // 处理点击分析工具
  const handleAnalysisToolClick = () => {
    setIsAnalysisMenuOpen(true)
    onClose()
  }

  const handleDBClick = () => {
    setIsDBMenuOpen(true)
    onClose()
  }

  // 处理菜单项点击
  const handleMenuItemClick = (menuType: string) => {
    if (menuType === 'analysis') {
      handleAnalysisToolClick()
    } else if (
      menuData[menuType as keyof typeof menuData]?.items.length === 0
    ) {
      onClose()
    }
  }

  // 处理子菜单项点击
  const handleSubMenuItemClick = (itemType: string) => {
    if (itemType === 'resource_db') {
      handleDBClick()
    } else {
      onSelectTool(itemType)
      onClose()
    }
  }

  // 调整菜单位置，确保不超出视口
  const adjustPosition = (pos: Position) => {
    if (!menuRef.current) return pos

    const menuRect = menuRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let { x, y } = pos

    // 调整水平位置
    if (x + menuRect.width > viewportWidth) {
      x = viewportWidth - menuRect.width - 10
    }

    // 调整垂直位置
    if (y + menuRect.height > viewportHeight) {
      y = viewportHeight - menuRect.height - 10
    }

    return { x, y }
  }

  // 当父菜单关闭时，重置所有子菜单状态
  useEffect(() => {
    if (!isOpen) {
      setActiveMenu(null)
    }
  }, [isOpen])

  if (!isOpen && !isAnalysisMenuOpen && !isDBMenuOpen) return null

  const adjustedPosition = adjustPosition(position)

  return (
    <>
      {isOpen && (
        <div
          ref={menuRef}
          className='fixed z-50 bg-white rounded-lg shadow-lg border overflow-visible min-w-[200px] animate-in fade-in zoom-in-95'
          style={{
            left: `${adjustedPosition.x}px`,
            top: `${adjustedPosition.y}px`,
          }}
          role='menu'
          tabIndex={-1}
          onMouseLeave={() => setActiveMenu(null)}
          onBlur={() => setActiveMenu(null)}
        >
          <div className='py-1'>
            {/* 所有菜单项 */}
            {Object.entries(menuData).map(([key, menu]) => (
              <div
                key={key}
                className='relative menu-item'
              >
                <button
                  type='button'
                  onClick={() => handleMenuItemClick(key)}
                  onMouseEnter={() => setActiveMenu(key)}
                  onFocus={() => setActiveMenu(key)}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between transition-colors',
                    activeMenu === key && 'bg-gray-50',
                  )}
                >
                  <span className='flex items-center'>
                    {menu.icon}
                    {menu.name}
                  </span>
                  {menu.items.length > 0 && (
                    <ChevronRightIcon className='h-4 w-4' />
                  )}
                </button>

                {/* 子菜单 */}
                {key !== 'analysis' &&
                  menu.items.length > 0 &&
                  activeMenu === key && (
                    <div
                      className='absolute bg-white border rounded-lg shadow-lg py-1 animate-in fade-in slide-in-from-left-1'
                      style={{
                        left: '100%',
                        top: '0',
                        marginLeft: '4px',
                        minWidth: '200px',
                        zIndex: 100,
                      }}
                    >
                      {menu.items.map((item) => (
                        <button
                          key={item.type}
                          type='button'
                          onClick={() => handleSubMenuItemClick(item.type)}
                          className='w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center transition-colors'
                        >
                          {item.icon}
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 分析工具分层菜单 */}
      <ToolMenu
        isOpen={isAnalysisMenuOpen}
        onClose={() => setIsAnalysisMenuOpen(false)}
        onSelectTool={onSelectTool}
      />

      {/* 数据库选择菜单 */}
      <DbMenu
        isOpen={isDBMenuOpen}
        onOpenChange={setIsDBMenuOpen}
        onSelectDb={onSelectTool}
      />
    </>
  )
}
