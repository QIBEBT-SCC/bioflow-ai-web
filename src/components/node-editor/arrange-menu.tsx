'use client'

import {
  ChevronDownIcon,
  LayoutGridIcon,
  UnlinkIcon,
  WandSparklesIcon,
  WorkflowIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { WorkflowLayoutMode } from '@/lib/workflow-layout'

interface ArrangeMenuProps {
  layoutDisabled?: boolean
  cleanEdgesDisabled?: boolean
  onLayout: (mode: WorkflowLayoutMode) => void
  onCleanEdges: () => void
}

const LAYOUT_OPTIONS = [
  { mode: 'standard', icon: WorkflowIcon },
  { mode: 'compact', icon: LayoutGridIcon },
] as const

function DescribedItem({
  icon,
  label,
  description,
  disabled,
  onSelect,
}: {
  icon: ReactNode
  label: string
  description: string
  disabled?: boolean
  onSelect: () => void
}) {
  return (
    <DropdownMenuItem
      className='items-start'
      disabled={disabled}
      onSelect={onSelect}
    >
      <span className='mt-0.5'>{icon}</span>
      <div className='flex flex-col gap-0.5'>
        <span>{label}</span>
        <span className='text-xs text-muted-foreground'>{description}</span>
      </div>
    </DropdownMenuItem>
  )
}

/** Toolbar "Arrange" menu: auto layout modes and canvas cleanup. */
export function ArrangeMenu({
  layoutDisabled,
  cleanEdgesDisabled,
  onLayout,
  onCleanEdges,
}: ArrangeMenuProps) {
  const t = useTranslations('editor')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          disabled={layoutDisabled && cleanEdgesDisabled}
        >
          <WandSparklesIcon className='size-4' />
          {t('arrange')}
          <ChevronDownIcon className='size-3.5 text-muted-foreground' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-64'>
        <DropdownMenuLabel className='text-xs font-normal text-muted-foreground'>
          {t('auto_layout')}
        </DropdownMenuLabel>
        {LAYOUT_OPTIONS.map(({ mode, icon: Icon }) => (
          <DescribedItem
            key={mode}
            icon={<Icon className='size-4' />}
            label={t(`layout_modes.${mode}.label`)}
            description={t(`layout_modes.${mode}.description`)}
            disabled={layoutDisabled}
            onSelect={() => onLayout(mode)}
          />
        ))}
        <DropdownMenuSeparator />
        <DescribedItem
          icon={<UnlinkIcon className='size-4' />}
          label={t('clean_dirty_edges')}
          description={t('clean_dirty_edges_description')}
          disabled={cleanEdgesDisabled}
          onSelect={onCleanEdges}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
