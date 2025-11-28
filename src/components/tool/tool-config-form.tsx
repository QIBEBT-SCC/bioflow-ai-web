'use client'

import { Sparkles } from 'lucide-react'
import { ToolFileCard, ToolParamCard } from '@/components/tool/tool-cards'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import type { ToolGroup } from '@/types/tool'
import type { FileMount, ParamDefine, DockerToolCreate } from '@/types/tool'

export type ToolConfigValues = Pick<
  DockerToolCreate,
  | 'name'
  | 'description'
  | 'group_id'
  | 'command_template'
  | 'dynamic_params'
  | 'immutable_static_params'
  | 'modifiable_static_params'
  | 'file_mounts'
>

interface ToolConfigFormProps {
  value: ToolConfigValues
  toolGroups: ToolGroup[]
  onFieldChange: (
    field: keyof ToolConfigValues,
    value:
      | string
      | number
      | boolean
      | ParamDefine[]
      | FileMount[],
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
  showTabBadges?: boolean
  showAIGeneratePlaceholder?: boolean
  initialTab?: 'basic' | 'params' | 'files'
}

export function ToolConfigForm({
  value,
  toolGroups,
  onFieldChange,
  onAddDynamicParam,
  onUpdateDynamicParam,
  onRemoveDynamicParam,
  onAddFileMount,
  onUpdateFileMount,
  onRemoveFileMount,
  imageSummary,
  showTabBadges = false,
  showAIGeneratePlaceholder = false,
  initialTab = 'basic',
}: ToolConfigFormProps) {
  const tabBadge = (content?: string | number) =>
    showTabBadges && content ? (
      <Badge variant='outline' className='ml-2'>
        {content}
      </Badge>
    ) : null

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
                <Label htmlFor='tool-group'>工具分组</Label>
                <Select
                  value={value.group_id?.toString() || ''}
                  onValueChange={(val) => onFieldChange('group_id', Number(val))}
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

              {showAIGeneratePlaceholder && (
                <div className='flex justify-end pt-4 border-t'>
                  <Button variant='outline' disabled>
                    <Sparkles className='h-4 w-4 mr-2' />
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
                        key={`param-${index}-${param.command}`}
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
                      onFieldChange('immutable_static_params', e.target.value || null)
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
                      onFieldChange('modifiable_static_params', e.target.value || null)
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
                        key={`file-${index}-${file.name}`}
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
    </div>
  )
}
