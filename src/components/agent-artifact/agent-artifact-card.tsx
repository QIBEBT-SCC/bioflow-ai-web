'use client'

import {
  ClipboardListIcon,
  FileCheck2Icon,
  FileClockIcon,
  FileSearchIcon,
  LockIcon,
  PencilIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { AgentArtifactSheet } from '@/components/agent-artifact/agent-artifact-sheet'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AgentArtifact, AgentArtifactKind } from '@/types/agent-artifact'

const icons: Record<AgentArtifactKind, typeof FileClockIcon> = {
  plan: ClipboardListIcon,
  samples: FileCheck2Icon,
  diagnosis: FileSearchIcon,
  update: FileClockIcon,
}

interface AgentArtifactCardProps {
  file: AgentArtifact
  compact?: boolean
  className?: string
}

export function AgentArtifactCard({
  file,
  compact = false,
  className,
}: AgentArtifactCardProps) {
  const t = useTranslations('Project.agentArtifacts')
  const [open, setOpen] = useState(false)
  const Icon = icons[file.kind]

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        className={cn(
          'group flex w-full items-center gap-3 rounded-lg border bg-card text-left shadow-sm transition-colors hover:border-foreground/30 hover:bg-accent/30',
          compact ? 'p-2.5' : 'p-4',
          className,
        )}
      >
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
            compact ? 'size-9' : 'size-11',
          )}
        >
          <Icon className={compact ? 'size-4' : 'size-5'} />
        </span>
        <span className='min-w-0 flex-1'>
          <span className='flex items-center gap-2'>
            <span className='truncate font-medium text-sm'>{file.name}</span>
            {file.editable ? (
              <PencilIcon className='size-3.5 shrink-0 text-muted-foreground' />
            ) : (
              <LockIcon className='size-3.5 shrink-0 text-muted-foreground' />
            )}
          </span>
          <span className='mt-1 flex items-center gap-2 text-muted-foreground text-xs'>
            <Badge variant='outline'>{t(`kinds.${file.kind}`)}</Badge>
            {!compact && (
              <>
                {file.agent_name && (
                  <span>{t(`agents.${file.agent_name}`)}</span>
                )}
                {file.run_status && (
                  <Badge variant='secondary'>
                    {t(`statuses.${file.run_status}`)}
                  </Badge>
                )}
                <span>{new Date(file.updated_at).toLocaleString()}</span>
              </>
            )}
          </span>
        </span>
      </button>
      <AgentArtifactSheet file={file} open={open} onOpenChange={setOpen} />
    </>
  )
}
