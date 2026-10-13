'use client'

import {
  AlertCircle,
  FileQuestion,
  Info,
  Maximize,
  SearchIcon,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/** Control row at the top of every preview. */
export function PreviewToolbar({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-wrap items-center gap-2 border-b bg-muted/20 px-3 py-2',
        className,
      )}
      {...props}
    />
  )
}

/** Thin status line at the bottom of a preview (counts, hints, paging). */
export function PreviewFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex min-h-9 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t px-3 py-1.5 text-xs text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

/** Compact `label value` pair used in preview summaries. */
export function PreviewStat({
  label,
  value,
  className,
}: {
  label: React.ReactNode
  value: React.ReactNode
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-baseline gap-1', className)}>
      <span className='text-muted-foreground'>{label}</span>
      <span className='font-medium text-foreground tabular-nums'>{value}</span>
    </span>
  )
}

/** Indeterminate bar shown over content while a newer request is in flight. */
export function PreviewProgress({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div
      role='progressbar'
      aria-busy='true'
      className='pointer-events-none absolute inset-x-0 top-0 z-30 h-0.5 overflow-hidden bg-primary/15'
    >
      <div className='h-full w-1/3 animate-[preview-progress_1.1s_ease-in-out_infinite] bg-primary' />
    </div>
  )
}

export function PreviewLoading({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <div
      aria-busy='true'
      className={cn('flex size-full flex-col gap-3 p-4', className)}
    >
      <span className='sr-only'>{label}</span>
      <div className='flex gap-2'>
        <Skeleton className='h-8 w-40' />
        <Skeleton className='h-8 w-28' />
        <Skeleton className='h-8 w-52' />
      </div>
      <Skeleton className='min-h-40 flex-1 rounded-xl' />
      <p className='text-center text-xs text-muted-foreground'>{label}</p>
    </div>
  )
}

export function PreviewError({
  title,
  message,
  action,
  className,
}: {
  title?: string
  message: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      role='alert'
      className={cn(
        'flex size-full items-center justify-center p-6',
        className,
      )}
    >
      <Empty className='max-w-lg border border-dashed border-destructive/30'>
        <EmptyHeader>
          <EmptyMedia
            variant='icon'
            className='bg-destructive/10 text-destructive'
          >
            <AlertCircle />
          </EmptyMedia>
          {title && <EmptyTitle>{title}</EmptyTitle>}
          <EmptyDescription className='break-words'>{message}</EmptyDescription>
        </EmptyHeader>
        {action}
      </Empty>
    </div>
  )
}

export function PreviewEmpty({
  title,
  description,
  icon,
  className,
}: {
  title: string
  description?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex size-full items-center justify-center p-6',
        className,
      )}
    >
      <Empty className='max-w-md border border-dashed'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>{icon ?? <FileQuestion />}</EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          {description && <EmptyDescription>{description}</EmptyDescription>}
        </EmptyHeader>
      </Empty>
    </div>
  )
}

/** Search box with a leading icon and a clear button. */
export function PreviewSearch({
  value,
  onChange,
  onSubmit,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  placeholder: string
  className?: string
}) {
  const t = useTranslations('Project.runDetail.fileViewer')
  return (
    <InputGroup className={cn('h-8 w-52 bg-background', className)}>
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        aria-label={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSubmit?.()
          if (event.key === 'Escape') onChange('')
        }}
        placeholder={placeholder}
        className='text-xs'
      />
      {value && (
        <InputGroupAddon align='inline-end'>
          <InputGroupButton
            size='icon-xs'
            aria-label={t('clearSearch')}
            onClick={() => onChange('')}
          >
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

/** Labelled switch sized to sit inline with toolbar controls. */
export function PreviewSwitch({
  id,
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string
  label: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className='flex h-8 items-center gap-2 px-1'>
      <Switch
        id={id}
        size='sm'
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
      <Label
        htmlFor={id}
        className={cn('text-xs font-normal', disabled && 'opacity-50')}
      >
        {label}
      </Label>
    </div>
  )
}

export function IconTooltipButton({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type={props.asChild ? undefined : 'button'}
          variant='outline'
          size='icon-sm'
          aria-label={label}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** Zoom out / zoom in / reset group with tooltips. */
export function ZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
  zoomInLabel,
  zoomOutLabel,
  resetLabel,
  disabled,
  canZoomIn = true,
  canZoomOut = true,
  className,
}: {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset?: () => void
  zoomInLabel: string
  zoomOutLabel: string
  resetLabel?: string
  disabled?: boolean
  canZoomIn?: boolean
  canZoomOut?: boolean
  className?: string
}) {
  return (
    <ButtonGroup className={className}>
      <IconTooltipButton
        label={zoomOutLabel}
        onClick={onZoomOut}
        disabled={disabled || !canZoomOut}
      >
        <ZoomOut />
      </IconTooltipButton>
      <IconTooltipButton
        label={zoomInLabel}
        onClick={onZoomIn}
        disabled={disabled || !canZoomIn}
      >
        <ZoomIn />
      </IconTooltipButton>
      {onReset && resetLabel && (
        <IconTooltipButton
          label={resetLabel}
          onClick={onReset}
          disabled={disabled}
        >
          <Maximize />
        </IconTooltipButton>
      )}
    </ButtonGroup>
  )
}

/** Small info icon that reveals a longer hint on hover/focus. */
export function PreviewHint({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Project.runDetail.fileViewer')
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type='button'
          aria-label={t('help')}
          className='inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground'
        >
          <Info className='size-3.5' />
        </button>
      </TooltipTrigger>
      <TooltipContent className='max-w-80 text-pretty'>
        {children}
      </TooltipContent>
    </Tooltip>
  )
}

/** Floating readout that follows the pointer inside a relatively positioned parent. */
export function PreviewHoverCard({
  x,
  y,
  bounds,
  children,
}: {
  x: number
  y: number
  bounds: { width: number; height: number }
  children: React.ReactNode
}) {
  const flipX = x > bounds.width - 240
  const flipY = y > bounds.height - 96
  return (
    <div
      className='pointer-events-none absolute z-20 max-w-60 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md'
      style={{
        left: flipX ? undefined : x + 14,
        right: flipX ? bounds.width - x + 14 : undefined,
        top: flipY ? undefined : y + 14,
        bottom: flipY ? bounds.height - y + 14 : undefined,
      }}
    >
      {children}
    </div>
  )
}

/** Resolve a CSS custom property (e.g. `--primary`) for canvas drawing. */
export function readCssColor(
  element: Element,
  name: string,
  fallback: string,
): string {
  const value = getComputedStyle(element).getPropertyValue(name).trim()
  return value || fallback
}

export function formatBasePairs(value: number): string {
  if (value >= 1_000_000) return `${+(value / 1_000_000).toFixed(2)} Mb`
  if (value >= 1_000) return `${+(value / 1_000).toFixed(1)} kb`
  return `${value} bp`
}
