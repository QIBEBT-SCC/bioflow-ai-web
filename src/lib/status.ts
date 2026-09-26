import {
  BanIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  Clock3Icon,
  ListOrderedIcon,
  Loader2Icon,
  type LucideIcon,
  XCircleIcon,
} from 'lucide-react'
import type { NodeRunStatusV2, WorkflowRunStatusV2 } from '@/types/workflow-v2'

export type RunStatus = `${NodeRunStatusV2}` | `${WorkflowRunStatusV2}`

export type StatusTone = 'neutral' | 'warning' | 'info' | 'success' | 'danger'

/** Semantic tones backed by the theme's status tokens. */
export const statusToneClasses: Record<
  StatusTone,
  { badge: string; text: string; dot: string; soft: string }
> = {
  neutral: {
    badge: 'border-border bg-muted text-muted-foreground',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground/60',
    soft: 'bg-muted',
  },
  warning: {
    badge: 'border-warning/30 bg-warning/10 text-warning',
    text: 'text-warning',
    dot: 'bg-warning',
    soft: 'bg-warning/10',
  },
  info: {
    badge: 'border-info/30 bg-info/10 text-info',
    text: 'text-info',
    dot: 'bg-info',
    soft: 'bg-info/10',
  },
  success: {
    badge: 'border-success/30 bg-success/10 text-success',
    text: 'text-success',
    dot: 'bg-success',
    soft: 'bg-success/10',
  },
  danger: {
    badge: 'border-destructive/30 bg-destructive/10 text-destructive',
    text: 'text-destructive',
    dot: 'bg-destructive',
    soft: 'bg-destructive/10',
  },
}

/** One appearance per run/node status, shared by every run view. */
export const RUN_STATUS_APPEARANCE: Record<
  RunStatus,
  { labelKey: string; icon: LucideIcon; tone: StatusTone }
> = {
  pending: { labelKey: 'pending', icon: Clock3Icon, tone: 'warning' },
  ready: { labelKey: 'ready', icon: CircleDotIcon, tone: 'warning' },
  queued: { labelKey: 'queued', icon: ListOrderedIcon, tone: 'neutral' },
  running: { labelKey: 'running', icon: Loader2Icon, tone: 'info' },
  succeeded: { labelKey: 'succeeded', icon: CheckCircle2Icon, tone: 'success' },
  failed: { labelKey: 'failed', icon: XCircleIcon, tone: 'danger' },
  blocked: { labelKey: 'blocked', icon: BanIcon, tone: 'neutral' },
}
