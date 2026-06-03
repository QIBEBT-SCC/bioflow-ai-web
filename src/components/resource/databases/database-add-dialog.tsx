'use client'

import { useTranslations } from 'next-intl'
import type React from 'react'
import { useReducer } from 'react'
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
import { useCreateDB } from '@/hooks/use-resource'

interface DatabaseAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FormState = {
  name: string
  description: string
  path: string
  lastUpdate: string
  nameError: string
  pathError: string
}

type FormAction =
  | {
      type: 'SET_FIELD'
      field: keyof Pick<
        FormState,
        'name' | 'description' | 'path' | 'lastUpdate'
      >
      value: string
    }
  | { type: 'SET_ERROR'; field: 'nameError' | 'pathError'; value: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'RESET' }

const INITIAL_STATE: FormState = {
  name: '',
  description: '',
  path: '',
  lastUpdate: '',
  nameError: '',
  pathError: '',
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'SET_ERROR':
      return { ...state, [action.field]: action.value }
    case 'CLEAR_ERRORS':
      return { ...state, nameError: '', pathError: '' }
    case 'RESET':
      return INITIAL_STATE
  }
}

export function DatabaseAddDialog({
  open,
  onOpenChange,
}: DatabaseAddDialogProps) {
  const [
    { name, description, path, lastUpdate, nameError, pathError },
    dispatch,
  ] = useReducer(formReducer, INITIAL_STATE)

  const t = useTranslations('resource')
  const createMutation = useCreateDB()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch({ type: 'CLEAR_ERRORS' })

    const newDb = {
      name,
      description: description || undefined,
      path,
      last_update: lastUpdate || '',
    }

    createMutation.mutate(newDb, {
      onSuccess: () => {
        onOpenChange(false)
        dispatch({ type: 'RESET' })
      },
      onError: (error: Error & { status?: number }) => {
        const status = error.status
        switch (status) {
          case 409:
            dispatch({
              type: 'SET_ERROR',
              field: 'nameError',
              value: t('name_exists'),
            })
            break
          case 404:
            dispatch({
              type: 'SET_ERROR',
              field: 'pathError',
              value: t('path_not_found'),
            })
            break
          default:
            // toast 已在 hook 中处理
            break
        }
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('add_new_database')}</DialogTitle>
            <DialogDescription>{t('add_new_database_desc')}</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>
                {t('database_name')} <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='name'
                value={name}
                onChange={(e) => {
                  dispatch({
                    type: 'SET_FIELD',
                    field: 'name',
                    value: e.target.value,
                  })
                  if (nameError)
                    dispatch({
                      type: 'SET_ERROR',
                      field: 'nameError',
                      value: '',
                    })
                }}
                required
                disabled={createMutation.isPending}
                className={
                  nameError ? 'border-red-500 focus-visible:ring-red-500' : ''
                }
              />
              {nameError && (
                <p className='text-sm text-red-500 mt-1'>{nameError}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>{t('description_label')}</Label>
              <Textarea
                id='description'
                value={description}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_FIELD',
                    field: 'description',
                    value: e.target.value,
                  })
                }
                disabled={createMutation.isPending}
                className='min-h-[100px]'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='path'>
                {t('file_path')} <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='path'
                value={path}
                onChange={(e) => {
                  dispatch({
                    type: 'SET_FIELD',
                    field: 'path',
                    value: e.target.value,
                  })
                  if (pathError)
                    dispatch({
                      type: 'SET_ERROR',
                      field: 'pathError',
                      value: '',
                    })
                }}
                required
                disabled={createMutation.isPending}
                className={
                  pathError ? 'border-red-500 focus-visible:ring-red-500' : ''
                }
              />
              {pathError && (
                <p className='text-sm text-red-500 mt-1'>{pathError}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='version'>{t('update_time')}</Label>
              <Input
                id='version'
                value={lastUpdate}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_FIELD',
                    field: 'lastUpdate',
                    value: e.target.value,
                  })
                }
                disabled={createMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                onOpenChange(false)
                dispatch({ type: 'CLEAR_ERRORS' })
              }}
              disabled={createMutation.isPending}
            >
              {t('cancel')}
            </Button>
            <Button type='submit' disabled={createMutation.isPending}>
              {createMutation.isPending ? t('adding') : t('add_database')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
