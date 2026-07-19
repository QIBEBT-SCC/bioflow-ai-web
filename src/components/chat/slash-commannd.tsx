'use client'

/**
 * Slash Command —— 可复用的「斜杠命令」组合件（AI Elements 风格）。
 *
 * 设计成「Hook（大脑） + 展示组件（皮肤）」两层，方便搬到任意项目：
 * - `useSlashCommand`：承载全部交互逻辑——按 `/<key>` 前缀过滤候选、键盘 ↑/↓ 移动、
 *   Enter/Tab 确认、Esc 关闭，以及把已提交命令「药丸」（`/<key> `，含尾随空格）作为
 *   整体一次性 Backspace 删除。它不渲染任何 UI，只把状态与事件处理函数交给你绑定到输入框。
 * - `SlashCommandMenu` / `SlashCommandItem` / `SlashCommandItemLabel` /
 *   `SlashCommandItemDescription`：一组用 `cn` 写好的可组合展示组件，可直接用、也可换皮。
 *
 * 命令数据（`SlashCommand[]`）由外部传入，组件本身与具体业务无关。
 */

import type { LucideIcon } from 'lucide-react'
import type { ComponentProps, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// 类型
// ============================================================================

export type SlashCommand = {
  /** 命令名，同时是触发关键字：输入 `/<key>` 即按前缀匹配。 */
  key: string
  /** 展示标题。 */
  label: string
  /** 一句话描述（可选）。 */
  description?: string
  /** 左侧图标（可选，lucide 图标组件）。 */
  icon?: LucideIcon
}

export type UseSlashCommandOptions<T extends SlashCommand = SlashCommand> = {
  /** 候选命令清单。 */
  commands: T[]
  /** 受控输入框当前值。 */
  value: string
  /** 写回输入框值的回调（通常就是你的 `setText`）。 */
  onValueChange: (value: string) => void
  /**
   * 选中命令后写入输入框的文本，默认 ``/<key> ``（带尾随空格，形成可整体删除的「药丸」）。
   * 若自定义为无尾随空格的格式，则不会触发「整块删除」。
   */
  format?: (command: T) => string
}

export type UseSlashCommandReturn<T extends SlashCommand = SlashCommand> = {
  /** 菜单是否应展示（有候选且未被 Esc 关闭）。 */
  open: boolean
  /** 当前过滤出的候选命令。 */
  suggestions: T[]
  /** 键盘高亮项索引。 */
  activeIndex: number
  /** 绑定到输入框的 `onKeyDown`（处理 ↑/↓、Enter/Tab、Esc 及整块删除）。 */
  onKeyDown: (e: ReactKeyboardEvent<HTMLTextAreaElement>) => void
  /** 在输入框 `onChange` 里调用，传入最新值；内部据此复位高亮与 Esc 关闭态。 */
  onValueChange: (value: string) => void
  /** 选中某条命令（点击时调用）。 */
  select: (command: T) => void
  /** 设置高亮项索引（鼠标悬停时调用）。 */
  setActiveIndex: (index: number) => void
}

// ============================================================================
// Hook（大脑）
// ============================================================================

const DEFAULT_FORMAT = (command: SlashCommand): string => `/${command.key} `

export function useSlashCommand<T extends SlashCommand = SlashCommand>({
  commands,
  value,
  onValueChange,
  format = DEFAULT_FORMAT,
}: UseSlashCommandOptions<T>): UseSlashCommandReturn<T> {
  const [activeIndex, setActiveIndex] = useState(0)
  // Esc 关闭后用 dismissed 抑制，直到下次输入变化复位。
  const [dismissed, setDismissed] = useState(false)

  // 查询：以 / 开头且尚未输入空格（仍在敲命令名）时取 / 之后的内容。
  const query =
    value.startsWith('/') && !value.includes(' ')
      ? value.slice(1).toLowerCase()
      : null

  const suggestions = useMemo(
    () =>
      query === null
        ? []
        : commands.filter((c) => c.key.toLowerCase().startsWith(query)),
    [commands, query],
  )

  const open = !dismissed && suggestions.length > 0

  // 输入变化：写回并复位内部状态。
  const handleValueChange = useCallback(
    (next: string) => {
      onValueChange(next)
      setDismissed(false)
      setActiveIndex(0)
    },
    [onValueChange],
  )

  const select = useCallback(
    (command: T) => {
      handleValueChange(format(command))
    },
    [format, handleValueChange],
  )

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      const el = e.currentTarget

      // ① 整块删除：开头若是已提交的命令「药丸」(`/<key> `，含尾随空格)，且光标为折叠态、
      //    落在该片段内或紧随其后时，按 Backspace 一次性删掉整段（后面用户输入的查询保留）。
      //    放在「菜单未打开」分支之前——因为带空格时菜单本就不显示。
      if (e.key === 'Backspace' && el.selectionStart === el.selectionEnd) {
        const match = /^\/([\w-]+)\s/.exec(value)
        const key = match?.[1]?.toLowerCase()
        if (match && key && commands.some((c) => c.key.toLowerCase() === key)) {
          const tokenEnd = match[0].length
          const pos = el.selectionStart ?? 0
          if (pos > 0 && pos <= tokenEnd) {
            e.preventDefault()
            handleValueChange(value.slice(tokenEnd))
            // 删除后剩下的是查询文本，光标落到开头。
            requestAnimationFrame(() => {
              el.selectionStart = 0
              el.selectionEnd = 0
            })
            return
          }
        }
      }

      if (!open) {
        return
      }

      const count = suggestions.length
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % count)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + count) % count)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        const choice = suggestions[activeIndex]
        if (choice) {
          select(choice)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setDismissed(true)
      }
    },
    [
      value,
      commands,
      open,
      suggestions,
      activeIndex,
      select,
      handleValueChange,
    ],
  )

  return {
    open,
    suggestions,
    activeIndex,
    onKeyDown,
    onValueChange: handleValueChange,
    select,
    setActiveIndex,
  }
}

// ============================================================================
// 展示组件（皮肤，可组合 / 可替换）
// ============================================================================

export type SlashCommandMenuProps = ComponentProps<'div'>

/** 命令菜单容器（圆角卡片 + 阴影 + 可滚动）。 */
export const SlashCommandMenu = ({
  className,
  ...props
}: SlashCommandMenuProps) => (
  <div
    className={cn(
      'max-h-80 overflow-y-auto rounded-2xl border border-border/70 bg-popover/95 p-1.5 shadow-[0_12px_40px_-16px_rgb(0_0_0/0.28)] backdrop-blur-xl',
      className,
    )}
    {...props}
    role='listbox'
  />
)

export type SlashCommandItemProps = ComponentProps<'button'> & {
  /** 是否为当前高亮项（键盘选中或鼠标悬停）。 */
  active?: boolean
}

/** 单行命令项（图标 + 名称 + 描述，单行布局，高亮整行底色）。 */
export const SlashCommandItem = ({
  className,
  active,
  ...props
}: SlashCommandItemProps) => (
  <button
    aria-selected={active}
    className={cn(
      'group flex h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-left outline-none transition-colors',
      active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60',
      className,
    )}
    type='button'
    {...props}
    role='option'
  />
)

export type SlashCommandItemLabelProps = ComponentProps<'span'>

/** 命令名称（加粗、不收缩）。 */
export const SlashCommandItemLabel = ({
  className,
  ...props
}: SlashCommandItemLabelProps) => (
  <span
    className={cn(
      'shrink-0 font-normal text-foreground text-sm leading-none',
      className,
    )}
    {...props}
  />
)

export type SlashCommandItemDescriptionProps = ComponentProps<'span'>

/** 命令描述（次要色、超长省略）。 */
export const SlashCommandItemDescription = ({
  className,
  ...props
}: SlashCommandItemDescriptionProps) => (
  <span
    className={cn(
      'ml-auto min-w-0 truncate text-right text-muted-foreground text-xs',
      className,
    )}
    {...props}
  />
)
