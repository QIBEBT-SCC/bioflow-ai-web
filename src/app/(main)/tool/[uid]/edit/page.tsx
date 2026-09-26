'use client'

import { Loader2, RefreshCw } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  PageContainer,
  PageHeader,
  PageShell,
} from '@/components/layout/page-shell'
import { ToolConfigForm } from '@/components/tool/tool-config-form'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useRefreshDocument,
  useTool,
  useToolGroupList,
  useToolTagList,
  useUpdateTool,
} from '@/hooks/use-tool'
import { useToolFormState } from '@/hooks/use-tool-form-state'
import type { DockerToolCreate } from '@/types/tool'

export default function EditToolPage() {
  const t = useTranslations('tool.Edit')
  const tDetail = useTranslations('tool.Detail')
  const params = useParams()
  const { push } = useRouter()
  const toolUid = params.uid as string
  const { data: tool, isLoading } = useTool(toolUid)
  const { data: toolGroups = [] } = useToolGroupList()
  const { data: availableTags = [] } = useToolTagList()
  const { mutate: updateTool, isPending: isUpdating } = useUpdateTool()
  const { mutate: refreshDoc, isPending: isRefreshing } = useRefreshDocument()

  const {
    formState,
    canSave,
    updateFormField,
    addDynamicParam,
    updateDynamicParam,
    removeDynamicParam,
    addFileMount,
    updateFileMount,
    removeFileMount,
    reorderDynamicParams,
    reorderFileMounts,
  } = useToolFormState(tool, toolGroups)

  const handleSaveChanges = () => {
    if (!tool || !formState || !canSave) return
    const requestData: Partial<DockerToolCreate> = {
      ...formState,
      tag_ids: formState.tags.map((tag) => tag.id),
      immutable_static_params: formState.immutable_static_params ?? '',
      modifiable_static_params: formState.modifiable_static_params ?? '',
    }
    updateTool(
      { uid: tool.uid, tool: requestData },
      { onSuccess: () => push(`/tool/${tool.uid}`) },
    )
  }

  return (
    <PageShell
      breadcrumbs={[
        { label: tDetail('breadcrumb'), href: '/tool' },
        {
          label: tool?.name ?? tDetail('loading'),
          href: tool ? `/tool/${tool.uid}` : undefined,
        },
        { label: t('breadcrumb') },
      ]}
    >
      <PageContainer size='narrow'>
        <PageHeader title={t('title')} description={t('description')} />

        {isLoading || !formState ? (
          <div className='space-y-4' aria-busy='true'>
            <span className='sr-only'>{t('loading')}</span>
            <Skeleton className='h-48 rounded-xl' />
            <Skeleton className='h-72 rounded-xl' />
          </div>
        ) : (
          <>
            <ToolConfigForm
              value={formState}
              toolGroups={toolGroups}
              availableTags={availableTags}
              onFieldChange={updateFormField}
              onAddDynamicParam={addDynamicParam}
              onUpdateDynamicParam={updateDynamicParam}
              onRemoveDynamicParam={removeDynamicParam}
              onAddFileMount={addFileMount}
              onUpdateFileMount={updateFileMount}
              onRemoveFileMount={removeFileMount}
              onReorderDynamicParams={reorderDynamicParams}
              onReorderFileMounts={reorderFileMounts}
              imageSummary={{
                name: tool?.image.name,
                version: tool?.image.version,
              }}
              imageUid={tool?.image.uid}
            />

            <div className='sticky bottom-0 -mx-4 mt-6 flex justify-between gap-3 border-t bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6'>
              <Button
                variant='outline'
                onClick={() =>
                  tool?.help_doc.uid && refreshDoc(tool.help_doc.uid)
                }
                disabled={!tool?.help_doc.uid || isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  <RefreshCw className='size-4' />
                )}
                {isRefreshing ? t('refreshing') : t('refreshDoc')}
              </Button>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={() => push(`/tool/${tool?.uid}`)}
                  disabled={isUpdating}
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  disabled={!canSave || isUpdating}
                >
                  {isUpdating ? t('saving') : t('save')}
                </Button>
              </div>
            </div>
          </>
        )}
      </PageContainer>
    </PageShell>
  )
}
