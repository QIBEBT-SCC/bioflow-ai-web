import * as React from 'react'

import { loadHighlighter } from '@/lib/highlighter'

export function useHighlightedCode(
  value: string,
  language: string,
  lineOffset = 0,
) {
  // A trailing newline would render as an extra empty line.
  const code = value.endsWith('\n') ? value.slice(0, -1) : value
  const [loaded, setLoaded] = React.useState<{
    language: string
    highlighter: Awaited<ReturnType<typeof loadHighlighter>>
  } | null>(null)
  const highlighter = loaded?.language === language ? loaded.highlighter : null

  React.useEffect(() => {
    let cancelled = false

    loadHighlighter(language)
      .then((next) => {
        if (!cancelled) {
          setLoaded({ language, highlighter: next })
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [language])

  // The complete lines, highlighted. While the code streams, only the new
  // lines are tokenized, starting from the grammar state of the last one.
  const [done, setDone] = React.useState<{
    highlighter: typeof highlighter
    lineOffset: number
    text: string
    lines: React.ReactNode[]
    state?: Parameters<NonNullable<typeof highlighter>['highlight']>[1]
  }>({ highlighter: null, lineOffset: 0, text: '', lines: [] })

  let next = done

  if (next.highlighter !== highlighter) {
    next = { highlighter, lineOffset, text: '', lines: [] }
  } else if (!code.startsWith(next.text)) {
    let reused = false
    if (language.toLowerCase() === 'ansi' && lineOffset > next.lineOffset) {
      const dropped = lineOffset - next.lineOffset
      if (dropped < next.lines.length) {
        let cutPos = 0
        for (let i = 0; i < dropped; i++) {
          const idx = next.text.indexOf('\n', cutPos)
          if (idx === -1) {
            cutPos = -1
            break
          }
          cutPos = idx + 1
        }
        if (cutPos !== -1) {
          const trimmedText = next.text.slice(cutPos)
          if (code.startsWith(trimmedText)) {
            next = {
              highlighter,
              lineOffset,
              text: trimmedText,
              lines: next.lines.slice(dropped),
              state: next.state,
            }
            reused = true
          }
        }
      }
    }
    if (!reused) {
      next = { highlighter, lineOffset, text: '', lines: [] }
    }
  } else if (next.lineOffset !== lineOffset) {
    next = { ...next, lineOffset }
  }

  const end = code.lastIndexOf('\n') + 1

  if (highlighter && end > next.text.length) {
    const result = highlighter.highlight(
      code.slice(next.text.length, end - 1),
      next.state,
    )

    next = {
      highlighter,
      lineOffset,
      text: code.slice(0, end),
      lines: [...next.lines, ...result.lines],
      state: result.state,
    }
  }

  if (next !== done) {
    setDone(next)
  }

  // The last line is still being written, so it is tokenized on every render.
  const tail = code.slice(end)

  return React.useMemo(() => {
    if (!highlighter) {
      return code.split('\n')
    }

    return [...next.lines, highlighter.highlight(tail, next.state).lines[0]]
  }, [code, highlighter, next, tail])
}
