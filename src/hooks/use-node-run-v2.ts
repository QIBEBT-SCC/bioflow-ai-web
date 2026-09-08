'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { getNodeRunLog } from '@/app/actions/node-run-v2'

export function useNodeRunLogStream(uid: string, isRunning: boolean) {
  const { data: initial } = useQuery({
    queryKey: ['node-run-log', uid],
    queryFn: () => getNodeRunLog(uid),
    enabled: !!uid,
    staleTime: 5_000,
  })
  const [streamed, setStreamed] = useState<{
    uid: string
    content: string
  } | null>(null)

  useEffect(() => {
    if (!uid || !isRunning || !initial) return
    const source = new EventSource(
      `/api/v2/node-runs/${uid}/log/stream?offset=${initial.offset}`,
      { withCredentials: true },
    )
    source.onmessage = (event) => {
      try {
        const chunk = (JSON.parse(event.data) as { content: string }).content
        setStreamed((current) => ({
          uid,
          content:
            (current?.uid === uid ? current.content : initial.content) + chunk,
        }))
      } catch {}
    }
    return () => source.close()
  }, [uid, isRunning, initial])

  return streamed?.uid === uid ? streamed.content : (initial?.content ?? null)
}
