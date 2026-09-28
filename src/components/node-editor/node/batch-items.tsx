'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRunLink } from '@/components/node-editor/run-link-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { clientFetchV2 } from '@/lib/api-client'

interface ChildPage {
  total: number
  has_more: boolean
  data: {
    key: string
    name: string
    run_uid: string
    status: string
    started: boolean
  }[]
}

export function BatchItems({
  runUid,
  nodeUid,
  counts,
}: {
  runUid: string
  nodeUid: string
  counts?: Record<string, number>
}) {
  const t = useTranslations('editor.foreach')
  const [open, setOpen] = useState(false)
  const runLink = useRunLink()
  const [offset, setOffset] = useState(0)
  const items = useQuery({
    queryKey: ['foreach-items', runUid, nodeUid, offset],
    queryFn: () =>
      clientFetchV2<ChildPage>(`/runs/${runUid}/foreach/${nodeUid}/items`, {
        params: { offset: String(offset), limit: '50' },
      }),
    enabled: open,
    refetchInterval: open ? 3000 : false,
  })
  return (
    <>
      {counts && (
        <div className='text-xs'>
          {t('stats', {
            total: counts.total,
            pending: counts.pending,
            running: counts.running,
            succeeded: counts.succeeded,
            failed: counts.failed,
          })}
        </div>
      )}
      <Button
        variant='outline'
        className='w-full'
        onClick={() => setOpen(true)}
      >
        {t('viewItems')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{t('items')}</DialogTitle>
          </DialogHeader>
          {items.isPending && <p>{t('loading')}</p>}
          {items.error && <p role='alert'>{items.error.message}</p>}
          {items.data?.data.map((item) => (
            <Link
              key={item.key}
              href={runLink(item.run_uid)}
              className='flex justify-between rounded border p-2 hover:bg-accent'
            >
              <span>{item.name}</span>
              <span>
                {item.started
                  ? t(
                      `status.${item.status as 'pending' | 'running' | 'succeeded' | 'failed'}`,
                    )
                  : t('waiting')}
              </span>
            </Link>
          ))}
          {items.data && (
            <div className='flex justify-between gap-2'>
              <Button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - 50))}
              >
                {t('previous')}
              </Button>
              <span>
                {offset + 1}–{Math.min(offset + 50, items.data.total)} /{' '}
                {items.data.total}
              </span>
              <Button
                disabled={!items.data.has_more}
                onClick={() => setOffset(offset + 50)}
              >
                {t('next')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
