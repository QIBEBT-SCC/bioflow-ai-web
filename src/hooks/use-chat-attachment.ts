'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { prepareAgentImage } from '@/app/actions/chat-attachment'
import type { AgentImagePart } from '@/types/agent'

export const IMAGE_ATTACHMENT_ACCEPT = '.png,.jpg,.jpeg,.webp,.tif,.tiff,.svg'
const MAX_IMAGES = 4
const MAX_BYTES = 20 * 1024 * 1024

export interface ChatAttachmentDraft {
  id: string
  filename: string
  image?: AgentImagePart
  error?: string
}

export function useChatAttachments() {
  const t = useTranslations('Chat.images')
  const [drafts, setDrafts] = useState<ChatAttachmentDraft[]>([])
  const [error, setError] = useState<string | null>(null)
  const pending = useRef(new Map<string, AbortController>())
  const ids = useRef(new Set<string>())

  useEffect(() => {
    const controllers = pending.current
    return () => {
      for (const controller of controllers.values()) controller.abort()
      controllers.clear()
    }
  }, [])

  const remove = (id: string) => {
    setError(null)
    pending.current.get(id)?.abort()
    pending.current.delete(id)
    ids.current.delete(id)
    setDrafts((current) => current.filter((draft) => draft.id !== id))
  }

  const clear = () => {
    for (const controller of pending.current.values()) controller.abort()
    pending.current.clear()
    ids.current.clear()
    setDrafts([])
    setError(null)
  }

  const addFiles = (files: File[]) => {
    setError(null)
    if (ids.current.size + files.length > MAX_IMAGES) {
      setError(t('too_many'))
      return
    }
    for (const file of files) {
      const id = crypto.randomUUID()
      ids.current.add(id)
      const invalid = !/\.(png|jpe?g|webp|tiff?|svg)$/i.test(file.name)
        ? t('unsupported')
        : file.size > MAX_BYTES
          ? t('too_large')
          : null
      setDrafts((current) => [
        ...current,
        { id, filename: file.name, ...(invalid ? { error: invalid } : {}) },
      ])
      if (invalid) continue
      const controller = new AbortController()
      pending.current.set(id, controller)
      void prepareAgentImage(file, controller.signal)
        .then((image) => {
          if (controller.signal.aborted || !ids.current.has(id)) return
          setDrafts((current) =>
            current.map((draft) =>
              draft.id === id ? { ...draft, image } : draft,
            ),
          )
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted || !ids.current.has(id)) return
          setDrafts((current) =>
            current.map((draft) =>
              draft.id === id
                ? {
                    ...draft,
                    error: cause instanceof Error ? cause.message : t('failed'),
                  }
                : draft,
            ),
          )
        })
        .finally(() => pending.current.delete(id))
    }
  }

  return {
    drafts,
    error,
    images: drafts.flatMap((draft) => (draft.image ? [draft.image] : [])),
    blocked: drafts.some((draft) => !draft.image),
    addFiles,
    remove,
    clear,
  }
}
