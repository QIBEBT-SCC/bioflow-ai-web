'use client'

import { Loader2Icon, PlayIcon, SparklesIcon } from 'lucide-react'
import { ReactNode, useState } from 'react'
import { ToolFileCard, ToolParamCard } from '@/components/tool/tool-cards'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import {
  Terminal,
  TerminalActions,
  TerminalContent,
  TerminalCopyButton,
  TerminalHeader,
  TerminalStatus,
  TerminalTitle,
} from '@/components/ai-elements/terminal'

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
  imageSummary,
  imageUid,
  showTabBadges = false,
  showAIGeneratePlaceholder = false,
  initialTab = 'basic',
}: ToolConfigFormProps) {
  const [showHelpResult, setShowHelpResult] = useState(false)
  const [helpCommandResult, setHelpCommandResult] = useState('')
  const { mutate: runInImage, isPending: isRunning } = useRunInImage()

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
          <span className='text-sm text-muted-foreground'>基于镜像：</span>
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
            基本信息
            {tabBadge(value.name)}
          </TabsTrigger>
          <TabsTrigger value='params'>
            参数配置
            {tabBadge(value.dynamic_params.length || undefined)}
          </TabsTrigger>
          <TabsTrigger value='files'>
            文件挂载
            {tabBadge(value.file_mounts.length || undefined)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='basic'>
          <Card>
            <CardContent className='space-y-6 pt-6'>
              <div className='space-y-2'>
                <Label htmlFor='tool-name'>
                  工具名称 <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='tool-name'
                  value={value.name}
                  onChange={(e) => onFieldChange('name', e.target.value)}
                  placeholder='输入工具名称'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='tool-description'>描述</Label>
                <Textarea
                  id='tool-description'
                  value={value.description}
                  onChange={(e) => onFieldChange('description', e.target.value)}
                  placeholder='描述工具的功能'
                  rows={3}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='tool-command'>
                  命令模板 <span className='text-red-500'>*</span>
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
                  帮助命令 <span className='text-red-500'>*</span>
                </Label>
                <div className='flex gap-2'>
                  <Input
                    id='tool-help-command'
                    value={value.help_command}
                    onChange={(e) =>
                      onFieldChange('help_command', e.target.value)
                    }
                    placeholder='--help 或 -h'
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
                      title={isRunning ? '执行中...' : '测试帮助命令'}
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
                <Label htmlFor='tool-group'>工具分组</Label>
                <Select
                  value={value.group_id?.toString() || ''}
                  onValueChange={(val) => handleGroupChange(Number(val))}
                >
                  <SelectTrigger id='tool-group'>
                    <SelectValue placeholder='选择分组' />
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
                  <Label>工具标签</Label>
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
                    AI智能生成配置
                    <Badge variant='secondary' className='ml-2'>
                      即将推出
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
                <Label>动态参数</Label>
                {value.dynamic_params.length === 0 ? (
                  <div className='text-center py-6 text-muted-foreground border rounded-md bg-muted/30'>
                    暂无动态参数
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {value.dynamic_params.map((param, index) => (
                      <ToolParamCard
                        key={`param-${
                          // biome-ignore lint/suspicious/noArrayIndexKey: no need
                          index
                        }`}
                        param={param}
                        index={index}
                        onRemove={onRemoveDynamicParam}
                        onUpdate={onUpdateDynamicParam}
                      />
                    ))}
                  </div>
                )}
                <Button
                  type='button'
                  onClick={onAddDynamicParam}
                  variant='outline'
                  className='w-full'
                >
                  添加动态参数
                </Button>
              </div>

              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='tool-immutable-static'>
                    不可变静态参数
                    <span className='text-xs text-muted-foreground ml-2'>
                      (创建后不可修改)
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
                    placeholder='--threads 4 --output /output'
                    rows={3}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='tool-modifiable-static'>
                    可修改静态参数
                    <span className='text-xs text-muted-foreground ml-2'>
                      (可在编辑时修改)
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
                    placeholder='--verbose --log-level info'
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
                <Label>文件挂载</Label>
                {value.file_mounts.length === 0 ? (
                  <div className='text-center py-6 text-muted-foreground border rounded-md bg-muted/30'>
                    暂无文件挂载
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {value.file_mounts.map((file, index) => (
                      <ToolFileCard
                        key={`file-${
                          // biome-ignore lint/suspicious/noArrayIndexKey: no need
                          index
                        }`}
                        file={file}
                        index={index}
                        onUpdate={onUpdateFileMount}
                        onRemove={onRemoveFileMount}
                      />
                    ))}
                  </div>
                )}
                <Button
                  type='button'
                  onClick={onAddFileMount}
                  variant='outline'
                  className='w-full'
                >
                  添加文件挂载
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
            <DialogTitle>帮助命令执行结果</DialogTitle>
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
