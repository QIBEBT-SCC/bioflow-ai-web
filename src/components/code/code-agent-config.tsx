'use client'

import { ChevronDownIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CodeAgentConfigOption } from '@/types/code-agent'

export function CodeAgentConfig({
  options,
  disabled,
  onChange,
}: {
  options: CodeAgentConfigOption[]
  disabled: boolean
  onChange: (id: string, value: string) => void
}) {
  const t = useTranslations('code.Agent')
  const visible = options.filter(
    (option) =>
      option.type === 'select' &&
      ['model', 'thought_level'].includes(option.category ?? ''),
  )
  if (!visible.length) return null
  return (
    <div className='flex min-w-0 items-center gap-1'>
      {visible.map((option) => {
        const choices = option.options.flatMap((choice) =>
          'options' in choice ? choice.options : [choice],
        )
        const selected = choices.find(
          (choice) => choice.value === option.currentValue,
        )
        const label = option.category === 'model' ? t('model') : t('reasoning')
        return (
          <DropdownMenu key={option.id}>
            <DropdownMenuTrigger asChild>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                aria-label={label}
                title={selected?.name ?? option.currentValue}
                disabled={disabled}
                className='h-7 min-w-0 max-w-[65%] gap-1 px-2 text-xs font-normal text-muted-foreground hover:text-foreground'
              >
                <span className='truncate'>
                  {selected?.name ?? option.currentValue}
                </span>
                <ChevronDownIcon className='size-3 shrink-0' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side='top'
              align='start'
              sideOffset={8}
              className='min-w-48 max-w-[min(22rem,calc(100vw-2rem))]'
            >
              <DropdownMenuLabel className='text-xs text-muted-foreground'>
                {label}
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={option.currentValue}
                onValueChange={(value) => onChange(option.id, value)}
              >
                {option.options.map((choice) =>
                  'options' in choice ? (
                    <div key={choice.name}>
                      <DropdownMenuLabel className='text-xs text-muted-foreground'>
                        {choice.name}
                      </DropdownMenuLabel>
                      {choice.options.map((item) => (
                        <DropdownMenuRadioItem
                          key={item.value}
                          value={item.value}
                        >
                          {item.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </div>
                  ) : (
                    <DropdownMenuRadioItem
                      key={choice.value}
                      value={choice.value}
                    >
                      {choice.name}
                    </DropdownMenuRadioItem>
                  ),
                )}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      })}
    </div>
  )
}
