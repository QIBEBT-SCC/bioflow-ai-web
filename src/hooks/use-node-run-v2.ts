'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { getNodeRunLog } from '@/app/actions/node-run-v2'

export function useNodeRunLogStream(
  uid: string,
  isRunning: boolean,
  enabled = true,
) {
  const { data: initial } = useQuery({
    queryKey: ['node-run-log', uid],
    queryFn: () => getNodeRunLog(uid),
    enabled: enabled && !!uid,
    staleTime: 5_000,
    refetchOnWindowFocus: !isRunning,
  })
  const [streamed, setStreamed] = useState<{
    uid: string
    content: string
  } | null>(null)
  const initialContentRef = useRef('')
  initialContentRef.current = initial?.content ?? ''
  const initialOffset = initial?.offset

  useEffect(() => {
    if (!enabled || !uid || !isRunning || initialOffset === undefined) return
    const source = new EventSource(
      `/api/v2/node-runs/${uid}/log/stream?offset=${initialOffset}`,
      { withCredentials: true },
    )
    source.onmessage = (event) => {
      try {
        const chunk = (JSON.parse(event.data) as { content: string }).content
        setStreamed((current) => ({
          uid,
          content:
            (current?.uid === uid
              ? current.content
              : initialContentRef.current) + chunk,
        }))
      } catch {}
    }
    return () => source.close()
  }, [uid, isRunning, enabled, initialOffset])

  if (!enabled) return null
  return streamed?.uid === uid ? streamed.content : (initial?.content ?? null)
}
