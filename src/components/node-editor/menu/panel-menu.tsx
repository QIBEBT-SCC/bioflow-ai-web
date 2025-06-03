"use client"

import type React from "react"
import {useState, useRef} from "react"
import {
    BarChart,
    DnaIcon,
    FileInput,
    Filter,
    LineChart,
    Scissors,
    StickyNote,
    PenToolIcon,
    ChevronRight,
} from "lucide-react"
import {HierarchicalMenu} from "@/components/node-editor/menu/hierarchical-menu.tsx";

// 菜单数据结构
const menuData = {
    analysis: {
        name: "分析工具",
        icon: <PenToolIcon className="h-4 w-4 mr-2"/>,
        items: [], // 这个会打开分层菜单
    },
    dataProcessing: {
        name: "数据处理",
        icon: <Filter className="h-4 w-4 mr-2"/>,
        items: [
            {type: "dataFilter", label: "数据过滤", icon: <Filter className="h-4 w-4 mr-2"/>},
            {type: "dataCut", label: "数据截取", icon: <Scissors className="h-4 w-4 mr-2"/>},
        ],
    },
    io: {
        name: "输入输出",
        icon: <FileInput className="h-4 w-4 mr-2"/>,
        items: [
            {type: "fileInput", label: "文件输入", icon: <FileInput className="h-4 w-4 mr-2"/>},
            {type: "sequenceInputNode", label: "序列输入", icon: <DnaIcon className="h-4 w-4 mr-2"/>},
            {type: "globalInput", label: "全局输入", icon: <FileInput className="h-4 w-4 mr-2"/>},
        ],
    },
    visualization: {
        name: "可视化",
        icon: <LineChart className="h-4 w-4 mr-2"/>,
        items: [
            {type: "lineFig", label: "折线图", icon: <LineChart className="h-4 w-4 mr-2"/>},
            {type: "barFig", label: "柱状图", icon: <BarChart className="h-4 w-4 mr-2"/>},
        ],
    },
    other: {
        name: "其它",
        icon: <StickyNote className="h-4 w-4 mr-2"/>,
        items: [{type: "note", label: "笔记", icon: <StickyNote className="h-4 w-4 mr-2"/>}],
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
    onSelectTool: (toolType: string, toolUid?: string) => void
}

export const PanelMenu: React.FC<PanelMenuProps> = ({isOpen, position, onClose, onSelectTool}) => {
    const [isAnalysisMenuOpen, setIsAnalysisMenuOpen] = useState(false)
    const [activeMenu, setActiveMenu] = useState<string | null>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    // 处理点击分析工具
    const handleAnalysisToolClick = () => {
        setIsAnalysisMenuOpen(true)
        onClose() // 关闭上下文菜单
    }

    // 处理菜单项点击
    const handleMenuItemClick = (menuType: string) => {
        if (menuType === "analysis") {
            handleAnalysisToolClick()
        } else if (menuData[menuType as keyof typeof menuData]?.items.length === 0) {
            // 如果没有子菜单，直接关闭菜单
            onClose()
        }
    }

    // 处理子菜单项点击
    const handleSubMenuItemClick = (itemType: string) => {
        onSelectTool(itemType)
        onClose() // 关闭上下文菜单
    }

    // 调整菜单位置，确保不超出视口
    const adjustPosition = (pos: Position) => {
        if (!menuRef.current) return pos

        const menuRect = menuRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        let {x, y} = pos

        // 调整水平位置
        if (x + menuRect.width > viewportWidth) {
            x = viewportWidth - menuRect.width - 10
        }

        // 调整垂直位置
        if (y + menuRect.height > viewportHeight) {
            y = viewportHeight - menuRect.height - 10
        }

        return {x, y}
    }

    if (!isOpen && !isAnalysisMenuOpen) return null

    const adjustedPosition = adjustPosition(position)

    return (
        <>
            {isOpen && (
                <div
                    ref={menuRef}
                    className="fixed z-50 bg-white rounded-md shadow-lg border overflow-visible"
                    style={{
                        left: `${adjustedPosition.x}px`,
                        top: `${adjustedPosition.y}px`,
                        minWidth: "180px",
                    }}
                >
                    <div className="py-1">
                        {/* 所有菜单项 */}
                        {Object.entries(menuData).map(([key, menu]) => (
                            <div
                                key={key}
                                className="relative menu-item"
                                onMouseEnter={() => setActiveMenu(key)}
                                onMouseLeave={() => setActiveMenu(null)}
                            >
                                <button
                                    onClick={() => handleMenuItemClick(key)}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                                >
                                    <span className="flex items-center">{menu.icon}{menu.name}</span>
                                    {menu.items.length > 0 && <ChevronRight className="h-4 w-4"/>}
                                </button>

                                {/* 子菜单 - 使用内联样式和条件渲染 */}
                                {key !== "analysis" && menu.items.length > 0 && activeMenu === key && (
                                    <div
                                        className="absolute bg-white border rounded-md shadow-lg py-1"
                                        style={{
                                            left: "100%",
                                            top: "0",
                                            marginLeft: "2px",
                                            minWidth: "180px",
                                            zIndex: 100,
                                        }}
                                    >
                                        {menu.items.map((item) => (
                                            <button
                                                key={item.type}
                                                onClick={() => handleSubMenuItemClick(item.type)}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
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
            <HierarchicalMenu
                isOpen={isAnalysisMenuOpen}
                onClose={() => setIsAnalysisMenuOpen(false)}
                onSelectTool={onSelectTool}
            />
        </>
    )
}
