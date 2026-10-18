'use client'

import { useTranslations } from 'next-intl'
import type React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { useCreateDB, useUpdateDB } from '@/hooks/use-resource'
import { cn } from '@/lib/utils'
import type { BioDb } from '@/types/resource'

interface DatabaseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Existing entry to edit; omit to create a new one. */
  database?: BioDb
  onSaved?: (database: BioDb) => void
}

type FormValues = {
  name: string
  description: string
  path: string
  download_command: string
  download_image: string
  last_update: string
}

type FormErrors = { name?: string; source?: string }

function toFormValues(database?: BioDb): FormValues {
  return {
    name: database?.name ?? '',
    description: database?.description ?? '',
    path: database?.path ?? '',
    download_command: database?.download_command ?? '',
    download_image: database?.download_image ?? '',
    last_update: database?.last_update ?? '',
  }
}

const errorInputClass = 'border-destructive focus-visible:ring-destructive'

export function DatabaseFormDialog({
  open,
  onOpenChange,
  database,
  onSaved,
}: DatabaseFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-xl'>
        {/* DialogContent unmounts on close, so the form re-initialises on every open. */}
        <DatabaseForm
          database={database}
          onCancel={() => onOpenChange(false)}
          onSaved={(saved) => {
            onOpenChange(false)
            onSaved?.(saved)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function DatabaseForm({
  database,
  onCancel,
  onSaved,
}: {
  database?: BioDb
  onCancel: () => void
  onSaved: (database: BioDb) => void
}) {
  const t = useTranslations('resource')
  const isEdit = database !== undefined
  const [values, setValues] = useState(() => toFormValues(database))
  const [errors, setErrors] = useState<FormErrors>({})
  const createMutation = useCreateDB()
  const updateMutation = useUpdateDB()
  const isPending = createMutation.isPending || updateMutation.isPending

  const setField = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (field === 'name' && errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }))
    }
    if ((field === 'path' || field === 'download_command') && errors.source) {
      setErrors((prev) => ({ ...prev, source: undefined }))
    }
  }

  const handleError = (error: Error & { status?: number }) => {
    if (error.status === 409) setErrors({ name: t('name_exists') })
    else if (error.status === 422) setErrors({ source: t('source_required') })
    else setErrors({ source: error.message || t('save_failed') })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value.trim()]),
    ) as FormValues

    if (!trimmed.path && !trimmed.download_command) {
      setErrors({ source: t('source_required') })
      return
    }
    setErrors({})

    if (isEdit) {
      // Blank optional fields are sent as null so they are cleared.
      updateMutation.mutate(
        {
          id: database.id,
          data: {
            name: trimmed.name,
            description: trimmed.description || null,
            path: trimmed.path || null,
            download_command: trimmed.download_command || null,
            download_image: trimmed.download_image || null,
            last_update: trimmed.last_update || null,
          },
        },
        { onSuccess: onSaved, onError: handleError },
      )
      return
    }

    createMutation.mutate(
      {
        name: trimmed.name,
        description: trimmed.description || undefined,
        path: trimmed.path || undefined,
        download_command: trimmed.download_command || undefined,
        download_image: trimmed.download_image || undefined,
        last_update: trimmed.last_update || undefined,
      },
      { onSuccess: onSaved, onError: handleError },
    )
  }

  return (
    <form onSubmit={handleSubmit} className='min-w-0 space-y-6'>
      <DialogHeader>
        <DialogTitle>
          {isEdit ? t('edit_database') : t('add_new_database')}
        </DialogTitle>
        <DialogDescription>
          {isEdit ? t('edit_database_desc') : t('add_new_database_desc')}
        </DialogDescription>
      </DialogHeader>

      <fieldset disabled={isPending} className='min-w-0 space-y-4'>
        <legend className='sr-only'>{t('basic_info')}</legend>
        <div className='space-y-2'>
          <Label htmlFor='db-name'>
            {t('database_name')} <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='db-name'
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            required
            aria-invalid={Boolean(errors.name)}
            className={cn(errors.name && errorInputClass)}
          />
          {errors.name && (
            <p className='text-sm text-destructive'>{errors.name}</p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='db-description'>{t('description_label')}</Label>
          <Textarea
            id='db-description'
            value={values.description}
            onChange={(e) => setField('description', e.target.value)}
            className='min-h-20'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='db-last-update'>{t('update_time')}</Label>
          <Input
            id='db-last-update'
            value={values.last_update}
            placeholder={t('update_time_placeholder')}
            onChange={(e) => setField('last_update', e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset
        disabled={isPending}
        className='min-w-0 space-y-4 border-t pt-5'
      >
        <legend className='sr-only'>{t('data_source')}</legend>
        <div className='space-y-1'>
          <p className='text-sm font-medium'>{t('data_source')}</p>
          <p className='text-xs text-muted-foreground'>{t('source_hint')}</p>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='db-path'>{t('file_path')}</Label>
          <Input
            id='db-path'
            value={values.path}
            placeholder={t('path_placeholder')}
            onChange={(e) => setField('path', e.target.value)}
            aria-invalid={Boolean(errors.source)}
            className={cn('font-mono', errors.source && errorInputClass)}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='db-download-command'>{t('download_command')}</Label>
          <Textarea
            id='db-download-command'
            value={values.download_command}
            placeholder={t('download_command_placeholder')}
            onChange={(e) => setField('download_command', e.target.value)}
            aria-invalid={Boolean(errors.source)}
            className={cn(
              'min-h-20 font-mono',
              errors.source && errorInputClass,
            )}
          />
          {errors.source && (
            <p className='text-sm text-destructive'>{errors.source}</p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='db-download-image'>{t('download_image')}</Label>
          <Input
            id='db-download-image'
            value={values.download_image}
            placeholder={t('download_image_placeholder')}
            onChange={(e) => setField('download_image', e.target.value)}
            className='font-mono'
          />
          <p className='text-xs text-muted-foreground'>
            {t('download_image_hint')}
          </p>
        </div>
      </fieldset>

      <DialogFooter>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          disabled={isPending}
        >
          {t('cancel')}
        </Button>
        <Button type='submit' disabled={isPending}>
          {isEdit
            ? isPending
              ? t('saving')
              : t('save')
            : isPending
              ? t('adding')
              : t('add_database')}
        </Button>
      </DialogFooter>
    </form>
  )
}
