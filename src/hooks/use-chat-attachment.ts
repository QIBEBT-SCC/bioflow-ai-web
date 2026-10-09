'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  prepareAgentImage,
  uploadAgentPDF,
} from '@/app/actions/chat-attachment'
import type { AgentImagePart, AgentPDFPart } from '@/types/agent'

export const CHAT_ATTACHMENT_ACCEPT =
  '.png,.jpg,.jpeg,.webp,.tif,.tiff,.svg,.pdf'
const MAX_ATTACHMENTS = 4
const MAX_BYTES = 20 * 1024 * 1024

export interface ChatAttachmentDraft {
  id: string
  filename: string
  image?: AgentImagePart
  pdf?: AgentPDFPart
  file?: File
  error?: string
}

export function useChatAttachments(sessionId: string | null) {
  const t = useTranslations('Chat.images')
  const [drafts, setDrafts] = useState<ChatAttachmentDraft[]>([])
  const [error, setError] = useState<string | null>(null)
  const pending = useRef(new Map<string, AbortController>())
  const ids = useRef(new Set<string>())
  const scope = useRef(sessionId)

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

  const clear = useCallback(() => {
    for (const controller of pending.current.values()) controller.abort()
    pending.current.clear()
    ids.current.clear()
    setDrafts([])
    setError(null)
  }, [])

  useEffect(() => {
    if (scope.current !== sessionId) {
      scope.current = sessionId
      clear()
    }
  }, [sessionId, clear])

  const startPreparation = (draft: ChatAttachmentDraft) => {
    const { id, file } = draft
    if (!file || pending.current.has(id)) return
    const controller = new AbortController()
    pending.current.set(id, controller)
    const work = /\.pdf$/i.test(file.name)
      ? uploadAgentPDF(file, controller.signal).then((pdf) => {
          if (controller.signal.aborted || !ids.current.has(id)) return
          setDrafts((current) =>
            current.map((currentDraft) =>
              currentDraft.id === id ? { ...currentDraft, pdf } : currentDraft,
            ),
          )
        })
      : prepareAgentImage(file, controller.signal).then((image) => {
          if (controller.signal.aborted || !ids.current.has(id)) return
          setDrafts((current) =>
            current.map((currentDraft) =>
              currentDraft.id === id
                ? { ...currentDraft, image }
                : currentDraft,
            ),
          )
        })
    void work
      .catch((cause: unknown) => {
        if (controller.signal.aborted || !ids.current.has(id)) return
        setDrafts((current) =>
          current.map((currentDraft) =>
            currentDraft.id === id
              ? {
                  ...currentDraft,
                  error: cause instanceof Error ? cause.message : t('failed'),
                }
              : currentDraft,
          ),
        )
      })
      .finally(() => {
        if (pending.current.get(id) === controller) pending.current.delete(id)
      })
  }

  const retry = (id: string) => {
    const draft = drafts.find((item) => item.id === id)
    if (!draft || !draft.file || !draft.error || pending.current.has(id)) return
    setDrafts((current) =>
      current.map((item) =>
        item.id === id ? { ...item, error: undefined } : item,
      ),
    )
    startPreparation(draft)
  }

  const addFiles = (files: File[]) => {
    setError(null)
    if (ids.current.size + files.length > MAX_ATTACHMENTS) {
      setError(t('too_many'))
      return
    }
    for (const file of files) {
      const id = crypto.randomUUID()
      ids.current.add(id)
      const invalid = !/\.(png|jpe?g|webp|tiff?|svg|pdf)$/i.test(file.name)
        ? t('unsupported')
        : file.size > MAX_BYTES
          ? t('too_large')
          : null
      const draft = {
        id,
        filename: file.name,
        ...(!invalid ? { file } : { error: invalid }),
      }
      setDrafts((current) => [...current, draft])
      if (invalid) continue
      startPreparation(draft)
    }
  }

  return {
    drafts,
    error,
    images: drafts.flatMap((draft) => (draft.image ? [draft.image] : [])),
    pdfs: drafts.flatMap((draft) => (draft.pdf ? [draft.pdf] : [])),
    blocked: drafts.some(
      (draft) => Boolean(draft.error) || (!draft.image && !draft.pdf),
    ),
    addFiles,
    remove,
    clear,
    retry,
  }
}
