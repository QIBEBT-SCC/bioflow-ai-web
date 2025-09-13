"use client"

import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
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

    // 处理Mermaid图表
    const processMermaidContent = (content: string) => {
        const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
        const parts = []
        let lastIndex = 0
        let match

        while ((match = mermaidRegex.exec(content)) !== null) {
            // 添加Mermaid图表前的文本
            if (match.index > lastIndex) {
                parts.push({
                    type: "markdown",
                    content: content.slice(lastIndex, match.index),
                })
            }

            parts.push({
                type: "mermaid",
                content: match[1].trim(),
            })

            lastIndex = match.index + match[0].length
        }

        // 添加剩余文本
        if (lastIndex < content.length) {
            parts.push({
                type: "markdown",
                content: content.slice(lastIndex),
            })
        }

        return parts.length > 0 ? parts : [{ type: "markdown", content }]
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

    const processedContent = processMermaidContent(content)

    return (
        <div className="space-y-3">
            {processedContent.map((part, index) => {
                if (part.type === "mermaid") {
                    return <MermaidDiagram key={index} code={part.content} index={index} />
                } else {
                    return (
                        <ReactMarkdown
                            key={index}
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                                // 自定义代码块渲染
                                code({ node, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    const language = match ? match[1] : ''
                                    const isInline = !match
                                    
                                    if (!isInline && language) {
                                        return (
                                            <div className="my-4">
                                                <SyntaxHighlighter
                                                    language={language}
                                                    style={theme === "dark" ? oneDark : oneLight}
                                                    customStyle={{
                                                        margin: 0,
                                                        borderRadius: "0.5rem",
                                                        fontSize: "0.875rem",
                                                    } as any}
                                                    showLineNumbers={String(children).split("\n").length > 5}
                                                    {...props}
                                                >
                                                    {String(children).replace(/\n$/, '')}
                                                </SyntaxHighlighter>
                                            </div>
                                        )
                                    }
                                    
                                    return (
                                        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                            {children}
                                        </code>
                                    )
                                },
                                // 自定义链接渲染
                                a({ href, children, ...props }) {
                                    return (
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                            {...props}
                                        >
                                            {children}
                                        </a>
                                    )
                                },
                                // 自定义表格渲染
                                table({ children, ...props }) {
                                    return (
                                        <div className="overflow-x-auto my-4">
                                            <table className="min-w-full border-collapse border border-border" {...props}>
                                                {children}
                                            </table>
                                        </div>
                                    )
                                },
                                th({ children, ...props }) {
                                    return (
                                        <th className="border border-border px-3 py-2 bg-muted font-semibold text-left" {...props}>
                                            {children}
                                        </th>
                                    )
                                },
                                td({ children, ...props }) {
                                    return (
                                        <td className="border border-border px-3 py-2" {...props}>
                                            {children}
                                        </td>
                                    )
                                },
                                // 自定义引用渲染
                                blockquote({ children, ...props }) {
                                    return (
                                        <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground my-4" {...props}>
                                            {children}
                                        </blockquote>
                                    )
                                },
                                // 自定义列表渲染
                                ul({ children, ...props }) {
                                    return (
                                        <ul className="list-disc list-inside space-y-1 my-4" {...props}>
                                            {children}
                                        </ul>
                                    )
                                },
                                ol({ children, ...props }) {
                                    return (
                                        <ol className="list-decimal list-inside space-y-1 my-4" {...props}>
                                            {children}
                                        </ol>
                                    )
                                },
                                li({ children, ...props }) {
                                    return (
                                        <li className="leading-relaxed" {...props}>
                                            {children}
                                        </li>
                                    )
                                },
                                // 自定义标题渲染
                                h1({ children, ...props }) {
                                    return (
                                        <h1 className="text-2xl font-bold mt-8 mb-4" {...props}>
                                            {children}
                                        </h1>
                                    )
                                },
                                h2({ children, ...props }) {
                                    return (
                                        <h2 className="text-xl font-bold mt-6 mb-3" {...props}>
                                            {children}
                                        </h2>
                                    )
                                },
                                h3({ children, ...props }) {
                                    return (
                                        <h3 className="text-lg font-semibold mt-5 mb-2" {...props}>
                                            {children}
                                        </h3>
                                    )
                                },
                                h4({ children, ...props }) {
                                    return (
                                        <h4 className="text-base font-semibold mt-4 mb-2" {...props}>
                                            {children}
                                        </h4>
                                    )
                                },
                                h5({ children, ...props }) {
                                    return (
                                        <h5 className="text-sm font-semibold mt-3 mb-1" {...props}>
                                            {children}
                                        </h5>
                                    )
                                },
                                h6({ children, ...props }) {
                                    return (
                                        <h6 className="text-xs font-semibold mt-2 mb-1" {...props}>
                                            {children}
                                        </h6>
                                    )
                                },
                                // 自定义段落渲染
                                p({ children, ...props }) {
                                    return (
                                        <p className="leading-relaxed mb-3" {...props}>
                                            {children}
                                        </p>
                                    )
                                },
                            }}
                        >
                            {part.content}
                        </ReactMarkdown>
                    )
                }
            })}
        </div>
    )
}
