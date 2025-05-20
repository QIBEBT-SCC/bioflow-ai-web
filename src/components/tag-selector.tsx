"use client"

import * as React from "react"
import {useState, useRef, useEffect} from "react"
import {Badge} from "@/components/ui/badge"
import {Command, CommandEmpty, CommandGroup, CommandItem, CommandList} from "@/components/ui/command"
import {Plus, X} from "lucide-react"
import {cn} from "@/lib/utils"
import {ToolTag} from "@/types/tool.tsx";
import {ProjectTag} from "@/types/project.tsx"

export interface TagSelectorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    availableTags: (ToolTag | ProjectTag)[]
    /** 当前选中的标签 */
    value: (ToolTag | ProjectTag)[]
    /** 当标签选择变化时的回调函数 */
    onChange: (tags: (ToolTag | ProjectTag)[]) => void
    /** 是否禁用 */
    disabled?: boolean
    /** 占位符文本 */
    placeholder?: string
    /** 是否允许创建新标签 */
    allowCreate?: boolean
    /** 最大标签数量，不设置则不限制 */
    maxTags?: number
    /** 自定义样式类名 */
    className?: string
    /** 错误状态 */
    error?: boolean
    /** 错误消息 */
    errorMessage?: string
}

export const TagSelector = React.forwardRef<HTMLDivElement, TagSelectorProps>(
    (
        {
            availableTags,
            value,
            onChange,
            disabled = false,
            placeholder = "搜索标签...",
            allowCreate = true,
            maxTags,
            className,
            error = false,
            errorMessage,
            ...props
        },
        ref,
    ) => {
        const [inputValue, setInputValue] = useState("")
        const [open, setOpen] = useState(false)
        const inputRef = useRef<HTMLInputElement>(null)
        const selectedTags = value || []

        // 检查是否达到最大标签数
        const isMaxTagsReached = maxTags !== undefined && selectedTags.length >= maxTags

        // 过滤已经选择的标签和匹配输入的标签
        const filteredTags = availableTags.filter(
            (tag) =>
                !selectedTags.some((selectedTag) => selectedTag.id === tag.id) &&
                tag.name.toLowerCase().includes(inputValue.toLowerCase()),
        )

        // 检查是否可以创建新标签
        const canCreateNewTag =
            allowCreate &&
            !disabled &&
            !isMaxTagsReached &&
            inputValue.trim() !== "" &&
            !filteredTags.some((tag) => tag.name.toLowerCase() === inputValue.toLowerCase()) &&
            !selectedTags.some((tag) => tag.name.toLowerCase() === inputValue.toLowerCase())

        // 判断标签是否为新建标签（id为-1）
        const isNewTag = (tag: ToolTag | ProjectTag) => tag.id === -1

        // 更新选中的标签
        const updateTags = (newTags: (ToolTag | ProjectTag)[]) => {
            onChange(newTags)
            setInputValue("")
            inputRef.current?.focus()
        }

        // 选择已存在的标签
        const selectTag = (tag: ToolTag | ProjectTag) => {
            if (disabled || isMaxTagsReached) return
            updateTags([...selectedTags, tag])
        }

        // 创建并选择新标签
        const createNewTag = () => {
            if (canCreateNewTag) {
                const newTag: ToolTag = {
                    id: -1,
                    name: inputValue.trim(),
                }
                updateTags([...selectedTags, newTag])
            }
        }

        // 移除标签
        const removeTag = (index: number) => {
            if (disabled) return
            const newSelectedTags = [...selectedTags]
            newSelectedTags.splice(index, 1)
            updateTags(newSelectedTags)
        }

        // 处理键盘事件
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (disabled) return

            if (e.key === "Backspace" && inputValue === "" && selectedTags.length > 0) {
                removeTag(selectedTags.length - 1)
            } else if (e.key === "Enter" && canCreateNewTag) {
                e.preventDefault()
                createNewTag()
            }
        }

        // 当输入框获得焦点时，打开下拉菜单
        useEffect(() => {
            if (inputRef.current === document.activeElement) {
                setOpen(true)
            }
        }, [inputValue])

        return (
            <div className="w-full" ref={ref} {...props}>
                <div
                    className={cn(
                        "flex flex-wrap gap-1.5 p-2 border rounded-md min-h-10",
                        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                        disabled && "bg-muted opacity-50 cursor-not-allowed",
                        error && "border-destructive focus-within:ring-destructive",
                        className,
                    )}
                    onClick={() => !disabled && inputRef.current?.focus()}
                >
                    {selectedTags.map((tag, index) => (
                        <Badge
                            key={`${tag.id}-${index}`}
                            variant={isNewTag(tag) ? "outline" : "secondary"}
                            className={cn("h-6 px-2 text-sm", isNewTag(tag) && "border-dashed", disabled && "opacity-70")}
                        >
                            {isNewTag(tag) && <Plus className="w-3 h-3 mr-1"/>}
                            {tag.name}
                            {!disabled && (
                                <button
                                    type="button"
                                    className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        removeTag(index)
                                    }}
                                >
                                    <X className="w-3 h-3"/>
                                    <span className="sr-only">Remove {tag.name}</span>
                                </button>
                            )}
                        </Badge>
                    ))}
                    {!isMaxTagsReached && (
                        <div className="relative flex-1 min-w-[120px]">
                            <input
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => !disabled && setOpen(true)}
                                onBlur={() => setTimeout(() => setOpen(false), 200)}
                                className={cn(
                                    "w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-sm",
                                    disabled && "cursor-not-allowed",
                                )}
                                placeholder={selectedTags.length === 0 ? placeholder : ""}
                                disabled={disabled}
                            />
                            {open && !disabled && (inputValue.trim() !== "" || filteredTags.length > 0) && (
                                <div className="absolute top-full left-0 w-full z-10 mt-1">
                                    <Command className="rounded-lg border shadow-md">
                                        <CommandList>
                                            {filteredTags.length === 0 && !canCreateNewTag ? (
                                                <CommandEmpty>没有找到匹配的标签</CommandEmpty>
                                            ) : (
                                                <CommandGroup>
                                                    {filteredTags.map((tag) => (
                                                        <CommandItem key={tag.id} onSelect={() => selectTag(tag)}
                                                                     className="cursor-pointer">
                                                            {tag.name}
                                                        </CommandItem>
                                                    ))}
                                                    {canCreateNewTag && (
                                                        <CommandItem
                                                            onSelect={createNewTag}
                                                            className="cursor-pointer flex items-center text-primary"
                                                        >
                                                            <Plus className="w-4 h-4 mr-2"/>
                                                            创建新标签 "{inputValue}"
                                                        </CommandItem>
                                                    )}
                                                </CommandGroup>
                                            )}
                                        </CommandList>
                                    </Command>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {error && errorMessage && <p className="text-sm text-destructive mt-1">{errorMessage}</p>}
                {isMaxTagsReached && <p className="text-sm text-muted-foreground mt-1">已达到最大标签数量 ({maxTags})</p>}
            </div>
        )
    },
)

TagSelector.displayName = "TagSelector"
