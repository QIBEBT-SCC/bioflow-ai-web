"use client"

import {useCallback, useEffect, useRef, useState} from "react"
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx"
import {Button} from "@/components/ui/button.tsx"
import {ScrollArea, ScrollBar} from "@/components/ui/scroll-area.tsx"
import {
    RotateCcwIcon,
    DownloadIcon,
    ZoomInIcon,
    ZoomOutIcon
} from "lucide-react"
import mermaid from "mermaid"
import {useTheme} from "next-themes"

interface MermaidPreviewDialogProps {
    isOpen: boolean
    onClose: () => void
    mermaidCode: string
    title?: string
}

export function MermaidPreviewDialog({
                                         isOpen,
                                         onClose,
                                         mermaidCode,
                                         title = "Mermaid 图表预览"
                                     }: MermaidPreviewDialogProps) {
    const {theme} = useTheme()
    const containerRef = useRef<HTMLDivElement>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [svgContent, setSvgContent] = useState<string>('')
    const [zoomLevel, setZoomLevel] = useState(1)
    const [retryCount, setRetryCount] = useState(0)

    // 渲染Mermaid图表
    const renderMermaid = useCallback(async () => {
        if (!mermaidCode.trim()) return

        try {
            setIsLoading(true)
            setError(null)
            setSvgContent('')

            // 生成唯一的ID
            const id = `mermaid-preview-${Date.now()}-${retryCount}`

            // 获取容器宽度，用于设置Mermaid图表宽度
            const containerWidth = containerRef.current?.clientWidth || 800

            // 为预览弹窗创建专门的Mermaid配置
            const previewConfig = {
                startOnLoad: false,
                theme: (theme === "dark" ? "dark" : "default") as "dark" | "default",
                securityLevel: "loose" as const,
                fontFamily: "inherit",
                flowchart: {
                    useMaxWidth: false,
                    htmlLabels: true,
                    width: Math.max(containerWidth - 100, 600), // 确保最小宽度
                },
                sequence: {
                    useMaxWidth: false,
                    width: Math.max(containerWidth - 100, 600),
                },
                gantt: {
                    useMaxWidth: false,
                    width: Math.max(containerWidth - 100, 600),
                },
                journey: {
                    useMaxWidth: false,
                    width: Math.max(containerWidth - 100, 600),
                },
                gitgraph: {
                    useMaxWidth: false,
                    width: Math.max(containerWidth - 100, 600),
                },
            }

            // 临时初始化Mermaid配置
            mermaid.initialize(previewConfig)

            // 渲染Mermaid图表
            const {svg} = await mermaid.render(id, mermaidCode)

            setSvgContent(svg)
            setIsLoading(false)
        } catch (err) {
            console.error('Mermaid rendering error:', err)
            setError(err instanceof Error ? err.message : '渲染图表失败')
            setIsLoading(false)
        }
    }, [mermaidCode, theme, retryCount])

    // 当弹窗打开或代码变化时重新渲染
    useEffect(() => {
        if (isOpen && mermaidCode) {
            // 延迟渲染，确保容器尺寸已经确定
            const timer = setTimeout(() => {
                renderMermaid().then()
            }, 100)

            return () => clearTimeout(timer)
        }
    }, [isOpen, mermaidCode, theme, retryCount, renderMermaid])

    // 重置状态
    const handleClose = () => {
        setSvgContent('')
        setError(null)
        setIsLoading(false)
        setZoomLevel(1)
        onClose()
    }

    // 重试渲染
    const handleRetry = () => {
        setRetryCount(prev => prev + 1)
    }


    // 缩放控制
    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 0.2, 3))
    }

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 0.2, 0.5))
    }

    const handleResetZoom = () => {
        setZoomLevel(1)
    }

    // 下载SVG
    const handleDownload = () => {
        if (!svgContent) return

        const blob = new Blob([svgContent], {type: 'image/svg+xml'})
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `mermaid-diagram-${Date.now()}.svg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="p-0 !max-w-none !w-auto !h-auto"
                style={{
                    width: '85vw',
                    height: '75vh',
                    maxWidth: '95vw',
                    maxHeight: '95vh',
                    minWidth: '800px',
                    minHeight: '600px',
                }}
            >
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-semibold">
                            {title}
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            {/* 缩放控制 */}
                            <div className="flex items-center gap-1 border rounded-md">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleZoomOut}
                                    disabled={zoomLevel <= 0.5}
                                    className="h-8 w-8 p-0"
                                >
                                    <ZoomOutIcon className="w-4 h-4"/>
                                </Button>
                                <span className="px-2 text-sm text-muted-foreground min-w-[3rem] text-center">
                                    {Math.round(zoomLevel * 100)}%
                                </span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleZoomIn}
                                    disabled={zoomLevel >= 3}
                                    className="h-8 w-8 p-0"
                                >
                                    <ZoomInIcon className="w-4 h-4"/>
                                </Button>
                            </div>

                            {/* 重置缩放 */}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleResetZoom}
                                className="h-8 w-8 p-0"
                            >
                                <RotateCcwIcon className="w-4 h-4"/>
                            </Button>

                            {/* 下载 */}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleDownload}
                                disabled={!svgContent}
                                className="h-8 w-8 p-0"
                            >
                                <DownloadIcon className="w-4 h-4"/>
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full w-full">
                        <div className="p-6 min-w-max">
                            <div
                                ref={containerRef}
                                className="flex items-center justify-center min-h-[500px] w-full"
                            >
                                {isLoading && (
                                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
                                        <span>渲染图表中...</span>
                                    </div>
                                )}

                                {error && (
                                    <div className="text-center space-y-4">
                                        <div className="text-destructive">
                                            <p className="font-medium">渲染失败</p>
                                            <p className="text-sm mt-1">{error}</p>
                                        </div>
                                        <Button onClick={handleRetry} variant="outline">
                                            <RotateCcwIcon className="w-4 h-4 mr-2"/>
                                            重试
                                        </Button>
                                    </div>
                                )}

                                {svgContent && !isLoading && !error && (
                                    <div
                                        className="w-full max-w-none flex justify-center"
                                        style={{
                                            minWidth: `${100 * zoomLevel}%`,
                                            minHeight: `${100 * zoomLevel}%`
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: svgContent.replace(
                                                /<svg([^>]*)>/g,
                                                `<svg$1 style="max-width: none; height: auto; display: block; transform: scale(${zoomLevel}); transform-origin: center top;">`
                                            )
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                        <ScrollBar orientation="horizontal"/>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}
