'use client'

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Loader2Icon, PlayIcon, SparklesIcon } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import {
  Terminal,
  TerminalContent,
  TerminalHeader,
  TerminalTitle,
} from '@/components/ai-elements/terminal'
import { ToolFileCard, ToolParamCard } from '@/components/tool/tool-cards'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useRunInImage } from '@/hooks/use-tool'
import type {
  DockerToolCreate,
  FileMount,
  ParamDefine,
  ToolGroup,
  ToolTag,
} from '@/types/tool'

export type ToolConfigValues = Omit<
  DockerToolCreate,
  'tag_ids' | 'immutable_static_params' | 'modifiable_static_params'
> & {
  tags: ToolTag[] // UI 层面使用完整的 ToolTag 对象
  immutable_static_params: string | null // UI 层面允许 null
  modifiable_static_params: string | null // UI 层面允许 null
}

interface ToolConfigFormProps {
  value: ToolConfigValues
  toolGroups: ToolGroup[]
  availableTags?: ToolTag[]
  onFieldChange: (
    field: keyof ToolConfigValues,
    value:
      | string
      | number
      | boolean
      | null
      | ParamDefine[]
      | FileMount[]
      | ToolTag[],
  ) => void
  onAddDynamicParam: () => void
  onUpdateDynamicParam: (
    index: number,
    field: keyof ParamDefine,
    value: string | number | boolean,
  ) => void
  onRemoveDynamicParam: (index: number) => void
  onAddFileMount: () => void
  onUpdateFileMount: (
    index: number,
    field: keyof FileMount,
    value: string | boolean,
  ) => void
  onRemoveFileMount: (index: number) => void
  onReorderDynamicParams: (newParams: ParamDefine[]) => void
  onReorderFileMounts: (newMounts: FileMount[]) => void
  imageSummary?: {
    name?: string
    version?: string
  }
  imageUid?: string
  showTabBadges?: boolean
  showAIGeneratePlaceholder?: boolean
  initialTab?: 'basic' | 'params' | 'files'
}

export function ToolConfigForm({
  value,
  toolGroups,
  availableTags = [],
  onFieldChange,
  onAddDynamicParam,
  onUpdateDynamicParam,
  onRemoveDynamicParam,
  onAddFileMount,
  onUpdateFileMount,
  onRemoveFileMount,
  onReorderDynamicParams,
  onReorderFileMounts,
  imageSummary,
  imageUid,
  showTabBadges = false,
  showAIGeneratePlaceholder = false,
  initialTab = 'basic',
}: ToolConfigFormProps) {
  const t = useTranslations('tool.ConfigForm')
  const [showHelpResult, setShowHelpResult] = useState(false)
  const [helpCommandResult, setHelpCommandResult] = useState('')
  const { mutate: runInImage, isPending: isRunning } = useRunInImage()

  const paramIds = useRef<string[]>([])
  const fileIds = useRef<string[]>([])

  while (paramIds.current.length < value.dynamic_params.length)
    paramIds.current.push(nanoid())
  paramIds.current = paramIds.current.slice(0, value.dynamic_params.length)
  while (fileIds.current.length < value.file_mounts.length)
    fileIds.current.push(nanoid())
  fileIds.current = fileIds.current.slice(0, value.file_mounts.length)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const handleParamDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = paramIds.current.indexOf(active.id as string)
    const newIndex = paramIds.current.indexOf(over.id as string)
    paramIds.current = arrayMove(paramIds.current, oldIndex, newIndex)
    const reordered = arrayMove(value.dynamic_params, oldIndex, newIndex).map(
      (p, i) => ({ ...p, index: i }),
    )
    onReorderDynamicParams(reordered)
  }

  const handleFileDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = fileIds.current.indexOf(active.id as string)
    const newIndex = fileIds.current.indexOf(over.id as string)
    fileIds.current = arrayMove(fileIds.current, oldIndex, newIndex)
    onReorderFileMounts(arrayMove(value.file_mounts, oldIndex, newIndex))
  }

  const tabBadge = (content?: string | number) =>
    showTabBadges && content ? (
      <Badge variant='outline' className='ml-2'>
        {content}
      </Badge>
    ) : null

  // 处理分组变化,自动更新对应的标签
  const handleGroupChange = (groupId: number) => {
    // 先更新 group_id
    onFieldChange('group_id', groupId)

    // 找到选中的分组
    const selectedGroup = toolGroups.find((g) => g.id === groupId)
    if (!selectedGroup) return

    // 找到所有分组对应的标签(用于移除)
    const groupTagIds = toolGroups
      .map((g) => availableTags.find((t) => t.name === g.name)?.id)
      .filter((id): id is number => id !== undefined)

    // 移除所有分组相关的标签
    const tagsWithoutGroupTags = value.tags.filter(
      (tag) => !groupTagIds.includes(tag.id),
    )

    // 找到与新分组同名的标签
    const matchingTag = availableTags.find(
      (tag) => tag.name === selectedGroup.name,
    )

    // 如果找到匹配的标签,添加它
    const newTags = matchingTag
      ? [...tagsWithoutGroupTags, matchingTag]
      : tagsWithoutGroupTags

    // 更新 tags
    onFieldChange('tags', newTags)
  }

  // 测试 help_command
  const handleTestHelpCommand = () => {
    if (!imageUid || !value.help_command) return
    runInImage(
      { uid: imageUid, command: value.help_command },
      {
        onSuccess: (data) => {
          setHelpCommandResult(data.result)
          setShowHelpResult(true)
        },
        onError: (error) => {
          setHelpCommandResult(`错误: ${error.message}`)
          setShowHelpResult(true)
        },
      },
    )
  }

  return (
    <div>
      {imageSummary && (imageSummary.name || imageSummary.version) && (
        <div className='mb-4 flex items-center gap-2'>
          <span className='text-sm text-muted-foreground'>
            {t('baseImage')}
          </span>
          {imageSummary.name && (
            <Badge variant='outline'>{imageSummary.name}</Badge>
          )}
          {imageSummary.version && (
            <Badge variant='secondary'>{imageSummary.version}</Badge>
          )}
        </div>
      )}

      <Tabs defaultValue={initialTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='basic'>
            {t('tabs.basic')}
            {tabBadge(value.name)}
          </TabsTrigger>
          <TabsTrigger value='params'>
            {t('tabs.params')}
            {tabBadge(value.dynamic_params.length || undefined)}
          </TabsTrigger>
          <TabsTrigger value='files'>
            {t('tabs.files')}
            {tabBadge(value.file_mounts.length || undefined)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='basic'>
          <Card>
            <CardContent className='space-y-6 pt-6'>
              <div className='space-y-2'>
                <Label htmlFor='tool-name'>
                  {t('toolName')} <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='tool-name'
                  value={value.name}
                  onChange={(e) => onFieldChange('name', e.target.value)}
                  placeholder={t('toolNamePlaceholder')}
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='tool-description'>{t('description')}</Label>
                <Textarea
                  id='tool-description'
                  value={value.description}
                  onChange={(e) => onFieldChange('description', e.target.value)}
                  placeholder={t('descriptionPlaceholder')}
                  rows={3}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='tool-command'>
                  {t('commandTemplate')} <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='tool-command'
                  value={value.command_template}
                  onChange={(e) =>
                    onFieldChange('command_template', e.target.value)
                  }
                  placeholder='tool {dynamic_params} {static_params}'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='tool-help-command'>
                  {t('helpCommand')} <span className='text-red-500'>*</span>
                </Label>
                <div className='flex gap-2'>
                  <Input
                    id='tool-help-command'
                    value={value.help_command}
                    onChange={(e) =>
                      onFieldChange('help_command', e.target.value)
                    }
                    placeholder={t('helpCommandPlaceholder')}
                    required
                    className='flex-1'
                  />
                  {imageUid && (
                    <Button
                      type='button'
                      variant='outline'
                      size='icon'
                      onClick={handleTestHelpCommand}
                      disabled={!value.help_command || isRunning}
                      title={isRunning ? t('testHelpRunning') : t('testHelp')}
                    >
                      {isRunning ? (
                        <Loader2Icon className='h-4 w-4 animate-spin' />
                      ) : (
                        <PlayIcon className='h-4 w-4' />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='tool-group'>{t('toolGroup')}</Label>
                <Select
                  value={value.group_id?.toString() || ''}
                  onValueChange={(val) => handleGroupChange(Number(val))}
                >
                  <SelectTrigger id='tool-group'>
                    <SelectValue placeholder={t('selectGroup')} />
                  </SelectTrigger>
                  <SelectContent>
                    {toolGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {availableTags.length > 0 && (
                <div className='space-y-2'>
                  <Label>{t('toolTags')}</Label>
                  <div className='flex flex-wrap gap-3 p-3 border rounded-md bg-muted/30'>
                    {availableTags.map((tag) => {
                      const isSelected = value.tags.some((t) => t.id === tag.id)
                      const getTagStyle = (tagName: string) => {
                        switch (tagName) {
                          case 'AI Checked':
                            return 'bg-green-50 text-green-600 border-green-200'
                          case 'AI Unchecked':
                            return 'bg-yellow-50 text-yellow-600 border-yellow-200'
                          default:
                            return 'bg-blue-50 text-blue-600 border-blue-200'
                        }
                      }
                      return (
                        <div
                          key={tag.id}
                          className='flex items-center space-x-2'
                        >
                          <Checkbox
                            id={`tag-${tag.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const newTags = checked
                                ? [...value.tags, tag]
                                : value.tags.filter((t) => t.id !== tag.id)
                              onFieldChange('tags', newTags)
                            }}
                          />
                          <Label
                            htmlFor={`tag-${tag.id}`}
                            className='cursor-pointer'
                          >
                            <Badge
                              variant='outline'
                              className={`${getTagStyle(tag.name)} text-xs`}
                            >
                              {tag.name}
                            </Badge>
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {showAIGeneratePlaceholder && (
                <div className='flex justify-end pt-4 border-t'>
                  <Button variant='outline' disabled>
                    <SparklesIcon className='h-4 w-4 mr-2' />
                    {t('aiGenerate')}
                    <Badge variant='secondary' className='ml-2'>
                      {t('comingSoon')}
                    </Badge>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='params'>
          <Card>
            <CardContent className='space-y-6 pt-6'>
              <div className='space-y-2'>
                <Label>{t('dynamicParams')}</Label>
                {value.dynamic_params.length === 0 ? (
                  <div className='text-center py-6 text-muted-foreground border rounded-md bg-muted/30'>
                    {t('noDynamicParams')}
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleParamDragEnd}
                  >
                    <SortableContext
                      items={paramIds.current}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className='space-y-4'>
                        {value.dynamic_params.map((param, index) => (
                          <ToolParamCard
                            key={paramIds.current[index]}
                            id={paramIds.current[index]}
                            param={param}
                            index={index}
                            onRemoveAction={onRemoveDynamicParam}
                            onUpdateAction={onUpdateDynamicParam}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
                <Button
                  type='button'
                  onClick={onAddDynamicParam}
                  variant='outline'
                  className='w-full'
                >
                  {t('addDynamicParam')}
                </Button>
              </div>

              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='tool-immutable-static'>
                    {t('immutableStaticParams')}
                    <span className='text-xs text-muted-foreground ml-2'>
                      {t('immutableStaticParamsHint')}
                    </span>
                  </Label>
                  <Textarea
                    id='tool-immutable-static'
                    value={value.immutable_static_params || ''}
                    onChange={(e) =>
                      onFieldChange(
                        'immutable_static_params',
                        e.target.value || null,
                      )
                    }
                    placeholder={t('immutableStaticParamsPlaceholder')}
                    rows={3}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='tool-modifiable-static'>
                    {t('modifiableStaticParams')}
                    <span className='text-xs text-muted-foreground ml-2'>
                      {t('modifiableStaticParamsHint')}
                    </span>
                  </Label>
                  <Textarea
                    id='tool-modifiable-static'
                    value={value.modifiable_static_params || ''}
                    onChange={(e) =>
                      onFieldChange(
                        'modifiable_static_params',
                        e.target.value || null,
                      )
                    }
                    placeholder={t('modifiableStaticParamsPlaceholder')}
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='files'>
          <Card>
            <CardContent className='space-y-6 pt-6'>
              <div className='space-y-2'>
                <Label>{t('fileMounts')}</Label>
                {value.file_mounts.length === 0 ? (
                  <div className='text-center py-6 text-muted-foreground border rounded-md bg-muted/30'>
                    {t('noFileMounts')}
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleFileDragEnd}
                  >
                    <SortableContext
                      items={fileIds.current}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className='space-y-4'>
                        {value.file_mounts.map((file, index) => (
                          <ToolFileCard
                            key={fileIds.current[index]}
                            id={fileIds.current[index]}
                            file={file}
                            index={index}
                            onUpdateAction={onUpdateFileMount}
                            onRemoveAction={onRemoveFileMount}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
                <Button
                  type='button'
                  onClick={onAddFileMount}
                  variant='outline'
                  className='w-full'
                >
                  {t('addFileMount')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 帮助命令测试结果对话框 */}
      <Dialog open={showHelpResult} onOpenChange={setShowHelpResult}>
        <DialogContent className='sm:!max-w-5xl'>
          <DialogHeader>
            <DialogTitle>{t('helpCommandResult')}</DialogTitle>
          </DialogHeader>
          <Terminal output={helpCommandResult} autoScroll={false}>
            <TerminalHeader>
              <TerminalTitle>{value.help_command}</TerminalTitle>
            </TerminalHeader>
            <TerminalContent />
          </Terminal>
        </DialogContent>
      </Dialog>
    </div>
  )
}
