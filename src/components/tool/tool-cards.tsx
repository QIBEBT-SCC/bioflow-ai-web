'use client'

import { HelpCircle, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { FileMount, ParamDefine } from '@/types/tool'

export function ToolParamCard({
  param,
  index,
  onRemove,
  onUpdate,
}: {
  param: ParamDefine
  index: number
  onRemove: (index: number) => void
  onUpdate: (index: number, field: keyof ParamDefine, value: string | number | boolean) => void
}) {
  return (
    <Card key={index} className='overflow-hidden border-l-4 border-l-primary pt-0'>
      <CardHeader className='py-3 bg-muted/30'>
        <div className='flex justify-between items-center'>
          <CardTitle className='text-base'>
            参数 {index + 1}
            {param.required && <Badge className='ml-2 bg-red-500'>必填</Badge>}
            {param.is_position && <Badge className='ml-2 bg-blue-500'>位置参数</Badge>}
          </CardTitle>
          <Button type='button' variant='ghost' size='icon' className='text-muted-foreground hover:text-destructive' onClick={() => onRemove(index)}>
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
          <div className='space-y-2'>
            <Label htmlFor={`param-description-${index}`}>描述</Label>
            <Input
              id={`param-description-${index}`}
              value={param.description || ''}
              onChange={(e) => onUpdate(index, 'description', e.target.value)}
              placeholder='参数描述'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor={`param-index-${index}`}>索引位置</Label>
            <Input
              id={`param-index-${index}`}
              type='number'
              value={param.index || 0}
              onChange={(e) => onUpdate(index, 'index', Number.parseInt(e.target.value) || 0)}
              disabled={!param.is_position}
              placeholder='0'
            />
          </div>
        </div>

        <div className='space-y-2 mb-4'>
          <Label htmlFor={`param-command-${index}`}>
            命令格式 <span className='text-red-500'>*</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className='h-4 w-4 inline-block ml-1 text-muted-foreground' />
                </TooltipTrigger>
                <TooltipContent>
                  <p className='max-w-xs'>使用 {'{value}'} 作为占位符，例如：-i {'{value}'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id={`param-command-${index}`}
            value={param.command}
            onChange={(e) => onUpdate(index, 'command', e.target.value)}
            placeholder='例如：-i {value}'
            required
          />
        </div>

        <div className='flex gap-4'>
          <div className='flex items-center space-x-2'>
            <Checkbox id={`param-required-${index}`} checked={param.required} onCheckedChange={(checked) => onUpdate(index, 'required', checked as boolean)} />
            <Label htmlFor={`param-required-${index}`}>必填参数</Label>
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox id={`param-position-${index}`} checked={param.is_position} onCheckedChange={(checked) => onUpdate(index, 'is_position', checked as boolean)} />
            <Label htmlFor={`param-position-${index}`}>位置参数</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ToolFileCard({
  file,
  index,
  onRemove,
  onUpdate,
}: {
  file: FileMount
  index: number
  onRemove: (index: number) => void
  onUpdate: (index: number, field: keyof FileMount, value: string | boolean) => void
}) {
  return (
    <Card key={index} className={`overflow-hidden border-l-4 pt-0 ${file.file_type === 'INPUT' ? 'border-l-blue-500' : 'border-l-green-500'}`}>
      <CardHeader className='py-3 bg-muted/30'>
        <div className='flex justify-between items-center'>
          <CardTitle className='text-base'>
            文件 {index + 1}: {file.name || '未命名'}
            <Badge className={`ml-2 ${file.file_type === 'INPUT' ? 'bg-blue-500' : 'bg-green-500'}`}>{file.file_type === 'INPUT' ? '输入' : '输出'}</Badge>
            {file.is_report && <Badge variant='outline' className='ml-2'>报告</Badge>}
            {file.is_log && <Badge variant='outline' className='ml-2'>日志</Badge>}
          </CardTitle>
          <Button type='button' variant='ghost' size='icon' className='text-muted-foreground hover:text-destructive' onClick={() => onRemove(index)}>
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
          <div className='space-y-2'>
            <Label htmlFor={`file-name-${index}`}>
              文件名 <span className='text-red-500'>*</span>
            </Label>
            <Input id={`file-name-${index}`} value={file.name} onChange={(e) => onUpdate(index, 'name', e.target.value)} placeholder='output.txt' required />
          </div>
          <div className='space-y-2'>
            <Label htmlFor={`file-type-${index}`}>
              文件类型 <span className='text-red-500'>*</span>
            </Label>
            <Select value={file.file_type} onValueChange={(value) => onUpdate(index, 'file_type', value)}>
              <SelectTrigger id={`file-type-${index}`}>
                <SelectValue placeholder='选择文件类型' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='INPUT'>输入文件</SelectItem>
                <SelectItem value='OUTPUT'>输出文件</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='space-y-2 mb-4'>
          <Label htmlFor={`file-description-${index}`}>描述</Label>
          <Input id={`file-description-${index}`} value={file.description || ''} onChange={(e) => onUpdate(index, 'description', e.target.value)} placeholder='文件描述' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
          <div className='space-y-2'>
            <Label htmlFor={`file-path-${index}`}>
              文件路径 <span className='text-red-500'>*</span>
            </Label>
            <Input id={`file-path-${index}`} value={file.file_path} onChange={(e) => onUpdate(index, 'file_path', e.target.value)} placeholder='/output/result.txt' required />
          </div>
          <div className='space-y-2'>
            <Label htmlFor={`mount-path-${index}`}>
              挂载路径 <span className='text-red-500'>*</span>
            </Label>
            <Input id={`mount-path-${index}`} value={file.mount_path} onChange={(e) => onUpdate(index, 'mount_path', e.target.value)} placeholder='/data/result.txt' required />
          </div>
        </div>

        <div className='flex gap-4'>
          <div className='flex items-center space-x-2'>
            <Checkbox id={`file-report-${index}`} checked={file.is_report} onCheckedChange={(checked) => onUpdate(index, 'is_report', checked as boolean)} />
            <Label htmlFor={`file-report-${index}`}>报告文件</Label>
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox id={`file-log-${index}`} checked={file.is_log} onCheckedChange={(checked) => onUpdate(index, 'is_log', checked as boolean)} />
            <Label htmlFor={`file-log-${index}`}>日志文件</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

