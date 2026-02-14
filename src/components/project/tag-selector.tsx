import { useState } from 'react'
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
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
import { Badge } from '@/components/ui/badge'
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
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState('')

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
                    className={cn(
                        'w-full justify-between h-auto min-h-10 p-1',
                        className
                    )}
                >
                    <div className='flex flex-wrap gap-1'>
                        {value.length === 0 && (
                            <span className='text-muted-foreground ml-2 font-normal'>
                                Select tags...
                            </span>
                        )}
                        {value.map((tag) => (
                            <Badge
                                key={tag.id === -1 ? `new-${tag.name}` : tag.id}
                                variant='secondary'
                                className={cn('mr-1', colorClassMap[tag.color] || 'bg-secondary')}
                            >
                                {tag.name}
                                <div
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
                                    onClick={() => handleUnselect(tag)}
                                >
                                    <X className='h-3 w-3 text-muted-foreground hover:text-foreground' />
                                </div>
                            </Badge>
                        ))}
                    </div>
                    <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50 mr-2' />
                </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[400px] p-0' align="start">
                <Command>
                    <CommandInput
                        placeholder='Search tags...'
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {allowCreate && inputValue ? (
                                <div
                                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent rounded-sm text-sm"
                                    onClick={handleCreate}
                                >
                                    <Plus className="h-4 w-4" />
                                    Create tag "{inputValue}"
                                </div>
                            ) : (
                                "No tags found."
                            )}
                        </CommandEmpty>
                        <CommandGroup heading='Tags'>
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
                                                'mr-2 h-4 w-4',
                                                isSelected ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                        <div className="flex items-center gap-2">
                                            <span className={cn("w-3 h-3 rounded-full", colorClassMap[tag.color] || "bg-slate-400")}></span>
                                            {tag.name}
                                        </div>
                                        {/* Show color badge preview if possible, but just name is essential */}
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                        {allowCreate && inputValue && !availableTags.some(t => t.name.toLowerCase() === inputValue.toLowerCase()) && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="Actions">
                                    <CommandItem onSelect={handleCreate} value={`create-${inputValue}`}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create tag "{inputValue}"
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
