"use client"

import { useMemo, useEffect, useRef, useState } from "react"

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import mermaid from "mermaid"
import { useTheme } from "next-themes"

interface MarkdownRendererProps {
    content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    const { theme } = useTheme()

    // 初始化 Mermaid
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false, // 我们手动控制渲染
            theme: theme === "dark" ? "dark" : "default",
            securityLevel: "loose",
            fontFamily: "inherit",
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
            },
            sequence: {
                useMaxWidth: true,
            },
            gantt: {
                useMaxWidth: true,
            },
        })
    }, [theme])

    const renderContent = useMemo(() => {
        // 处理代码块
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
        const parts = []
        let lastIndex = 0
        let match

        while ((match = codeBlockRegex.exec(content)) !== null) {
            // 添加代码块前的文本
            if (match.index > lastIndex) {
                parts.push({
                    type: "text",
                    content: content.slice(lastIndex, match.index),
                })
            }

            const language = match[1] || "text"
            const code = match[2].trim()

            if (language === "mermaid") {
                parts.push({
                    type: "mermaid",
                    content: code,
                })
            } else {
                parts.push({
                    type: "code",
                    language,
                    content: code,
                })
            }

            lastIndex = match.index + match[0].length
        }

        // 添加剩余文本
        if (lastIndex < content.length) {
            parts.push({
                type: "text",
                content: content.slice(lastIndex),
            })
        }

        return parts
    }, [content])

    const renderText = (text: string) => {
        // 处理内联代码
        const inlineCodeRegex = /`([^`]+)`/g
        const parts = text.split(inlineCodeRegex)

        return parts.map((part, index) => {
            if (index % 2 === 1) {
                return (
                    <code key={index} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                        {part}
                    </code>
                )
            }

            // 处理其他 markdown 语法
            const processed = part
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.*?)\*/g, "<em>$1</em>")
                .replace(/~~(.*?)~~/g, "<del>$1</del>")
                .replace(/\n/g, "<br />")

            return <span key={index} dangerouslySetInnerHTML={{ __html: processed }} />
        })
    }

    const MermaidDiagram = ({ code, index }: { code: string; index: number }) => {
        const containerRef = useRef<HTMLDivElement>(null)
        const [isLoading, setIsLoading] = useState(true)
        const [error, setError] = useState<string | null>(null)
        const [retryCount, setRetryCount] = useState(0)
        const [svgContent, setSvgContent] = useState<string>('')


        useEffect(() => {
            let isMounted = true
            
            const renderDiagramSafe = async () => {
                if (!isMounted) return
                
                try {
                    setIsLoading(true)
                    setError(null)
                    setSvgContent('')
                    
                    // 生成唯一的ID
                    const id = `mermaid-${index}-${Date.now()}-${retryCount}`
                    
                    // 渲染Mermaid图表
                    const { svg } = await mermaid.render(id, code)
                    
                    if (isMounted) {
                        setSvgContent(svg)
                        setIsLoading(false)
                    }
                } catch (err) {
                    if (isMounted) {
                        console.error('Mermaid rendering error:', err)
                        setError(err instanceof Error ? err.message : '渲染图表失败')
                        setIsLoading(false)
                    }
                }
            }
            
            renderDiagramSafe()
            
            return () => {
                isMounted = false
            }
        }, [code, index, theme, retryCount])

        const handleRetry = () => {
            setRetryCount(prev => prev + 1)
        }

        return (
            <div className="my-4 p-4 bg-muted rounded-lg overflow-x-auto">
                <div className="mermaid-container min-h-[100px] flex items-center justify-center">
                    {isLoading && <span className="text-muted-foreground">加载图表中...</span>}
                    {error && (
                        <div className="text-center">
                            <span className="text-destructive block mb-2">错误: {error}</span>
                            <button 
                                onClick={handleRetry}
                                className="text-sm text-primary hover:underline"
                            >
                                重试
                            </button>
                        </div>
                    )}
                    {svgContent && !isLoading && !error && (
                        <div 
                            ref={containerRef}
                            dangerouslySetInnerHTML={{ __html: svgContent }}
                            className="w-full"
                        />
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {renderContent.map((part, index) => {
                switch (part.type) {
                    case "code":
                        return (
                            <div key={index} className="my-4">
                                <SyntaxHighlighter
                                    language={part.language}
                                    style={theme === "dark" ? oneDark : oneLight}
                                    customStyle={{
                                        margin: 0,
                                        borderRadius: "0.5rem",
                                        fontSize: "0.875rem",
                                    }}
                                    showLineNumbers={part.content.split("\n").length > 5}
                                >
                                    {part.content}
                                </SyntaxHighlighter>
                            </div>
                        )
                    case "mermaid":
                        return <MermaidDiagram key={index} code={part.content} index={index} />
                    case "text":
                        return (
                            <div key={index} className="leading-relaxed">
                                {renderText(part.content)}
                            </div>
                        )
                    default:
                        return null
                }
            })}
        </div>
    )
}
