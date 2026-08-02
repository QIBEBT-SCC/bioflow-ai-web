'use client'

import {
  BookOpenIcon,
  FileCodeIcon,
  FilePlusIcon,
  Loader2Icon,
  PlusIcon,
  SaveIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useReducer, useState } from 'react'
import { toast } from 'sonner'
import { SkillContentEditor } from '@/components/settings/skill-content-editor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateSkill,
  useSkill,
  useSkillCatalog,
  useSkillResource,
  useUpdateSkill,
  useUpdateSkillResource,
} from '@/hooks/use-skill'
import type { AgentSkills, SkillDetail, SkillResource } from '@/types/skill'

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function buildSkillContent(
  name: string,
  description: string,
  instructions: string,
) {
  const indentedDescription = description
    .trim()
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n')
  return `---
name: ${name}
description: >-
${indentedDescription}
---

${instructions.trim()}
`
}

function AddSkillDialog({
  agentName,
  onCreated,
}: {
  agentName: string
  onCreated: (skillName: string) => void
}) {
  const t = useTranslations('setting.skill_management')
  const createSkill = useCreateSkill()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('# Instructions\n\n')

  const reset = () => {
    setName('')
    setDescription('')
    setInstructions('# Instructions\n\n')
  }

  const handleCreate = async () => {
    try {
      const skill = await createSkill.mutateAsync({
        agentName,
        data: {
          name,
          content: buildSkillContent(name, description, instructions),
        },
      })
      toast.success(t('create_success'))
      setOpen(false)
      reset()
      onCreated(skill.name)
    } catch (error) {
      toast.error(errorMessage(error, t('create_failed')))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen && !createSkill.isPending) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button size='sm' disabled={!agentName}>
          <PlusIcon className='size-4' />
          {t('add_skill')}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('add_skill_title')}</DialogTitle>
          <DialogDescription>
            {t('add_skill_description', { agent: agentName })}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <div className='space-y-2'>
            <Label htmlFor='skill-name'>{t('skill_name')}</Label>
            <Input
              id='skill-name'
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder='example-skill'
              className='font-mono'
            />
            <p className='text-xs text-muted-foreground'>{t('name_help')}</p>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='skill-description'>{t('skill_description')}</Label>
            <Textarea
              id='skill-description'
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t('description_placeholder')}
              className='min-h-20'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='skill-instructions'>{t('instructions')}</Label>
            <Textarea
              id='skill-instructions'
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              className='min-h-56 font-mono text-sm'
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={createSkill.isPending}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              createSkill.isPending ||
              !name.trim() ||
              !description.trim() ||
              !instructions.trim()
            }
          >
            {createSkill.isPending && (
              <Loader2Icon className='size-4 animate-spin' />
            )}
            {t('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SkillSourceEditor({ skill }: { skill: SkillDetail }) {
  const t = useTranslations('setting.skill_management')
  const updateSkill = useUpdateSkill()
  const [content, setContent] = useReducer(
    (_current: string, next: string) => next,
    skill.content,
  )
  const changed = content !== skill.content

  const handleSave = async () => {
    try {
      await updateSkill.mutateAsync({
        agentName: skill.agent_name,
        skillName: skill.name,
        data: { content },
      })
      toast.success(t('save_success'))
    } catch (error) {
      toast.error(errorMessage(error, t('save_failed')))
    }
  }

  return (
    <Card className='gap-0 overflow-hidden p-0'>
      <div className='flex items-center justify-between gap-4 border-b px-5 py-4'>
        <div className='min-w-0'>
          <div className='flex items-center gap-2'>
            <FileCodeIcon className='size-4 text-primary' />
            <h2 className='truncate font-semibold'>SKILL.md</h2>
          </div>
          <p className='mt-1 text-xs text-muted-foreground'>
            {t('source_help')}
          </p>
        </div>
        <Button
          size='sm'
          onClick={handleSave}
          disabled={!changed || updateSkill.isPending}
        >
          {updateSkill.isPending ? (
            <Loader2Icon className='size-4 animate-spin' />
          ) : (
            <SaveIcon className='size-4' />
          )}
          {t('save')}
        </Button>
      </div>
      <SkillContentEditor
        filePath='SKILL.md'
        value={content}
        onChange={setContent}
      />
    </Card>
  )
}

function AddResourceDialog({
  agentName,
  skillName,
  onSaved,
}: {
  agentName: string
  skillName: string
  onSaved: (path: string) => void
}) {
  const t = useTranslations('setting.skill_management')
  const updateResource = useUpdateSkillResource()
  const [open, setOpen] = useState(false)
  const [path, setPath] = useState('references/')
  const [content, setContent] = useState('')

  const reset = () => {
    setPath('references/')
    setContent('')
  }

  const handleSave = async () => {
    const resourcePath = path.trim()
    try {
      await updateResource.mutateAsync({
        agentName,
        skillName,
        resourcePath,
        data: { content },
      })
      toast.success(t('resource_save_success'))
      setOpen(false)
      reset()
      onSaved(resourcePath)
    } catch (error) {
      toast.error(errorMessage(error, t('resource_save_failed')))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen && !updateResource.isPending) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          <FilePlusIcon className='size-4' />
          {t('add_resource')}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('add_resource_title')}</DialogTitle>
          <DialogDescription>{t('add_resource_description')}</DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <div className='space-y-2'>
            <Label htmlFor='resource-path'>{t('resource_path')}</Label>
            <Input
              id='resource-path'
              value={path}
              onChange={(event) => setPath(event.target.value)}
              placeholder='references/DETAILS.md'
              className='font-mono'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='resource-content'>{t('resource_content')}</Label>
            <Textarea
              id='resource-content'
              value={content}
              onChange={(event) => setContent(event.target.value)}
              spellCheck={false}
              className='min-h-72 font-mono text-sm'
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={updateResource.isPending}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateResource.isPending || !path.trim()}
          >
            {updateResource.isPending && (
              <Loader2Icon className='size-4 animate-spin' />
            )}
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ResourceEditor({
  agentName,
  skillName,
  resource,
}: {
  agentName: string
  skillName: string
  resource: SkillResource
}) {
  const t = useTranslations('setting.skill_management')
  const updateResource = useUpdateSkillResource()
  const [content, setContent] = useReducer(
    (_current: string, next: string) => next,
    resource.content,
  )
  const changed = content !== resource.content

  const handleSave = async () => {
    try {
      await updateResource.mutateAsync({
        agentName,
        skillName,
        resourcePath: resource.path,
        data: { content },
      })
      toast.success(t('resource_save_success'))
    } catch (error) {
      toast.error(errorMessage(error, t('resource_save_failed')))
    }
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between gap-3'>
        <code className='truncate text-xs text-muted-foreground'>
          {resource.path}
        </code>
        <Button
          size='sm'
          onClick={handleSave}
          disabled={!changed || updateResource.isPending}
        >
          {updateResource.isPending ? (
            <Loader2Icon className='size-4 animate-spin' />
          ) : (
            <SaveIcon className='size-4' />
          )}
          {t('save')}
        </Button>
      </div>
      <SkillContentEditor
        filePath={resource.path}
        value={content}
        onChange={setContent}
        height='320px'
      />
    </div>
  )
}

function ResourcePanel({ skill }: { skill: SkillDetail }) {
  const t = useTranslations('setting.skill_management')
  const [resourceSelection, setResourceSelection] = useState('')
  const selectedResource = skill.resources.includes(resourceSelection)
    ? resourceSelection
    : (skill.resources[0] ?? '')
  const resourceQuery = useSkillResource(
    skill.agent_name,
    skill.name,
    selectedResource,
  )

  return (
    <Card className='gap-0 overflow-hidden p-0'>
      <div className='flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4'>
        <div>
          <h2 className='font-semibold'>{t('resources')}</h2>
          <p className='text-xs text-muted-foreground'>
            {t('resources_description')}
          </p>
        </div>
        <AddResourceDialog
          agentName={skill.agent_name}
          skillName={skill.name}
          onSaved={setResourceSelection}
        />
      </div>
      <div className='grid min-h-80 md:grid-cols-[220px_minmax(0,1fr)]'>
        <div className='space-y-1 border-b p-3 md:border-r md:border-b-0'>
          {skill.resources.length === 0 ? (
            <p className='px-2 py-6 text-center text-sm text-muted-foreground'>
              {t('no_resources')}
            </p>
          ) : (
            skill.resources.map((path) => (
              <Button
                key={path}
                variant={path === selectedResource ? 'secondary' : 'ghost'}
                className='h-auto w-full justify-start overflow-hidden p-2 font-mono text-xs'
                onClick={() => setResourceSelection(path)}
              >
                <span className='truncate'>{path}</span>
              </Button>
            ))
          )}
        </div>
        <div className='min-w-0 p-5'>
          {!selectedResource ? (
            <div className='flex h-full min-h-48 items-center justify-center text-sm text-muted-foreground'>
              {t('select_or_add_resource')}
            </div>
          ) : resourceQuery.isLoading ? (
            <div className='space-y-3'>
              <Skeleton className='h-5 w-48' />
              <Skeleton className='h-64 w-full' />
            </div>
          ) : resourceQuery.isError || !resourceQuery.data ? (
            <div className='flex h-full min-h-48 items-center justify-center text-sm text-destructive'>
              {t('resource_load_failed')}
            </div>
          ) : (
            <ResourceEditor
              key={`${resourceQuery.data.path}:${resourceQuery.data.content}`}
              agentName={skill.agent_name}
              skillName={skill.name}
              resource={resourceQuery.data}
            />
          )}
        </div>
      </div>
    </Card>
  )
}

function SkillWorkspace({
  agentName,
  skillName,
}: {
  agentName: string
  skillName: string
}) {
  const t = useTranslations('setting.skill_management')
  const skillQuery = useSkill(agentName, skillName)

  if (skillQuery.isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-[520px] w-full' />
      </div>
    )
  }

  if (skillQuery.isError || !skillQuery.data) {
    return (
      <Card className='flex min-h-80 items-center justify-center text-muted-foreground'>
        {t('skill_load_failed')}
      </Card>
    )
  }

  const skill = skillQuery.data
  return (
    <div className='space-y-5'>
      <div>
        <div className='flex flex-wrap items-center gap-2'>
          <h2 className='text-2xl font-semibold'>{skill.name}</h2>
          <Badge variant='outline'>{skill.agent_name}</Badge>
        </div>
        <p className='mt-2 max-w-4xl text-sm text-muted-foreground'>
          {skill.description}
        </p>
      </div>
      <SkillSourceEditor key={skill.content} skill={skill} />
      <ResourcePanel key={`${skill.agent_name}/${skill.name}`} skill={skill} />
    </div>
  )
}

function SkillList({
  agent,
  selectedSkill,
  onSelect,
}: {
  agent: AgentSkills | undefined
  selectedSkill: string
  onSelect: (skillName: string) => void
}) {
  const t = useTranslations('setting.skill_management')

  if (!agent || agent.skills.length === 0) {
    return (
      <div className='px-4 py-10 text-center text-sm text-muted-foreground'>
        {t('no_skills')}
      </div>
    )
  }

  return (
    <div className='space-y-1 p-2'>
      {agent.skills.map((skill) => (
        <button
          type='button'
          key={skill.name}
          onClick={() => onSelect(skill.name)}
          className={`w-full rounded-md px-3 py-3 text-left transition-colors ${
            selectedSkill === skill.name
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-muted'
          }`}
        >
          <div className='flex items-center justify-between gap-2'>
            <span className='truncate font-medium text-sm'>{skill.name}</span>
            {skill.resource_count > 0 && (
              <Badge variant='secondary' className='shrink-0 text-[10px]'>
                {skill.resource_count}
              </Badge>
            )}
          </div>
          <p className='mt-1 line-clamp-2 text-xs text-muted-foreground'>
            {skill.description}
          </p>
        </button>
      ))}
    </div>
  )
}

export function SkillManagement() {
  const t = useTranslations('setting.skill_management')
  const catalogQuery = useSkillCatalog()
  const [selection, setSelection] = useState<{
    agentName: string
    skillName: string
  } | null>(null)
  const agents = catalogQuery.data?.agents ?? []
  const selectedAgentName =
    selection &&
    agents.some((agent) => agent.agent_name === selection.agentName)
      ? selection.agentName
      : (agents[0]?.agent_name ?? '')
  const selectedAgent = agents.find(
    (agent) => agent.agent_name === selectedAgentName,
  )
  const selectedSkillName =
    selection?.agentName === selectedAgentName &&
    selectedAgent?.skills.some((skill) => skill.name === selection.skillName)
      ? selection.skillName
      : (selectedAgent?.skills[0]?.name ?? '')

  if (catalogQuery.isLoading) {
    return (
      <div className='grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]'>
        <Skeleton className='h-[640px]' />
        <Skeleton className='h-[640px]' />
      </div>
    )
  }

  if (catalogQuery.isError) {
    return (
      <Card className='flex min-h-80 items-center justify-center text-muted-foreground'>
        {t('catalog_load_failed')}
      </Card>
    )
  }

  return (
    <div className='grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]'>
      <Card className='gap-0 overflow-hidden p-0 lg:sticky lg:top-4'>
        <div className='space-y-3 border-b p-4'>
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <BookOpenIcon className='size-4 text-primary' />
              <h2 className='font-semibold'>{t('catalog')}</h2>
            </div>
            <AddSkillDialog
              agentName={selectedAgentName}
              onCreated={(skillName) =>
                setSelection({ agentName: selectedAgentName, skillName })
              }
            />
          </div>
          <Select
            value={selectedAgentName}
            onValueChange={(agentName) => {
              const agent = agents.find((item) => item.agent_name === agentName)
              setSelection({
                agentName,
                skillName: agent?.skills[0]?.name ?? '',
              })
            }}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder={t('select_agent')} />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.agent_name} value={agent.agent_name}>
                  {agent.agent_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <SkillList
          agent={selectedAgent}
          selectedSkill={selectedSkillName}
          onSelect={(skillName) =>
            setSelection({ agentName: selectedAgentName, skillName })
          }
        />
      </Card>

      {selectedAgentName && selectedSkillName ? (
        <SkillWorkspace
          key={`${selectedAgentName}/${selectedSkillName}`}
          agentName={selectedAgentName}
          skillName={selectedSkillName}
        />
      ) : (
        <Card className='flex min-h-80 items-center justify-center text-muted-foreground'>
          {t('select_or_add_skill')}
        </Card>
      )}
    </div>
  )
}
