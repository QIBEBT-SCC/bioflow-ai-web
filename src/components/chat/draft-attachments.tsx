'use client'

import { FileWarningIcon, RotateCcwIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AgentImage } from '@/components/chat/agent-image'
import { AgentPDF } from '@/components/chat/agent-pdf'
import { AgentWorkflowNode } from '@/components/chat/agent-workflow-node'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment'
import { InputGroupAddon } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import type { ChatAttachmentDraft } from '@/hooks/use-chat-attachment'
import type { AgentWorkflowNodePart } from '@/types/agent'

function RemoveAction({
  label,
  disabled,
  onClick,
}: {
  label: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <AttachmentAction
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <XIcon />
    </AttachmentAction>
  )
}

/** A draft that is still uploading or failed to upload. */
function PendingDraft({
  draft,
  disabled,
  onRetry,
  onRemove,
}: {
  draft: ChatAttachmentDraft
  disabled: boolean
  onRetry: (id: string) => void
  onRemove: (id: string) => void
}) {
  const t = useTranslations('Chat.images')
  const isPDF = /\.pdf$/i.test(draft.filename)

  return (
    <Attachment
      size='sm'
      state={draft.error ? 'error' : isPDF ? 'processing' : 'uploading'}
      className='max-w-52'
      aria-live='polite'
    >
      <AttachmentMedia>
        {draft.error ? <FileWarningIcon /> : <Spinner />}
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle title={draft.filename}>
          {draft.filename}
        </AttachmentTitle>
        <AttachmentDescription title={draft.error}>
          {draft.error ?? t(isPDF ? 'pdf_parsing' : 'preparing')}
        </AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        {draft.error && draft.file && (
          <AttachmentAction
            aria-label={t('retry')}
            title={t('retry')}
            disabled={disabled}
            onClick={() => onRetry(draft.id)}
          >
            <RotateCcwIcon />
          </AttachmentAction>
        )}
        <RemoveAction
          label={t('remove', { name: draft.filename })}
          disabled={disabled}
          onClick={() => onRemove(draft.id)}
        />
      </AttachmentActions>
    </Attachment>
  )
}

/** Attachments waiting to be sent, shown above the composer text. */
export function DraftAttachments({
  drafts,
  onRemove,
  onRetry,
  disabled,
  node,
  onRemoveNode,
}: {
  drafts: ChatAttachmentDraft[]
  onRemove: (id: string) => void
  onRetry: (id: string) => void
  disabled: boolean
  node?: AgentWorkflowNodePart | null
  onRemoveNode?: () => void
}) {
  const t = useTranslations('Chat.images')
  if (drafts.length === 0 && !node) return null

  return (
    <InputGroupAddon align='block-start' className='px-2 pt-2'>
      <AttachmentGroup className='w-full' aria-label={t('attachments')}>
        {node && (
          <AgentWorkflowNode
            node={node}
            actions={
              <RemoveAction
                label={t('remove', { name: node.name })}
                disabled={disabled}
                onClick={() => onRemoveNode?.()}
              />
            }
          />
        )}
        {drafts.map((draft) => {
          const remove = (
            <RemoveAction
              label={t('remove', { name: draft.filename })}
              disabled={disabled}
              onClick={() => onRemove(draft.id)}
            />
          )
          if (draft.image)
            return (
              <AgentImage
                key={draft.id}
                image={draft.image}
                variant='thumb'
                actions={remove}
              />
            )
          if (draft.pdf)
            return <AgentPDF key={draft.id} pdf={draft.pdf} actions={remove} />
          return (
            <PendingDraft
              key={draft.id}
              draft={draft}
              disabled={disabled}
              onRetry={onRetry}
              onRemove={onRemove}
            />
          )
        })}
      </AttachmentGroup>
    </InputGroupAddon>
  )
}
