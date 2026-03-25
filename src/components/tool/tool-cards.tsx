'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, HelpCircle, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { FileMount, ParamDefine } from '@/types/tool'

export function ToolParamCard({
  id,
  param,
  index,
  onRemoveAction,
  onUpdateAction,
}: {
  id: string
  param: ParamDefine
  index: number
  onRemoveAction: (index: number) => void
  onUpdateAction: (
    index: number,
    field: keyof ParamDefine,
    value: string | number | boolean,
  ) => void
}) {
  const t = useTranslations('tool.Cards')
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className='overflow-hidden border-l-4 border-l-primary pt-0'
    >
      <CardHeader className='py-3 bg-muted/30'>
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              {...attributes}
              {...listeners}
              className='cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing'
            >
              <GripVertical className='h-4 w-4' />
            </button>
            <CardTitle className='text-base'>
              {t('param', { index: index + 1 })}
              {param.is_position && (
                <Badge className='ml-2 bg-blue-500'>
                  {t('positionalParam')}
                </Badge>
              )}
            </CardTitle>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='text-muted-foreground hover:text-destructive'
            onClick={() => onRemoveAction(index)}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
          <div className='space-y-2'>
            <Label htmlFor={`param-description-${index}`}>
              {t('description')}
            </Label>
            <Input
              id={`param-description-${index}`}
              value={param.description || ''}
              onChange={(e) =>
                onUpdateAction(index, 'description', e.target.value)
              }
              placeholder={t('paramDescriptionPlaceholder')}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor={`param-index-${index}`}>{t('indexPosition')}</Label>
            <Input
              id={`param-index-${index}`}
              type='number'
              value={param.index || 0}
              onChange={(e) =>
                onUpdateAction(
                  index,
                  'index',
                  Number.parseInt(e.target.value, -1) || 0,
                )
              }
              disabled={!param.is_position}
              placeholder='0'
            />
          </div>
        </div>

        <div className='space-y-2 mb-4'>
          <Label htmlFor={`param-command-${index}`}>
            {t('commandFormat')} <span className='text-red-500'>*</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className='h-4 w-4 inline-block ml-1 text-muted-foreground' />
                </TooltipTrigger>
                <TooltipContent>
                  <p className='max-w-xs'>
                    {t('commandFormatTooltip', { value: '{value}' })}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id={`param-command-${index}`}
            value={param.command}
            onChange={(e) => onUpdateAction(index, 'command', e.target.value)}
            placeholder={t('commandFormatPlaceholder', { value: '{value}' })}
            required
          />
        </div>

        <div className='flex gap-4'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id={`param-position-${index}`}
              checked={param.is_position}
              onCheckedChange={(checked) =>
                onUpdateAction(index, 'is_position', checked as boolean)
              }
            />
            <Label htmlFor={`param-position-${index}`}>
              {t('positionalParam')}
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ToolFileCard({
  id,
  file,
  index,
  onRemoveAction,
  onUpdateAction,
}: {
  id: string
  file: FileMount
  index: number
  onRemoveAction: (index: number) => void
  onUpdateAction: (
    index: number,
    field: keyof FileMount,
    value: string | boolean,
  ) => void
}) {
  const t = useTranslations('tool.Cards')
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden border-l-4 pt-0 ${file.file_type === 'INPUT' ? 'border-l-blue-500' : 'border-l-green-500'}`}
    >
      <CardHeader className='py-3 bg-muted/30'>
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              {...attributes}
              {...listeners}
              className='cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing'
            >
              <GripVertical className='h-4 w-4' />
            </button>
            <CardTitle className='text-base'>
              {t('file', { index: index + 1, name: file.name || t('unnamed') })}
              <Badge
                className={`ml-2 ${file.file_type === 'INPUT' ? 'bg-blue-500' : 'bg-green-500'}`}
              >
                {file.file_type === 'INPUT' ? t('input') : t('output')}
              </Badge>
              {file.is_report && (
                <Badge variant='outline' className='ml-2'>
                  {t('report')}
                </Badge>
              )}
              {file.is_log && (
                <Badge variant='outline' className='ml-2'>
                  {t('log')}
                </Badge>
              )}
            </CardTitle>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='text-muted-foreground hover:text-destructive'
            onClick={() => onRemoveAction(index)}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
          <div className='space-y-2'>
            <Label htmlFor={`file-name-${index}`}>
              {t('fileName')} <span className='text-red-500'>*</span>
            </Label>
            <Input
              id={`file-name-${index}`}
              value={file.name}
              onChange={(e) => onUpdateAction(index, 'name', e.target.value)}
              placeholder={t('fileNamePlaceholder')}
              required
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor={`file-type-${index}`}>
              {t('fileType')} <span className='text-red-500'>*</span>
            </Label>
            <Select
              value={file.file_type}
              onValueChange={(value) =>
                onUpdateAction(index, 'file_type', value)
              }
            >
              <SelectTrigger id={`file-type-${index}`}>
                <SelectValue placeholder={t('selectFileType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='INPUT'>{t('inputFile')}</SelectItem>
                <SelectItem value='OUTPUT'>{t('outputFile')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='space-y-2 mb-4'>
          <Label htmlFor={`file-description-${index}`}>
            {t('description')}
          </Label>
          <Input
            id={`file-description-${index}`}
            value={file.description || ''}
            onChange={(e) =>
              onUpdateAction(index, 'description', e.target.value)
            }
            placeholder={t('fileDescriptionPlaceholder')}
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
          <div className='space-y-2'>
            <Label htmlFor={`file-path-${index}`}>
              {t('filePath')} <span className='text-red-500'>*</span>
            </Label>
            <Input
              id={`file-path-${index}`}
              value={file.file_path}
              onChange={(e) =>
                onUpdateAction(index, 'file_path', e.target.value)
              }
              placeholder={t('filePathPlaceholder')}
              required
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor={`mount-path-${index}`}>
              {t('mountPath')} <span className='text-red-500'>*</span>
            </Label>
            <Input
              id={`mount-path-${index}`}
              value={file.mount_path}
              onChange={(e) =>
                onUpdateAction(index, 'mount_path', e.target.value)
              }
              placeholder={t('mountPathPlaceholder')}
              required
            />
          </div>
        </div>

        <div className='flex gap-4'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id={`file-report-${index}`}
              checked={file.is_report}
              onCheckedChange={(checked) =>
                onUpdateAction(index, 'is_report', checked as boolean)
              }
            />
            <Label htmlFor={`file-report-${index}`}>{t('reportFile')}</Label>
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id={`file-log-${index}`}
              checked={file.is_log}
              onCheckedChange={(checked) =>
                onUpdateAction(index, 'is_log', checked as boolean)
              }
            />
            <Label htmlFor={`file-log-${index}`}>{t('logFile')}</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
