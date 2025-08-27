"use client"

import { useMemo } from "react"

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
    useMemo(() => {
        mermaid.initialize({
            startOnLoad: true,
            theme: theme === "dark" ? "dark" : "default",
            // securityLevel: "loose",
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

    const renderMermaid = (code: string, index: number) => {
        const id = `mermaid-${index}-${Date.now()}`

        setTimeout(() => {
            const element = document.getElementById(id)
            if (element) {
                mermaid
                    .render(`mermaid-svg-${id}`, code)
                    .then(({ svg }) => {
                        element.innerHTML = svg
                    })
                    .catch(console.error)
            }
        }, 100)

        return (
            <div key={index} className="my-4 p-4 bg-muted rounded-lg overflow-x-auto">
                <div id={id} className="mermaid-container">
                    加载图表中...
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
                        return renderMermaid(part.content, index)
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
