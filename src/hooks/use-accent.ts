'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { setUserAccent } from '@/app/actions/theme'
import { type AccentColor, defaultAccent, isAccentColor } from '@/lib/theme'

// The active accent lives on <html data-accent>, set server-side from a cookie.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-accent'],
  })
  return () => observer.disconnect()
}

function getSnapshot(): AccentColor {
  const value = document.documentElement.dataset.accent
  return isAccentColor(value) ? value : defaultAccent
}

function getServerSnapshot(): AccentColor {
  return defaultAccent
}

export function useAccent(failureMessage: string) {
  const accent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setAccent = useCallback(
    async (next: AccentColor) => {
      const previous = getSnapshot()
      if (next === previous) return
      // Apply immediately; the cookie only matters for the next page load.
      document.documentElement.dataset.accent = next
      try {
        await setUserAccent(next)
      } catch {
        document.documentElement.dataset.accent = previous
        toast.error(failureMessage)
      }
    },
    [failureMessage],
  )

  return [accent, setAccent] as const
}
