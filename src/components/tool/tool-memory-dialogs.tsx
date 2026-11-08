'use client'

import { cn } from 'cn'
import {
  CheckIcon,
  ChevronsUpDownIcon,
  Loader2Icon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Markdown } from '@/components/markdown'
import { SkillContentEditor } from '@/components/settings/skill-content-editor'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useSearchTools, useToolList } from '@/hooks/use-tool'
import {
  useCreateToolMemory,
  useDeleteToolMemory,
  useToolMemory,
  useUpdateToolMemory,
} from '@/hooks/use-tool-memory'
import type { ToolMemory, ToolMemoryListItem } from '@/types/tool-memory'

const DESCRIPTION_LIMIT = 120
const CONTENT_LIMIT = 8000
const TOOL_OPTION_LIMIT = 10

export interface ToolOption {
  uid: string
  name: string
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

/** Searchable tool combobox used by the page filter and the create form. */
export function ToolPicker({
  value,
  onChange,
  placeholder,
  id,
  className,
}: {
  value: ToolOption | null
  onChange: (tool: ToolOption) => void
  placeholder: string
  id?: string
  className?: string
}) {
  const t = useTranslations('tool.Memory')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query.trim())
  const search = useSearchTools(debouncedQuery, 0, TOOL_OPTION_LIMIT)
  const list = useToolList(0, TOOL_OPTION_LIMIT)
  const options = debouncedQuery ? search.data?.data : list.data?.data
  const isLoading = debouncedQuery ? search.isLoading : list.isLoading

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setQuery('')
      }}
      modal
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type='button'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn('justify-between font-normal', className)}
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value?.name ?? placeholder}
          </span>
          <ChevronsUpDownIcon className='size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-(--radix-popover-trigger-width) min-w-64 p-0'
        align='start'
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t('search_tool')}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {!isLoading && <CommandEmpty>{t('no_tool_found')}</CommandEmpty>}
            <CommandGroup>
              {options?.map((tool) => (
                <CommandItem
                  key={tool.uid}
                  value={tool.uid}
                  onSelect={() => {
                    onChange({ uid: tool.uid, name: tool.name })
                    setOpen(false)
                  }}
                >
                  <span className='truncate'>{tool.name}</span>
                  {value?.uid === tool.uid && (
                    <CheckIcon className='ml-auto size-4' />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function ToolMemoryForm({
  memory,
  initialTool,
  onDone,
}: {
  memory?: ToolMemory
  initialTool: ToolOption | null
  onDone: () => void
}) {
  const t = useTranslations('tool.Memory')
  const createMemory = useCreateToolMemory()
  const updateMemory = useUpdateToolMemory()
  const [tool, setTool] = useState(initialTool)
  const [description, setDescription] = useState(memory?.description ?? '')
  const [content, setContent] = useState(memory?.content ?? '')
  const isPending = createMemory.isPending || updateMemory.isPending

  const nextDescription = description.trim()
  const nextContent = content.trim()
  const isChanged =
    !memory ||
    nextDescription !== memory.description ||
    nextContent !== memory.content
  const canSave =
    !!tool &&
    !!nextDescription &&
    !!nextContent &&
    nextContent.length <= CONTENT_LIMIT &&
    isChanged

  const handleSubmit = async () => {
    if (!tool) return
    try {
      if (memory) {
        await updateMemory.mutateAsync({
          uid: memory.uid,
          data: {
            ...(nextDescription !== memory.description
              ? { description: nextDescription }
              : {}),
            ...(nextContent !== memory.content ? { content: nextContent } : {}),
          },
        })
        toast.success(t('update_success'))
      } else {
        await createMemory.mutateAsync({
          tool_uid: tool.uid,
          description: nextDescription,
          content: nextContent,
        })
        toast.success(t('create_success'))
      }
      onDone()
    } catch (error) {
      toast.error(
        errorMessage(error, t(memory ? 'update_failed' : 'create_failed')),
      )
    }
  }

  return (
    <>
      <div className='space-y-4 py-2'>
        <div className='space-y-2'>
          {memory ? (
            <>
              <p className='text-sm font-medium'>{t('tool')}</p>
              <p className='text-sm'>{tool?.name ?? memory.tool_uid}</p>
            </>
          ) : (
            <>
              <Label htmlFor='tool-memory-tool'>{t('tool')}</Label>
              <ToolPicker
                id='tool-memory-tool'
                value={tool}
                onChange={setTool}
                placeholder={t('select_tool')}
                className='w-full'
              />
            </>
          )}
        </div>
        <div className='space-y-2'>
          <div className='flex items-center justify-between gap-2'>
            <Label htmlFor='tool-memory-description'>{t('memory')}</Label>
            <span className='text-xs tabular-nums text-muted-foreground'>
              {description.length}/{DESCRIPTION_LIMIT}
            </span>
          </div>
          <Input
            id='tool-memory-description'
            value={description}
            maxLength={DESCRIPTION_LIMIT}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t('description_placeholder')}
          />
          <p className='text-xs text-muted-foreground'>
            {t('description_help')}
          </p>
        </div>
        <div className='space-y-2'>
          <div className='flex items-center justify-between gap-2'>
            <span className='text-sm font-medium'>{t('content')}</span>
            <span
              className={cn(
                'text-xs tabular-nums text-muted-foreground',
                content.length > CONTENT_LIMIT && 'text-destructive',
              )}
            >
              {content.length}/{CONTENT_LIMIT}
            </span>
          </div>
          <div className='overflow-hidden rounded-lg'>
            <SkillContentEditor
              filePath='memory.md'
              value={content}
              onChange={setContent}
              height='280px'
              initialMode='edit'
            />
          </div>
          <p className='text-xs text-muted-foreground'>{t('content_help')}</p>
        </div>
      </div>
      <DialogFooter>
        <Button variant='outline' onClick={onDone} disabled={isPending}>
          {t('cancel')}
        </Button>
        <Button onClick={handleSubmit} disabled={!canSave || isPending}>
          {isPending && <Loader2Icon className='size-4 animate-spin' />}
          {t(memory ? 'save' : 'create')}
        </Button>
      </DialogFooter>
    </>
  )
}

/** Creates a memory, or edits the one named by `memoryUid` once it has loaded. */
export function ToolMemoryFormDialog({
  memoryUid,
  tool,
  onClose,
}: {
  memoryUid?: string
  tool: ToolOption | null
  onClose: () => void
}) {
  const t = useTranslations('tool.Memory')
  const detail = useToolMemory(memoryUid ?? null)
  const isEditing = !!memoryUid

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>
            {t(isEditing ? 'edit_title' : 'create_title')}
          </DialogTitle>
          <DialogDescription>{t('shared_notice')}</DialogDescription>
        </DialogHeader>
        {isEditing && detail.isLoading && (
          <div className='space-y-3 py-2' aria-busy='true'>
            <span className='sr-only'>{t('loading')}</span>
            <Skeleton className='h-9 rounded-lg' />
            <Skeleton className='h-80 rounded-lg' />
          </div>
        )}
        {isEditing && detail.isError && (
          <Alert variant='destructive'>
            <AlertDescription>{t('load_failed')}</AlertDescription>
          </Alert>
        )}
        {(!isEditing || detail.data) && (
          <ToolMemoryForm
            memory={detail.data}
            initialTool={tool}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Shows one memory's full body, loaded only when it is opened. */
export function ToolMemoryDetailSheet({
  memory,
  onClose,
  onEdit,
  onDelete,
}: {
  memory: ToolMemoryListItem | null
  onClose: () => void
  onEdit: (memory: ToolMemoryListItem) => void
  onDelete: (memory: ToolMemoryListItem) => void
}) {
  const t = useTranslations('tool.Memory')
  const locale = useLocale()
  const detail = useToolMemory(memory?.uid ?? null)

  return (
    <Sheet open={!!memory} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='w-full gap-0 sm:max-w-2xl'>
        <SheetHeader className='border-b pr-12'>
          <SheetTitle className='leading-snug'>
            {memory?.description}
          </SheetTitle>
          <SheetDescription asChild>
            <div className='flex flex-col gap-1'>
              {memory && (
                <>
                  <Link
                    href={`/tool/${memory.tool_uid}`}
                    className='w-fit text-primary hover:underline'
                  >
                    {memory.tool_name}
                  </Link>
                  <span className='text-xs'>
                    {memory.creator_username ?? t('unknown_creator')} ·{' '}
                    {new Date(memory.created_at).toLocaleString(locale)}
                  </span>
                </>
              )}
              <code className='font-mono text-xs break-all'>{memory?.uid}</code>
            </div>
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className='min-h-0 flex-1'>
          <div className='p-4'>
            {detail.isLoading && (
              <div className='space-y-3' aria-busy='true'>
                <span className='sr-only'>{t('loading')}</span>
                <Skeleton className='h-5 w-3/4' />
                <Skeleton className='h-5 w-full' />
                <Skeleton className='h-5 w-2/3' />
              </div>
            )}
            {detail.isError && (
              <Alert variant='destructive'>
                <AlertDescription>{t('load_failed')}</AlertDescription>
              </Alert>
            )}
            {detail.data && <Markdown>{detail.data.content}</Markdown>}
          </div>
        </ScrollArea>
        {memory && (
          <div className='flex justify-end gap-2 border-t p-4'>
            <Button
              variant='outline'
              className='text-destructive hover:text-destructive'
              onClick={() => onDelete(memory)}
            >
              <Trash2Icon className='size-4' />
              {t('delete')}
            </Button>
            <Button onClick={() => onEdit(memory)}>
              <PencilIcon className='size-4' />
              {t('edit')}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export function DeleteToolMemoryDialog({
  memory,
  onClose,
  onDeleted,
}: {
  memory: ToolMemoryListItem | null
  onClose: () => void
  onDeleted: () => void
}) {
  const t = useTranslations('tool.Memory')
  const deleteMemory = useDeleteToolMemory()

  const handleDelete = async () => {
    if (!memory) return
    try {
      await deleteMemory.mutateAsync(memory.uid)
      toast.success(t('delete_success'))
      onDeleted()
    } catch (error) {
      toast.error(errorMessage(error, t('delete_failed')))
    }
  }

  return (
    <AlertDialog open={!!memory} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('delete_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('delete_description', {
              description: memory?.description ?? '',
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMemory.isPending}>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMemory.isPending}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
