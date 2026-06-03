import { Check, ChevronsUpDown, Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { colorClassMap } from '@/types/color'
import type { ProjectTag } from '@/types/project'

interface TagSelectorProps {
  availableTags: ProjectTag[]
  value: ProjectTag[]
  onChange: (tags: ProjectTag[]) => void
  allowCreate?: boolean
  className?: string
}

export function TagSelector({
  availableTags,
  value,
  onChange,
  allowCreate = true,
  className,
}: TagSelectorProps) {
  const t = useTranslations('Project.tagSelector')
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const listboxId = 'tag-selector-listbox'

  const handleUnselect = (tagToRemove: ProjectTag) => {
    onChange(value.filter((tag) => tag.name !== tagToRemove.name))
  }

  const handleSelect = (tag: ProjectTag) => {
    // Check if already selected
    if (value.some((t) => t.name === tag.name)) {
      handleUnselect(tag)
    } else {
      onChange([...value, tag])
    }
    setOpen(false)
    setInputValue('')
  }

  const handleCreate = () => {
    if (!inputValue) return
    const newTag: ProjectTag = {
      id: -1,
      name: inputValue,
      color: 'slate', // Default color
    }
    handleSelect(newTag)
  }

  // Filter available tags to exclude already selected ones (optional, or just show checked)
  // Here we show all but mark selected with Check icon

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          aria-controls={listboxId}
          className={cn(
            'w-full justify-between h-auto min-h-10 p-1',
            className,
          )}
        >
          <div className='flex flex-wrap gap-1'>
            {value.length === 0 && (
              <span className='text-muted-foreground ml-2 font-normal'>
                {t('placeholder')}
              </span>
            )}
            {value.map((tag) => (
              <Badge
                key={tag.id === -1 ? `new-${tag.name}` : tag.id}
                variant='secondary'
                className={cn(
                  'mr-1',
                  colorClassMap[tag.color] || 'bg-secondary',
                )}
              >
                {tag.name}
                {/** biome-ignore lint/a11y/useSemanticElements: no need */}
                <span
                  role='button'
                  tabIndex={0}
                  className='ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUnselect(tag)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUnselect(tag)
                  }}
                >
                  <X className='size-3 text-muted-foreground hover:text-foreground' />
                </span>
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50 mr-2' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[400px] p-0' align='start'>
        <Command>
          <CommandInput
            placeholder={t('searchPlaceholder')}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList id={listboxId}>
            <CommandEmpty>
              {allowCreate && inputValue ? (
                <button
                  type='button'
                  className='flex w-full justify-center items-center gap-2 p-2 cursor-pointer hover:bg-accent rounded-sm text-sm'
                  onClick={handleCreate}
                >
                  <Plus className='size-4' />
                  {t('createTag', { name: inputValue })}
                </button>
              ) : (
                t('empty')
              )}
            </CommandEmpty>
            <CommandGroup heading={t('heading')}>
              {availableTags.map((tag) => {
                const isSelected = value.some((t) => t.name === tag.name)
                return (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => handleSelect(tag)}
                  >
                    <Check
                      className={cn(
                        'mr-2 size-4',
                        isSelected ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <div className='flex items-center gap-2'>
                      <span
                        className={cn(
                          'size-3 rounded-full',
                          colorClassMap[tag.color] || 'bg-slate-400',
                        )}
                      ></span>
                      {tag.name}
                    </div>
                    {/* Show color badge preview if possible, but just name is essential */}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {allowCreate &&
              inputValue &&
              !availableTags.some(
                (t) => t.name.toLowerCase() === inputValue.toLowerCase(),
              ) && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={t('actions')}>
                    <CommandItem
                      onSelect={handleCreate}
                      value={`create-${inputValue}`}
                    >
                      <Plus className='mr-2 size-4' />
                      {t('createTag', { name: inputValue })}
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
