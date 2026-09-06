'use client'

import type { ReactNode } from 'react'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function CodePageHeader({ children }: { children: ReactNode }) {
  return (
    <header className='flex h-12 shrink-0 items-center gap-2 border-b px-4'>
      <SidebarTrigger className='-ml-1' />
      <Separator orientation='vertical' className='mr-2! h-4!' />
      {children}
    </header>
  )
}
