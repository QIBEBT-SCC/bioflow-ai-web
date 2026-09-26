'use client'

import { useCallback, useSyncExternalStore } from 'react'
import {
  ACCENT_COOKIE,
  type AccentColor,
  defaultAccent,
  isAccentColor,
} from '@/lib/theme'

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

export function useAccent() {
  const accent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setAccent = useCallback((next: AccentColor) => {
    document.documentElement.dataset.accent = next
    // A plain UI preference: the root layout reads it on the next page load.
    // biome-ignore lint/suspicious/noDocumentCookie: no sensitive data; mirrors the locale cookie
    document.cookie = `${ACCENT_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
  }, [])

  return [accent, setAccent] as const
}
