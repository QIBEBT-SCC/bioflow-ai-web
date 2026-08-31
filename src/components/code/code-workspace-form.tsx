'use client'

import {
  ArrowLeftIcon,
  CheckIcon,
  Loader2Icon,
  SaveIcon,
  Settings2Icon,
  SparklesIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { type FormEvent, useReducer } from 'react'
import { CodeSourceEditor } from '@/components/code/code-source-editor'
import { CodeTypeBadge } from '@/components/code/code-type-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateCode,
  useGenerateCodeMetadata,
  useUpdateCode,
} from '@/hooks/use-code'
import type { CodeInfo, CodeNodeType } from '@/types/code'

type CodeWorkspaceFormProps =
  | {
      mode: 'create'
      code?: never
      nodeType: CodeNodeType
      onComplete: (uid: string) => void
    }
  | {
      mode: 'edit'
      code: CodeInfo
      nodeType?: never
      onComplete: (uid: string) => void
    }

interface WorkspaceState {
  source: string
  dependencies: string[]
  name: string
  description: string
  metadataOpen: boolean
}

type WorkspaceAction =
  | { type: 'setSource'; value: string }
  | { type: 'setDependencies'; value: string[] }
  | { type: 'setName'; value: string }
  | { type: 'setDescription'; value: string }
  | { type: 'setMetadataOpen'; value: boolean }
  | { type: 'setMetadata'; name: string; description: string }

function initializeWorkspace(
  initialCode: CodeInfo | undefined,
): WorkspaceState {
  return {
    source: initialCode?.code ?? '',
    dependencies: initialCode?.dependencies ?? [],
    name: initialCode?.name ?? '',
    description: initialCode?.description ?? '',
    metadataOpen: false,
  }
}

function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState {
  switch (action.type) {
    case 'setSource':
      return { ...state, source: action.value }
    case 'setDependencies':
      return { ...state, dependencies: action.value }
    case 'setName':
      return { ...state, name: action.value }
    case 'setDescription':
      return { ...state, description: action.value }
    case 'setMetadataOpen':
      return { ...state, metadataOpen: action.value }
    case 'setMetadata':
      return {
        ...state,
        name: action.name,
        description: action.description,
      }
  }
}

function sameDependencies(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((dependency, index) => dependency === right[index])
  )
}

export function CodeWorkspaceForm(props: CodeWorkspaceFormProps) {
  const t = useTranslations('code.Workspace')
  const createMutation = useCreateCode()
  const updateMutation = useUpdateCode()
  const metadataMutation = useGenerateCodeMetadata()
  const initialCode = props.mode === 'edit' ? props.code : undefined
  const nodeType = props.mode === 'edit' ? props.code.node_type : props.nodeType
  const [workspace, dispatch] = useReducer(
    workspaceReducer,
    initialCode,
    initializeWorkspace,
  )
  const { source, dependencies, name, description, metadataOpen } = workspace
  const isPython = nodeType === 'code_python'
  const isR = nodeType === 'code_R'
  const supportsDependencies = isPython || isR
  const filename = isPython ? 'script.py' : isR ? 'script.R' : 'script.sh'
  const isSaving =
    props.mode === 'create'
      ? createMutation.isPending
      : updateMutation.isPending
  const canSave =
    source.trim().length > 0 &&
    name.trim().length > 0 &&
    description.trim().length > 0
  const isDirty =
    props.mode === 'create'
      ? source.length > 0 || dependencies.length > 0
      : source !== props.code.code ||
        name !== props.code.name ||
        description !== props.code.description ||
        !sameDependencies(dependencies, props.code.dependencies)
  const statusText =
    props.mode === 'create' ? t('newNode') : isDirty ? t('unsaved') : t('saved')

  const generateMetadata = () => {
    if (!source.trim() || metadataMutation.isPending) return
    metadataMutation.mutate(
      {
        node_type: nodeType,
        code: source,
        dependencies: supportsDependencies ? dependencies : [],
      },
      {
        onSuccess: (metadata) => {
          dispatch({
            type: 'setMetadata',
            name: metadata.name,
            description: metadata.description,
          })
        },
      },
    )
  }

  const saveCode = () => {
    if (!canSave || isSaving) return
    const payload = {
      name: name.trim(),
      description: description.trim(),
      code: source,
      dependencies: supportsDependencies ? dependencies : [],
    }

    if (props.mode === 'create') {
      createMutation.mutate(
        { ...payload, node_type: nodeType },
        { onSuccess: (createdCode) => props.onComplete(createdCode.uid) },
      )
      return
    }

    updateMutation.mutate(
      { uid: props.code.uid, code: payload },
      { onSuccess: (updatedCode) => props.onComplete(updatedCode.uid) },
    )
  }

  const submitMetadata = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveCode()
  }

  const returnHref = props.mode === 'edit' ? `/code/${props.code.uid}` : '/code'

  return (
    <div className='flex h-full min-h-0 flex-col bg-background'>
      <div className='flex h-12 shrink-0 items-center justify-between gap-3 border-b bg-background px-3'>
        <div className='flex min-w-0 items-center gap-2'>
          <Button type='button' variant='ghost' size='sm' asChild>
            <Link href={returnHref}>
              <ArrowLeftIcon className='size-4' />
              <span className='hidden sm:inline'>{t('back')}</span>
            </Link>
          </Button>
          <Separator orientation='vertical' className='mx-1 h-5!' />
          <span className='truncate font-mono text-sm'>{filename}</span>
          <CodeTypeBadge nodeType={nodeType} />
          <span className='ml-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
            <span
              className={
                props.mode === 'create'
                  ? 'size-1.5 rounded-full bg-blue-400'
                  : isDirty
                    ? 'size-1.5 rounded-full bg-amber-400'
                    : 'size-1.5 rounded-full bg-emerald-400'
              }
            />
            {statusText}
          </span>
        </div>

        <div className='flex shrink-0 items-center gap-2'>
          {props.mode === 'edit' && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => dispatch({ type: 'setMetadataOpen', value: true })}
            >
              <Settings2Icon className='size-4' />
              {t('nodeInfo')}
            </Button>
          )}
          <Button
            type='button'
            size='sm'
            onClick={() => {
              if (props.mode === 'create') {
                dispatch({ type: 'setMetadataOpen', value: true })
                return
              }
              saveCode()
            }}
            disabled={
              !source.trim() || isSaving || (props.mode === 'edit' && !isDirty)
            }
          >
            {isSaving ? (
              <Loader2Icon className='size-4 animate-spin' />
            ) : (
              <SaveIcon className='size-4' />
            )}
            {isSaving ? t('saving') : t('saveCode')}
          </Button>
        </div>
      </div>

      <div className='min-h-0 flex-1'>
        <CodeSourceEditor
          nodeType={nodeType}
          code={source}
          dependencies={dependencies}
          onCodeChange={(value) => dispatch({ type: 'setSource', value })}
          onDependenciesChange={(value) =>
            dispatch({ type: 'setDependencies', value })
          }
        />
      </div>

      <Dialog
        open={metadataOpen}
        onOpenChange={(open) =>
          dispatch({ type: 'setMetadataOpen', value: open })
        }
      >
        <DialogContent className='sm:max-w-2xl'>
          <form onSubmit={submitMetadata} className='grid gap-5'>
            <div className='flex flex-col justify-between gap-3 pr-7 sm:flex-row sm:items-start'>
              <DialogHeader>
                <DialogTitle>{t('detailsTitle')}</DialogTitle>
                <DialogDescription>{t('detailsDescription')}</DialogDescription>
              </DialogHeader>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={generateMetadata}
                disabled={!source.trim() || metadataMutation.isPending}
              >
                {metadataMutation.isPending ? (
                  <Loader2Icon className='size-4 animate-spin' />
                ) : (
                  <SparklesIcon className='size-4 text-violet-500' />
                )}
                {metadataMutation.isPending
                  ? t('generating')
                  : name || description
                    ? t('regenerateMetadata')
                    : t('generateMetadata')}
              </Button>
            </div>

            <div className='grid gap-5'>
              <div className='space-y-2'>
                <Label htmlFor='code-name'>{t('name')}</Label>
                <Input
                  id='code-name'
                  value={name}
                  onChange={(event) =>
                    dispatch({
                      type: 'setName',
                      value: event.target.value,
                    })
                  }
                  maxLength={100}
                  placeholder={t('namePlaceholder')}
                  required
                  autoFocus
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='code-description'>{t('description')}</Label>
                <Textarea
                  id='code-description'
                  value={description}
                  onChange={(event) =>
                    dispatch({
                      type: 'setDescription',
                      value: event.target.value,
                    })
                  }
                  className='min-h-36 resize-y'
                  placeholder={t('descriptionPlaceholder')}
                  required
                />
                <p className='text-xs text-muted-foreground'>
                  {t('descriptionHint')}
                </p>
              </div>
            </div>

            <div className='flex flex-wrap gap-x-6 gap-y-2 rounded-lg bg-muted px-4 py-3 text-xs text-muted-foreground'>
              <span>
                {t('language')}: {isPython ? 'Python' : isR ? 'R' : 'Bash'}
              </span>
              <span>
                {t('lines')}: {Math.max(1, source.split('\n').length)}
              </span>
              {isPython && (
                <span>
                  {t('dependencies')}: {dependencies.length}
                </span>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type='button' variant='outline'>
                  {t('cancel')}
                </Button>
              </DialogClose>
              <Button type='submit' disabled={!canSave || isSaving}>
                {isSaving ? (
                  <Loader2Icon className='size-4 animate-spin' />
                ) : props.mode === 'create' ? (
                  <CheckIcon className='size-4' />
                ) : (
                  <SaveIcon className='size-4' />
                )}
                {isSaving
                  ? t('saving')
                  : props.mode === 'create'
                    ? t('create')
                    : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
