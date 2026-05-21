'use client'

import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

// ── 叶子节点 ──────────────────────────────────────────────────────────────────

function JsonString({ value }: { value: string }) {
  return (
    <span className='text-green-600 dark:text-green-400'>
      &quot;{value}&quot;
    </span>
  )
}

function JsonPrimitive({ value }: { value: number | boolean | null }) {
  if (value === null)
    return <span className='text-rose-500 dark:text-rose-400'>null</span>
  if (typeof value === 'boolean')
    return (
      <span className='text-violet-600 dark:text-violet-400'>
        {String(value)}
      </span>
    )
  return (
    <span className='text-amber-600 dark:text-amber-400'>{String(value)}</span>
  )
}

// ── 折叠按钮 ──────────────────────────────────────────────────────────────────

function CollapseToggle({
  collapsed,
  onClick,
}: {
  collapsed: boolean
  onClick: () => void
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='inline-flex items-center rounded-sm text-muted-foreground hover:text-foreground transition-colors'
    >
      <ChevronRight
        className={cn('size-3 transition-transform', !collapsed && 'rotate-90')}
      />
    </button>
  )
}

// ── 复合节点 ──────────────────────────────────────────────────────────────────

function JsonArray({ value, depth }: { value: JsonValue[]; depth: number }) {
  const [collapsed, setCollapsed] = useState(depth >= 2)

  if (value.length === 0)
    return <span className='text-muted-foreground'>[]</span>

  return (
    <span>
      <CollapseToggle
        collapsed={collapsed}
        onClick={() => setCollapsed((c) => !c)}
      />
      <span className='text-foreground'>[</span>
      {collapsed ? (
        <button
          type='button'
          onClick={() => setCollapsed(false)}
          className='mx-1 rounded px-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground'
        >
          {value.length} {value.length === 1 ? 'item' : 'items'}
        </button>
      ) : (
        <div className='ml-4 border-l border-border pl-3'>
          {Array.from(value.entries()).map(([itemIndex, item]) => (
            <div key={`item-${itemIndex}`} className='my-px'>
              <JsonNode value={item} depth={depth + 1} />
              {itemIndex < value.length - 1 && (
                <span className='text-muted-foreground'>,</span>
              )}
            </div>
          ))}
        </div>
      )}
      <span className='text-foreground'>]</span>
    </span>
  )
}

function JsonObject({
  value,
  depth,
}: {
  value: { [key: string]: JsonValue }
  depth: number
}) {
  const [collapsed, setCollapsed] = useState(depth >= 2)
  const entries = Object.entries(value)

  if (entries.length === 0)
    return <span className='text-muted-foreground'>{'{}'}</span>

  return (
    <span>
      <CollapseToggle
        collapsed={collapsed}
        onClick={() => setCollapsed((c) => !c)}
      />
      <span className='text-foreground'>{'{'}</span>
      {collapsed ? (
        <button
          type='button'
          onClick={() => setCollapsed(false)}
          className='mx-1 rounded px-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground'
        >
          {entries.length} {entries.length === 1 ? 'key' : 'keys'}
        </button>
      ) : (
        <div className='ml-4 border-l border-border pl-3'>
          {entries.map(([k, v], i) => (
            <div key={k} className='my-px'>
              <span className='text-blue-600 dark:text-blue-400'>
                &quot;{k}&quot;
              </span>
              <span className='text-muted-foreground'>: </span>
              <JsonNode value={v} depth={depth + 1} />
              {i < entries.length - 1 && (
                <span className='text-muted-foreground'>,</span>
              )}
            </div>
          ))}
        </div>
      )}
      <span className='text-foreground'>{'}'}</span>
    </span>
  )
}

// ── 节点分发 ──────────────────────────────────────────────────────────────────

function JsonNode({ value, depth = 0 }: { value: JsonValue; depth?: number }) {
  if (typeof value === 'string') return <JsonString value={value} />
  if (Array.isArray(value)) return <JsonArray value={value} depth={depth} />
  if (value !== null && typeof value === 'object')
    return <JsonObject value={value} depth={depth} />
  return <JsonPrimitive value={value} />
}

// ── 公开组件 ──────────────────────────────────────────────────────────────────

interface JsonViewerProps {
  content: string
}

export function JsonViewer({ content }: JsonViewerProps) {
  let parsed: JsonValue
  try {
    parsed = JSON.parse(content) as JsonValue
  } catch {
    // 解析失败则降级为纯文本
    return (
      <ScrollArea className='size-full'>
        <pre className='p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words'>
          {content}
        </pre>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea className='size-full'>
      <div className='p-4 font-mono text-sm leading-relaxed'>
        <JsonNode value={parsed} depth={0} />
      </div>
    </ScrollArea>
  )
}
