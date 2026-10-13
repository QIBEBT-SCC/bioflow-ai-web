'use client'

import {
  ChevronDownIcon,
  LayoutGridIcon,
  WandSparklesIcon,
  WorkflowIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { WorkflowLayoutMode } from '@/lib/workflow-layout'

interface AutoLayoutMenuProps {
  disabled?: boolean
  onLayout: (mode: WorkflowLayoutMode) => void
}

const LAYOUT_OPTIONS = [
  { mode: 'standard', icon: WorkflowIcon },
  { mode: 'compact', icon: LayoutGridIcon },
] as const

export function AutoLayoutMenu({ disabled, onLayout }: AutoLayoutMenuProps) {
  const t = useTranslations('editor')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='sm' disabled={disabled}>
          <WandSparklesIcon className='size-4' />
          {t('auto_layout')}
          <ChevronDownIcon className='size-3.5 text-muted-foreground' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-64'>
        {LAYOUT_OPTIONS.map(({ mode, icon: Icon }) => (
          <DropdownMenuItem
            key={mode}
            className='items-start'
            onSelect={() => onLayout(mode)}
          >
            <Icon className='mt-0.5 size-4' />
            <div className='flex flex-col gap-0.5'>
              <span>{t(`layout_modes.${mode}.label`)}</span>
              <span className='text-xs text-muted-foreground'>
                {t(`layout_modes.${mode}.description`)}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
