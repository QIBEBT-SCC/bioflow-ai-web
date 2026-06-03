'use client'

import { PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useReducer, useState } from 'react'
import { TagSelector } from '@/components/project/tag-selector'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateProject, useProjectTags } from '@/hooks/use-project'
import type { ProjectTag } from '@/types/project'

type FormState = {
  name: string
  description: string
  is_public: boolean
  tags: ProjectTag[]
}
type FormAction =
  | { type: 'SET_NAME'; value: string }
  | { type: 'SET_DESCRIPTION'; value: string }
  | { type: 'SET_PUBLIC'; value: boolean }
  | { type: 'SET_TAGS'; value: ProjectTag[] }
  | { type: 'RESET' }

const INITIAL_FORM: FormState = {
  name: '',
  description: '',
  is_public: false,
  tags: [],
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.value }
    case 'SET_DESCRIPTION':
      return { ...state, description: action.value }
    case 'SET_PUBLIC':
      return { ...state, is_public: action.value }
    case 'SET_TAGS':
      return { ...state, tags: action.value }
    case 'RESET':
      return INITIAL_FORM
  }
}

export function NewProjectDialog() {
  const t = useTranslations('Project.create')
  const [{ name, description, is_public, tags }, dispatch] = useReducer(
    formReducer,
    INITIAL_FORM,
  )
  const [open, setOpen] = useState(false)

  const { data: availableTags = [] } = useProjectTags()
  const { mutate: createProject, isPending } = useCreateProject()

  const handleCreate = () => {
    if (!name) return
    const newProject = {
      name: name,
      description: description,
      public: is_public,
      tag_ids: tags.map((tag) => tag.id),
    }

    createProject(
      { data: newProject },
      {
        onSuccess: () => {
          setOpen(false)
          dispatch({ type: 'RESET' })
        },
        onError: (e) => {
          // 错误处理
          console.log(e)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className='size-4 mr-2' />
          {t('trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className='flex-row gap-y-3'>
          <div className='flex gap-y-2 pt-2'>
            <div className='flex-1/2 gap-y-2 pt-2'>
              <Label htmlFor='name'>{t('name')}</Label>
              <Input
                id='name'
                placeholder={t('namePlaceholder')}
                required
                value={name}
                onChange={(e) =>
                  dispatch({ type: 'SET_NAME', value: e.target.value })
                }
              />
            </div>
            <div className='flex-1 space-y-2 pt-2 pl-5'>
              <Label htmlFor='public'>{t('public')}</Label>
              <Checkbox
                id='public'
                className='mx-3 mt-2'
                checked={is_public}
                onCheckedChange={(checked) =>
                  dispatch({ type: 'SET_PUBLIC', value: checked as boolean })
                }
              />
            </div>
          </div>
          <div className='space-y-2 pt-2'>
            <Label htmlFor='description'>{t('projectDescription')}</Label>
            <Textarea
              id='description'
              placeholder={t('descriptionPlaceholder')}
              required
              value={description}
              onChange={(e) =>
                dispatch({ type: 'SET_DESCRIPTION', value: e.target.value })
              }
            />
          </div>
          <div className='space-y-2 pt-2'>
            <Label>{t('projectTag')}</Label>
            <TagSelector
              availableTags={availableTags}
              onChange={(tags) => dispatch({ type: 'SET_TAGS', value: tags })}
              value={tags}
            />
          </div>
        </div>
        <DialogFooter className='sm:justify-end'>
          <Button type='button' onClick={handleCreate} disabled={isPending}>
            {isPending ? t('creating') : t('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
